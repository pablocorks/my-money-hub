import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

// Fixed user ID for single-user system
const FIXED_USER_ID = 'familiacarneiroxavier';

export interface IncomeEntry {
  id: string;
  user_id: string;
  date: string;
  origin: string;
  account: string | null;
  value: number;
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string; color: string }[];
}

export function useIncome() {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  const incomeQuery = useQuery({
    queryKey: ['income', FIXED_USER_ID],
    queryFn: async () => {
      const { data: entries, error } = await supabase
        .from('income_entries')
        .select('*')
        .eq('user_id', FIXED_USER_ID)
        .order('date', { ascending: false });

      if (error) throw error;

      const entriesWithCategories = await Promise.all(
        entries.map(async (entry) => {
          const { data: incomeCategories } = await supabase
            .from('income_categories')
            .select('category_id')
            .eq('income_id', entry.id);

          if (incomeCategories && incomeCategories.length > 0) {
            const categoryIds = incomeCategories.map((ic) => ic.category_id);
            const { data: categories } = await supabase
              .from('categories')
              .select('id, name, color')
              .in('id', categoryIds);

            return { ...entry, categories: categories || [] };
          }

          return { ...entry, categories: [] };
        })
      );

      return entriesWithCategories as IncomeEntry[];
    },
    enabled: isLoggedIn,
  });

  useEffect(() => {
    if (!isLoggedIn) return;

    const channel = supabase
      .channel('income-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'income_entries',
          filter: `user_id=eq.${FIXED_USER_ID}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['income', FIXED_USER_ID] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, queryClient]);

  const createIncomeMutation = useMutation({
    mutationFn: async (data: {
      date: string;
      origin: string;
      account?: string;
      value: number;
      category_ids?: string[];
    }) => {
      const { category_ids, ...entryData } = data;

      const { data: createdEntry, error } = await supabase
        .from('income_entries')
        .insert({
          ...entryData,
          user_id: FIXED_USER_ID,
        })
        .select()
        .single();

      if (error) throw error;

      if (category_ids && category_ids.length > 0) {
        const incomeCategoriesData = category_ids.map((categoryId) => ({
          income_id: createdEntry.id,
          category_id: categoryId,
        }));

        await supabase.from('income_categories').insert(incomeCategoriesData);
      }

      return createdEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast.success('Entrada cadastrada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar entrada: ' + error.message);
    },
  });

  const updateIncomeMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      category_ids,
    }: {
      id: string;
      data: Partial<IncomeEntry>;
      category_ids?: string[];
    }) => {
      const { error } = await supabase.from('income_entries').update(data).eq('id', id);

      if (error) throw error;

      if (category_ids !== undefined) {
        await supabase.from('income_categories').delete().eq('income_id', id);

        if (category_ids.length > 0) {
          const incomeCategoriesData = category_ids.map((categoryId) => ({
            income_id: id,
            category_id: categoryId,
          }));

          await supabase.from('income_categories').insert(incomeCategoriesData);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast.success('Entrada atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar entrada: ' + error.message);
    },
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('income_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast.success('Entrada excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir entrada: ' + error.message);
    },
  });

  return {
    income: incomeQuery.data || [],
    isLoading: incomeQuery.isLoading,
    createIncome: createIncomeMutation.mutate,
    updateIncome: updateIncomeMutation.mutate,
    deleteIncome: deleteIncomeMutation.mutate,
  };
}