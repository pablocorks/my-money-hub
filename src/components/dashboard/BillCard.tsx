import { useState } from 'react';
import { format } from 'date-fns';
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
}

export function BillCard({
  bill,
  onPay,
  onUnpay,
  onEdit,
  showPayButton = false,
  showUnpayButton = false,
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

  return (
    <>
      <div className="flex items-center gap-4 py-3 px-4 bg-card rounded-lg border border-border hover:shadow-card transition-shadow">
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-6 gap-2 sm:gap-4 items-center">
          {/* Date */}
          <div className="text-sm text-muted-foreground">
            {format(new Date(bill.due_date), 'dd/MM/yyyy', { locale: ptBR })}
          </div>

          {/* Name */}
          <div className="sm:col-span-2 font-medium truncate">{bill.name}</div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {bill.categories?.map((cat) => (
              <CategoryTag key={cat.id} name={cat.name} color={cat.color} />
            ))}
          </div>

          {/* Value */}
          <div className="font-semibold text-foreground">
            {bill.status === 'paid' ? formatCurrency(bill.paid_value) : formatCurrency(bill.value)}
          </div>

          {/* Installment */}
          <div className="text-sm text-muted-foreground">
            {bill.total_installments && bill.current_installment && (
              <span className="bg-secondary px-2 py-1 rounded text-xs">
                {bill.current_installment}/{bill.total_installments}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(bill)}>
            <Pencil className="w-4 h-4" />
          </Button>

          {showPayButton && (
            <Button
              size="sm"
              className="gradient-success text-success-foreground"
              onClick={() => setPayDialogOpen(true)}
            >
              <Check className="w-4 h-4 mr-1" />
              Paguei
            </Button>
          )}

          {showUnpayButton && (
            <Button size="sm" variant="outline" onClick={() => onUnpay(bill.id)}>
              <Undo2 className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          )}
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
