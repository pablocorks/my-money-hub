import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  due_date: string;
  value: number | null;
  paid_value: number | null;
  recurrence: 'single' | 'monthly' | 'custom';
  recurrence_months: number | null;
  total_installments: number | null;
  current_installment: number | null;
  observation: string | null;
  status: 'pending' | 'paid' | 'overdue';
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string; color: string }[];
}

export interface CreateBillData {
  name: string;
  due_date: string;
  value?: number | null;
  recurrence: 'single' | 'monthly' | 'custom';
  recurrence_months?: number | null;
  total_installments?: number | null;
  observation?: string | null;
  category_ids?: string[];
}

export function useBills() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const billsQuery = useQuery({
    queryKey: ['bills', user?.id],
    queryFn: async () => {
      const { data: bills, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user!.id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Fetch categories for each bill
      const billsWithCategories = await Promise.all(
        bills.map(async (bill) => {
          const { data: billCategories } = await supabase
            .from('bill_categories')
            .select('category_id')
            .eq('bill_id', bill.id);

          if (billCategories && billCategories.length > 0) {
            const categoryIds = billCategories.map((bc) => bc.category_id);
            const { data: categories } = await supabase
              .from('categories')
              .select('id, name, color')
              .in('id', categoryIds);

            return { ...bill, categories: categories || [] };
          }

          return { ...bill, categories: [] };
        })
      );

      return billsWithCategories as Bill[];
    },
    enabled: !!user,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('bills-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['bills', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const createBillMutation = useMutation({
    mutationFn: async (data: CreateBillData) => {
      const { category_ids, ...billData } = data;

      if (data.recurrence === 'monthly' && data.total_installments) {
        // Create multiple bills for installments
        const bills = [];
        for (let i = 0; i < data.total_installments; i++) {
          const dueDate = new Date(data.due_date);
          dueDate.setMonth(dueDate.getMonth() + i);
          
          bills.push({
            ...billData,
            user_id: user!.id,
            due_date: dueDate.toISOString().split('T')[0],
            current_installment: i + 1,
            status: 'pending' as const,
          });
        }

        const { data: createdBills, error } = await supabase
          .from('bills')
          .insert(bills)
          .select();

        if (error) throw error;

        // Add categories to all created bills
        if (category_ids && category_ids.length > 0) {
          const billCategoriesData = createdBills.flatMap((bill) =>
            category_ids.map((categoryId) => ({
              bill_id: bill.id,
              category_id: categoryId,
            }))
          );

          await supabase.from('bill_categories').insert(billCategoriesData);
        }

        return createdBills;
      } else {
        const { data: createdBill, error } = await supabase
          .from('bills')
          .insert({
            ...billData,
            user_id: user!.id,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;

        if (category_ids && category_ids.length > 0) {
          const billCategoriesData = category_ids.map((categoryId) => ({
            bill_id: createdBill.id,
            category_id: categoryId,
          }));

          await supabase.from('bill_categories').insert(billCategoriesData);
        }

        return [createdBill];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Conta cadastrada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar conta: ' + error.message);
    },
  });

  const updateBillMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      category_ids,
    }: {
      id: string;
      data: Partial<Bill>;
      category_ids?: string[];
    }) => {
      const { error } = await supabase.from('bills').update(data).eq('id', id);

      if (error) throw error;

      if (category_ids !== undefined) {
        await supabase.from('bill_categories').delete().eq('bill_id', id);

        if (category_ids.length > 0) {
          const billCategoriesData = category_ids.map((categoryId) => ({
            bill_id: id,
            category_id: categoryId,
          }));

          await supabase.from('bill_categories').insert(billCategoriesData);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Conta atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar conta: ' + error.message);
    },
  });

  const payBillMutation = useMutation({
    mutationFn: async ({ id, paidValue }: { id: string; paidValue: number }) => {
      const { data: bill, error: fetchError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('bills')
        .update({
          status: 'paid',
          paid_value: paidValue,
          paid_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create expense entry
      const { error: expenseError } = await supabase.from('expense_entries').insert({
        user_id: user!.id,
        name: bill.name,
        date: new Date().toISOString().split('T')[0],
        value: paidValue,
        bill_id: id,
      });

      if (expenseError) throw expenseError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Conta marcada como paga!');
    },
    onError: (error) => {
      toast.error('Erro ao marcar conta como paga: ' + error.message);
    },
  });

  const unpayBillMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: updateError } = await supabase
        .from('bills')
        .update({
          status: 'pending',
          paid_value: null,
          paid_at: null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Remove expense entry linked to this bill
      await supabase.from('expense_entries').delete().eq('bill_id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Conta retornada para pendente!');
    },
    onError: (error) => {
      toast.error('Erro ao retornar conta: ' + error.message);
    },
  });

  const deleteBillMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Conta excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir conta: ' + error.message);
    },
  });

  return {
    bills: billsQuery.data || [],
    isLoading: billsQuery.isLoading,
    createBill: createBillMutation.mutate,
    updateBill: updateBillMutation.mutate,
    payBill: payBillMutation.mutate,
    unpayBill: unpayBillMutation.mutate,
    deleteBill: deleteBillMutation.mutate,
  };
}
