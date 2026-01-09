import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExpenseEntry } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { CategoryTag } from './CategoryTag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, TrendingDown } from 'lucide-react';

interface ExpenseBlockProps {
  expenses: ExpenseEntry[];
  onCreateExpense: (data: any) => void;
  title?: string;
  maxHeight?: string;
}

export function ExpenseBlock({
  expenses,
  onCreateExpense,
  title = 'Saídas de Dinheiro',
  maxHeight = '400px',
}: ExpenseBlockProps) {
  const { expenseCategories } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    value: '',
    category_ids: [] as string[],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateExpense({
      name: formData.name,
      date: formData.date,
      value: parseFloat(formData.value),
      category_ids: formData.category_ids,
    });
    setFormOpen(false);
    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      value: '',
      category_ids: [],
    });
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter((id) => id !== categoryId)
        : [...prev.category_ids, categoryId],
    }));
  };

  // Filter to current month
  const currentMonthExpenses = expenses.filter((entry) => {
    const entryDate = new Date(entry.date);
    const now = new Date();
    return (
      entryDate.getMonth() === now.getMonth() &&
      entryDate.getFullYear() === now.getFullYear()
    );
  });

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-destructive/10">
            <TrendingDown className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="text-lg font-display font-semibold">{title}</h3>
        </div>
        <Button
          size="sm"
          className="h-8 gradient-danger text-destructive-foreground"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="w-3 h-3 mr-1" />
          Nova
        </Button>
      </div>

      <ScrollArea style={{ maxHeight }} className="pr-2">
        <div className="space-y-2">
          {currentMonthExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma saída encontrada neste mês
            </div>
          ) : (
            currentMonthExpenses.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 py-3 px-4 bg-background rounded-lg border border-border hover:shadow-card transition-shadow"
              >
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(entry.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                  <div className="font-medium truncate">{entry.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {entry.categories?.map((cat) => (
                      <CategoryTag key={cat.id} name={cat.name} color={cat.color} />
                    ))}
                    {entry.bill_id && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
                        Conta paga
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-destructive">
                    -{formatCurrency(entry.value)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova saída</DialogTitle>
            <DialogDescription>Registre uma saída de dinheiro</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Compras no mercado"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Categorias</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-secondary rounded-lg max-h-32 overflow-y-auto">
                {expenseCategories.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    Nenhuma categoria cadastrada
                  </span>
                ) : (
                  expenseCategories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.category_ids.includes(category.id)}
                        onCheckedChange={() => toggleCategory(category.id)}
                      />
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                          border: `1px solid ${category.color}40`,
                        }}
                      >
                        {category.name}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-danger text-destructive-foreground">
                Cadastrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
