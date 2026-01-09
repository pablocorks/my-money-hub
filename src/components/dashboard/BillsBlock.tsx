import { useState, useMemo } from 'react';
import { Bill } from '@/hooks/useBills';
import { useCategories } from '@/hooks/useCategories';
import { BillCard } from './BillCard';
import { BillForm } from './BillForm';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, ArrowUpDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BillsBlockProps {
  title: string;
  bills: Bill[];
  onCreateBill?: (data: any) => void;
  onUpdateBill?: (data: any) => void;
  onPayBill?: (data: { id: string; paidValue: number }) => void;
  onUnpayBill?: (id: string) => void;
  showPayButton?: boolean;
  showUnpayButton?: boolean;
  showAddButton?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
  variant?: 'default' | 'danger' | 'success';
}

export function BillsBlock({
  title,
  bills,
  onCreateBill,
  onUpdateBill,
  onPayBill,
  onUnpayBill,
  showPayButton = false,
  showUnpayButton = false,
  showAddButton = false,
  emptyMessage = 'Nenhuma conta encontrada',
  maxHeight = '400px',
  variant = 'default',
}: BillsBlockProps) {
  const { expenseCategories } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');

  const filteredAndSortedBills = useMemo(() => {
    let result = [...bills];

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter((bill) =>
        bill.categories?.some((cat) => cat.id === categoryFilter)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else {
        return (b.value || 0) - (a.value || 0);
      }
    });

    return result;
  }, [bills, categoryFilter, sortBy]);

  const variantStyles = {
    default: 'border-border',
    danger: 'border-destructive/30 bg-destructive/5',
    success: 'border-success/30 bg-success/5',
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setFormOpen(true);
  };

  return (
    <div className={`bg-card rounded-xl border p-4 ${variantStyles[variant]}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-display font-semibold">{title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {expenseCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortBy(sortBy === 'date' ? 'value' : 'date')}
            className="h-8 text-xs"
          >
            <ArrowUpDown className="w-3 h-3 mr-1" />
            {sortBy === 'date' ? 'Data' : 'Valor'}
          </Button>

          {showAddButton && onCreateBill && (
            <Button
              size="sm"
              className="h-8 gradient-primary text-primary-foreground"
              onClick={() => {
                setEditingBill(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              Nova
            </Button>
          )}
        </div>
      </div>

      {/* Bills List */}
      <ScrollArea style={{ maxHeight }} className="pr-2">
        <div className="space-y-2">
          {filteredAndSortedBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
          ) : (
            filteredAndSortedBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onPay={onPayBill || (() => {})}
                onUnpay={onUnpayBill || (() => {})}
                onEdit={handleEdit}
                showPayButton={showPayButton}
                showUnpayButton={showUnpayButton}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Form Dialog */}
      {onCreateBill && (
        <BillForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={onCreateBill}
          onUpdate={onUpdateBill}
          editingBill={editingBill}
        />
      )}
    </div>
  );
}
