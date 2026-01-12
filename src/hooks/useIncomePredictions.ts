import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface IncomePrediction {
  id: string;
  user_id: string;
  date: string;
  origin: string;
  value: number;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string; color: string }[];
}

export function useIncomePredictions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const predictionsQuery = useQuery({
    queryKey: ['income_predictions', user?.id],
    queryFn: async () => {
      const { data: entries, error } = await supabase
        .from('income_predictions')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const entriesWithCategories = await Promise.all(
        entries.map(async (entry) => {
          const { data: predictionCategories } = await supabase
            .from('income_prediction_categories')
            .select('category_id')
            .eq('prediction_id', entry.id);

          if (predictionCategories && predictionCategories.length > 0) {
            const categoryIds = predictionCategories.map((pc) => pc.category_id);
            const { data: categories } = await supabase
              .from('categories')
              .select('id, name, color')
              .in('id', categoryIds);

            return { ...entry, categories: categories || [] };
          }

          return { ...entry, categories: [] };
        })
      );

      return entriesWithCategories as IncomePrediction[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('income-predictions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'income_predictions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['income_predictions', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const createPredictionMutation = useMutation({
    mutationFn: async (data: {
      date: string;
      origin: string;
      value: number;
      category_ids?: string[];
    }) => {
      const { category_ids, ...entryData } = data;

      const { data: createdEntry, error } = await supabase
        .from('income_predictions')
        .insert({
          ...entryData,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (category_ids && category_ids.length > 0) {
        const predictionCategoriesData = category_ids.map((categoryId) => ({
          prediction_id: createdEntry.id,
          category_id: categoryId,
        }));

        await supabase.from('income_prediction_categories').insert(predictionCategoriesData);
      }

      return createdEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_predictions'] });
      toast.success('Previsão cadastrada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar previsão: ' + error.message);
    },
  });

  const updatePredictionMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      category_ids,
    }: {
      id: string;
      data: Partial<IncomePrediction>;
      category_ids?: string[];
    }) => {
      const { error } = await supabase.from('income_predictions').update(data).eq('id', id);

      if (error) throw error;

      if (category_ids !== undefined) {
        await supabase.from('income_prediction_categories').delete().eq('prediction_id', id);

        if (category_ids.length > 0) {
          const predictionCategoriesData = category_ids.map((categoryId) => ({
            prediction_id: id,
            category_id: categoryId,
          }));

          await supabase.from('income_prediction_categories').insert(predictionCategoriesData);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_predictions'] });
      toast.success('Previsão atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar previsão: ' + error.message);
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('income_predictions')
        .update({ paid_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_predictions'] });
      toast.success('Previsão marcada como paga!');
    },
    onError: (error) => {
      toast.error('Erro ao marcar previsão: ' + error.message);
    },
  });

  const deletePredictionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('income_predictions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_predictions'] });
      toast.success('Previsão excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir previsão: ' + error.message);
    },
  });

  return {
    predictions: predictionsQuery.data || [],
    isLoading: predictionsQuery.isLoading,
    createPrediction: createPredictionMutation.mutate,
    updatePrediction: updatePredictionMutation.mutate,
    markAsPaid: markAsPaidMutation.mutate,
    deletePrediction: deletePredictionMutation.mutate,
  };
}
