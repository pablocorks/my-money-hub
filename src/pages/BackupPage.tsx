import { useState } from 'react';
import { Header } from '@/components/dashboard/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Download, Upload, Database, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Fixed user ID for single-user system
const FIXED_USER_ID = 'familiacarneiroxavier';

interface BackupData {
  version: string;
  created_at: string;
  user_id: string;
  data: {
    categories: any[];
    bills: any[];
    bill_categories: any[];
    income_entries: any[];
    income_categories: any[];
    expense_entries: any[];
    expense_categories: any[];
    income_predictions: any[];
    income_prediction_categories: any[];
    loans: any[];
  };
}

export default function BackupPage() {
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<BackupData | null>(null);

  const handleBackup = async () => {
    if (!isLoggedIn) return;
    setLoading(true);

    try {
      // Fetch all user data
      const [
        categoriesRes,
        billsRes,
        billCategoriesRes,
        incomeRes,
        incomeCategoriesRes,
        expensesRes,
        expenseCategoriesRes,
        predictionsRes,
        predictionCategoriesRes,
        loansRes,
      ] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', FIXED_USER_ID),
        supabase.from('bills').select('*').eq('user_id', FIXED_USER_ID),
        supabase.from('bill_categories').select('*, bills!inner(user_id)').eq('bills.user_id', FIXED_USER_ID),
        supabase.from('income_entries').select('*').eq('user_id', FIXED_USER_ID),
        supabase.from('income_categories').select('*, income_entries!inner(user_id)').eq('income_entries.user_id', FIXED_USER_ID),
        supabase.from('expense_entries').select('*').eq('user_id', FIXED_USER_ID),
        supabase.from('expense_categories').select('*, expense_entries!inner(user_id)').eq('expense_entries.user_id', FIXED_USER_ID),
        supabase.from('income_predictions').select('*').eq('user_id', FIXED_USER_ID),
        supabase.from('income_prediction_categories').select('*, income_predictions!inner(user_id)').eq('income_predictions.user_id', FIXED_USER_ID),
        supabase.from('loans').select('*').eq('user_id', FIXED_USER_ID),
      ]);

      const backup: BackupData = {
        version: '1.0',
        created_at: new Date().toISOString(),
        user_id: FIXED_USER_ID,
        data: {
          categories: categoriesRes.data || [],
          bills: billsRes.data || [],
          bill_categories: (billCategoriesRes.data || []).map(({ bills, ...rest }) => rest),
          income_entries: incomeRes.data || [],
          income_categories: (incomeCategoriesRes.data || []).map(({ income_entries, ...rest }) => rest),
          expense_entries: expensesRes.data || [],
          expense_categories: (expenseCategoriesRes.data || []).map(({ expense_entries, ...rest }) => rest),
          income_predictions: predictionsRes.data || [],
          income_prediction_categories: (predictionCategoriesRes.data || []).map(({ income_predictions, ...rest }) => rest),
          loans: loansRes.data || [],
        },
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pimpows-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup realizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao fazer backup: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string) as BackupData;
        
        if (!backup.version || !backup.data) {
          toast.error('Arquivo de backup inválido');
          return;
        }

        setBackupToRestore(backup);
        setRestoreDialogOpen(true);
      } catch (error) {
        toast.error('Erro ao ler arquivo de backup');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestore = async () => {
    if (!isLoggedIn || !backupToRestore) return;
    setLoading(true);
    setRestoreDialogOpen(false);

    try {
      const { data } = backupToRestore;

      // Delete existing data in correct order (respect foreign keys)
      await Promise.all([
        supabase.from('bill_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('income_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('expense_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('income_prediction_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);

      await Promise.all([
        supabase.from('bills').delete().eq('user_id', FIXED_USER_ID),
        supabase.from('income_entries').delete().eq('user_id', FIXED_USER_ID),
        supabase.from('expense_entries').delete().eq('user_id', FIXED_USER_ID),
        supabase.from('income_predictions').delete().eq('user_id', FIXED_USER_ID),
        supabase.from('loans').delete().eq('user_id', FIXED_USER_ID),
      ]);

      await supabase.from('categories').delete().eq('user_id', FIXED_USER_ID);

      // Restore data with fixed user_id
      if (data.categories.length > 0) {
        const categories = data.categories.map((c) => ({ ...c, user_id: FIXED_USER_ID }));
        await supabase.from('categories').insert(categories);
      }

      if (data.bills.length > 0) {
        const bills = data.bills.map((b) => ({ ...b, user_id: FIXED_USER_ID }));
        await supabase.from('bills').insert(bills);
      }

      if (data.bill_categories.length > 0) {
        await supabase.from('bill_categories').insert(data.bill_categories);
      }

      if (data.income_entries.length > 0) {
        const income = data.income_entries.map((i) => ({ ...i, user_id: FIXED_USER_ID }));
        await supabase.from('income_entries').insert(income);
      }

      if (data.income_categories.length > 0) {
        await supabase.from('income_categories').insert(data.income_categories);
      }

      if (data.expense_entries.length > 0) {
        const expenses = data.expense_entries.map((e) => ({ ...e, user_id: FIXED_USER_ID }));
        await supabase.from('expense_entries').insert(expenses);
      }

      if (data.expense_categories.length > 0) {
        await supabase.from('expense_categories').insert(data.expense_categories);
      }

      if (data.income_predictions.length > 0) {
        const predictions = data.income_predictions.map((p) => ({ ...p, user_id: FIXED_USER_ID }));
        await supabase.from('income_predictions').insert(predictions);
      }

      if (data.income_prediction_categories.length > 0) {
        await supabase.from('income_prediction_categories').insert(data.income_prediction_categories);
      }

      if (data.loans.length > 0) {
        const loans = data.loans.map((l) => ({ ...l, user_id: FIXED_USER_ID }));
        await supabase.from('loans').insert(loans);
      }

      toast.success('Backup restaurado com sucesso! Recarregue a página para ver as alterações.');
    } catch (error: any) {
      toast.error('Erro ao restaurar backup: ' + error.message);
    } finally {
      setLoading(false);
      setBackupToRestore(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl gradient-primary">
            <Database className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Central de Backup</h1>
            <p className="text-sm text-muted-foreground">Faça backup e restaure seus dados</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Backup Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Fazer Backup
              </CardTitle>
              <CardDescription>
                Baixe todos os seus dados em um arquivo JSON. Guarde esse arquivo em local seguro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleBackup}
                disabled={loading}
                className="gradient-primary text-primary-foreground"
              >
                <Download className="w-4 h-4 mr-2" />
                {loading ? 'Gerando backup...' : 'Baixar Backup'}
              </Button>
            </CardContent>
          </Card>

          {/* Restore Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Restaurar Backup
              </CardTitle>
              <CardDescription>
                Restaure seus dados a partir de um arquivo de backup. Atenção: isso substituirá todos os seus dados atuais!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Atenção!</p>
                  <p className="text-muted-foreground">
                    Ao restaurar um backup, todos os seus dados atuais serão substituídos pelos dados do arquivo.
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup-file">Selecionar arquivo de backup</Label>
                <Input
                  id="backup-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar backup?</AlertDialogTitle>
            <AlertDialogDescription>
              {backupToRestore && (
                <>
                  Backup criado em: {new Date(backupToRestore.created_at).toLocaleString('pt-BR')}
                  <br /><br />
                  Esta ação irá substituir todos os seus dados atuais pelos dados do backup.
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}