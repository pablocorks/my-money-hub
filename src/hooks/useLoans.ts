import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

// Fixed user ID for single-user system
const FIXED_USER_ID = 'familiacarneiroxavier';

export interface Loan {
  id: string;
  user_id: string;
  name: string;
  due_date: string;
  installment_value: number;
  observation: string | null;
  status: 'pending' | 'paid';
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLoanData {
  name: string;
  due_date: string;
  installment_value: number;
  observation?: string | null;
}

export function useLoans() {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  const loansQuery = useQuery({
    queryKey: ['loans', FIXED_USER_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', FIXED_USER_ID)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Loan[];
    },
    enabled: isLoggedIn,
  });

  useEffect(() => {
    if (!isLoggedIn) return;

    const channel = supabase
      .channel('loans-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans',
          filter: `user_id=eq.${FIXED_USER_ID}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['loans', FIXED_USER_ID] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, queryClient]);

  const createLoanMutation = useMutation({
    mutationFn: async (data: CreateLoanData) => {
      const { data: loan, error } = await supabase
        .from('loans')
        .insert({
          ...data,
          user_id: FIXED_USER_ID,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return loan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Empréstimo cadastrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar empréstimo: ' + error.message);
    },
  });

  const updateLoanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Loan> }) => {
      const { error } = await supabase.from('loans').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Empréstimo atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar empréstimo: ' + error.message);
    },
  });

  const payLoanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loans')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Empréstimo marcado como pago!');
    },
    onError: (error) => {
      toast.error('Erro ao marcar empréstimo como pago: ' + error.message);
    },
  });

  const unpayLoanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loans')
        .update({
          status: 'pending',
          paid_at: null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Empréstimo retornado para pendente!');
    },
    onError: (error) => {
      toast.error('Erro ao retornar empréstimo: ' + error.message);
    },
  });

  const deleteLoanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Empréstimo excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir empréstimo: ' + error.message);
    },
  });

  return {
    loans: loansQuery.data || [],
    isLoading: loansQuery.isLoading,
    createLoan: createLoanMutation.mutate,
    updateLoan: updateLoanMutation.mutate,
    payLoan: payLoanMutation.mutate,
    unpayLoan: unpayLoanMutation.mutate,
    deleteLoan: deleteLoanMutation.mutate,
  };
}