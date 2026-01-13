import { useState } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bill } from '@/hooks/useBills';
import { CategoryTag } from './CategoryTag';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Undo2, Pencil } from 'lucide-react';

interface BillCardProps {
  bill: Bill;
  onPay: (data: { id: string; paidValue: number }) => void;
  onUnpay: (id: string) => void;
  onEdit: (bill: Bill) => void;
  showPayButton?: boolean;
  showUnpayButton?: boolean;
  showEditButton?: boolean;
}

export function BillCard({
  bill,
  onPay,
  onUnpay,
  onEdit,
  showPayButton = false,
  showUnpayButton = false,
  showEditButton = true,
}: BillCardProps) {
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [paidValue, setPaidValue] = useState(bill.value?.toString() || '');

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handlePay = () => {
    const value = parseFloat(paidValue) || 0;
    onPay({ id: bill.id, paidValue: value });
    setPayDialogOpen(false);
  };

  // Parse date correctly to avoid timezone issues
  const dueDate = parseISO(bill.due_date);
  const isDueToday = isToday(dueDate);

  return (
    <>
      <div className={`py-3 px-4 bg-card rounded-lg border hover:shadow-card transition-shadow ${
        isDueToday && bill.status === 'pending' 
          ? 'border-warning border-2 shadow-[0_0_10px_rgba(234,179,8,0.3)]' 
          : 'border-border'
      }`}>
        {/* Line 1: Date, Name, Installment, Value */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`text-sm ${isDueToday && bill.status === 'pending' ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>
              {format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}
            </div>
            <div className="font-medium truncate flex items-center gap-2">
              {bill.name}
              {bill.total_installments && bill.current_installment && (
                <span className="bg-secondary px-2 py-0.5 rounded text-xs text-muted-foreground">
                  {bill.current_installment}/{bill.total_installments}
                </span>
              )}
            </div>
          </div>
          <div className="font-semibold text-foreground">
            {bill.status === 'paid' ? formatCurrency(bill.paid_value) : formatCurrency(bill.value)}
          </div>
        </div>

        {/* Line 2: Categories, Edit button, Pay/Unpay button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {bill.categories?.map((cat) => (
              <CategoryTag key={cat.id} name={cat.name} color={cat.color} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {showEditButton && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(bill)}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}

            {showPayButton && (
              <Button
                size="sm"
                className="h-8 gradient-success text-success-foreground"
                onClick={() => setPayDialogOpen(true)}
              >
                <Check className="w-4 h-4 mr-1" />
                Paguei
              </Button>
            )}

            {showUnpayButton && (
              <Button size="sm" variant="outline" className="h-8" onClick={() => onUnpay(bill.id)}>
                <Undo2 className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar pagamento</DialogTitle>
            <DialogDescription>
              Informe o valor pago para a conta "{bill.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paidValue">Valor pago</Label>
              <Input
                id="paidValue"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={paidValue}
                onChange={(e) => setPaidValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="gradient-success text-success-foreground" onClick={handlePay}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
