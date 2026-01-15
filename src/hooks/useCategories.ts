import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Fixed user ID for single-user system
const FIXED_USER_ID = 'familiacarneiroxavier';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  type: 'expense' | 'income';
  created_at: string;
}

export function useCategories() {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['categories', FIXED_USER_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', FIXED_USER_ID)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
    enabled: isLoggedIn,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; color: string; type: 'expense' | 'income' }) => {
      const { error } = await supabase.from('categories').insert({
        ...data,
        user_id: FIXED_USER_ID,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar categoria: ' + error.message);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; color: string };
    }) => {
      const { error } = await supabase.from('categories').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar categoria: ' + error.message);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir categoria: ' + error.message);
    },
  });

  return {
    categories: categoriesQuery.data || [],
    expenseCategories: categoriesQuery.data?.filter((c) => c.type === 'expense') || [],
    incomeCategories: categoriesQuery.data?.filter((c) => c.type === 'income') || [],
    isLoading: categoriesQuery.isLoading,
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
  };
}