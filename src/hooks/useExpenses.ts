import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface ExpenseEntry {
  id: string;
  user_id: string;
  name: string;
  date: string;
  value: number;
  bill_id: string | null;
  created_at: string;
  categories?: { id: string; name: string; color: string }[];
}

export function useExpenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      const { data: entries, error } = await supabase
        .from('expense_entries')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const entriesWithCategories = await Promise.all(
        entries.map(async (entry) => {
          const { data: expenseCategories } = await supabase
            .from('expense_categories')
            .select('category_id')
            .eq('expense_id', entry.id);

          if (expenseCategories && expenseCategories.length > 0) {
            const categoryIds = expenseCategories.map((ec) => ec.category_id);
            const { data: categories } = await supabase
              .from('categories')
              .select('id, name, color')
              .in('id', categoryIds);

            return { ...entry, categories: categories || [] };
          }

          return { ...entry, categories: [] };
        })
      );

      return entriesWithCategories as ExpenseEntry[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expense_entries',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expenses', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const createExpenseMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      date: string;
      value: number;
      category_ids?: string[];
    }) => {
      const { category_ids, ...entryData } = data;

      const { data: createdEntry, error } = await supabase
        .from('expense_entries')
        .insert({
          ...entryData,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (category_ids && category_ids.length > 0) {
        const expenseCategoriesData = category_ids.map((categoryId) => ({
          expense_id: createdEntry.id,
          category_id: categoryId,
        }));

        await supabase.from('expense_categories').insert(expenseCategoriesData);
      }

      return createdEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Saída cadastrada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar saída: ' + error.message);
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      category_ids,
    }: {
      id: string;
      data: Partial<ExpenseEntry>;
      category_ids?: string[];
    }) => {
      const { error } = await supabase.from('expense_entries').update(data).eq('id', id);
      if (error) throw error;

      if (category_ids !== undefined) {
        await supabase.from('expense_categories').delete().eq('expense_id', id);
        if (category_ids.length > 0) {
          const expenseCategoriesData = category_ids.map((categoryId) => ({
            expense_id: id,
            category_id: categoryId,
          }));
          await supabase.from('expense_categories').insert(expenseCategoriesData);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Saída atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar saída: ' + error.message);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expense_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Saída excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir saída: ' + error.message);
    },
  });

  return {
    expenses: expensesQuery.data || [],
    isLoading: expensesQuery.isLoading,
    createExpense: createExpenseMutation.mutate,
    updateExpense: updateExpenseMutation.mutate,
    deleteExpense: deleteExpenseMutation.mutate,
  };

  return {
    expenses: expensesQuery.data || [],
    isLoading: expensesQuery.isLoading,
    createExpense: createExpenseMutation.mutate,
    deleteExpense: deleteExpenseMutation.mutate,
  };
}
