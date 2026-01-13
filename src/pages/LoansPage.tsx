import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Header } from '@/components/dashboard/Header';
import { useLoans, Loan, CreateLoanData } from '@/hooks/useLoans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Check, Undo2, Trash2, HandCoins, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoansPage() {
  const { loans, isLoading, createLoan, updateLoan, payLoan, unpayLoan, deleteLoan } = useLoans();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateLoanData>({
    name: '',
    due_date: '',
    installment_value: 0,
    observation: '',
  });

  const pendingLoans = loans.filter((loan) => loan.status === 'pending');
  const paidLoans = loans.filter((loan) => loan.status === 'paid');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleOpenForm = (loan?: Loan) => {
    if (loan) {
      setEditingLoan(loan);
      setFormData({
        name: loan.name,
        due_date: loan.due_date,
        installment_value: loan.installment_value,
        observation: loan.observation || '',
      });
    } else {
      setEditingLoan(null);
      setFormData({
        name: '',
        due_date: '',
        installment_value: 0,
        observation: '',
      });
    }
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLoan) {
      updateLoan({ id: editingLoan.id, data: formData });
    } else {
      createLoan(formData);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (loanToDelete) {
      deleteLoan(loanToDelete);
      setLoanToDelete(null);
    }
    setDeleteDialogOpen(false);
    setFormOpen(false);
  };

  const openDeleteDialog = (id: string) => {
    setLoanToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 space-y-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </main>
      </div>
    );
  }

  const LoanCard = ({ loan, showPayButton = false, showUnpayButton = false }: { loan: Loan; showPayButton?: boolean; showUnpayButton?: boolean }) => (
    <div className="py-3 px-4 bg-card rounded-lg border border-border hover:shadow-card transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="text-sm text-muted-foreground">
            {formatDate(loan.due_date)}
          </div>
          <div className="font-medium truncate">{loan.name}</div>
        </div>
        <div className="font-semibold text-foreground">
          {formatCurrency(loan.installment_value)}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground truncate flex-1">
          {loan.observation || '-'}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(loan)}>
            <Pencil className="w-4 h-4" />
          </Button>
          {showPayButton && (
            <Button
              size="sm"
              className="h-8 gradient-success text-success-foreground"
              onClick={() => payLoan(loan.id)}
            >
              <Check className="w-4 h-4 mr-1" />
              Paguei
            </Button>
          )}
          {showUnpayButton && (
            <Button size="sm" variant="outline" className="h-8" onClick={() => unpayLoan(loan.id)}>
              <Undo2 className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 space-y-6">
        {/* Pending Loans */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-warning/10">
                <AlertCircle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold">Empréstimos a Pagar</h2>
                <p className="text-sm text-muted-foreground">{pendingLoans.length} empréstimo(s)</p>
              </div>
            </div>
            <Button onClick={() => handleOpenForm()} className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Novo Empréstimo
            </Button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pendingLoans.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum empréstimo a pagar</p>
            ) : (
              pendingLoans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} showPayButton />
              ))
            )}
          </div>
        </div>

        {/* Paid Loans */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-success/10">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold">Empréstimos Pagos</h2>
              <p className="text-sm text-muted-foreground">{paidLoans.length} empréstimo(s)</p>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {paidLoans.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum empréstimo pago</p>
            ) : (
              paidLoans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} showUnpayButton />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLoan ? 'Editar Empréstimo' : 'Novo Empréstimo'}</DialogTitle>
            <DialogDescription>
              {editingLoan ? 'Altere os dados do empréstimo' : 'Cadastre um novo empréstimo pessoal'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Empréstimo João"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installment_value">Valor da Parcela</Label>
                <Input
                  id="installment_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.installment_value || ''}
                  onChange={(e) => setFormData({ ...formData, installment_value: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observation">Observações</Label>
                <Textarea
                  id="observation"
                  value={formData.observation || ''}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  placeholder="Observações opcionais..."
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {editingLoan && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => openDeleteDialog(editingLoan.id)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              )}
              <div className="flex gap-2 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="gradient-primary text-primary-foreground">
                  {editingLoan ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empréstimo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O empréstimo será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
