import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { IncomeEntry } from '@/hooks/useIncome';
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
import { Plus, Pencil, TrendingUp } from 'lucide-react';

interface IncomeBlockProps {
  income: IncomeEntry[];
  onCreateIncome: (data: any) => void;
  onUpdateIncome: (data: any) => void;
  title?: string;
  maxHeight?: string;
  showAllEntries?: boolean;
}

export function IncomeBlock({
  income,
  onCreateIncome,
  onUpdateIncome,
  title = 'Entradas de Dinheiro',
  maxHeight = '400px',
  showAllEntries = false,
}: IncomeBlockProps) {
  const { incomeCategories } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    origin: '',
    account: '',
    value: '',
    category_ids: [] as string[],
  });

  // Filter to last 30 days if not showing all
  const filteredIncome = showAllEntries
    ? income
    : income.filter((entry) => {
        const entryDate = new Date(entry.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return entryDate >= thirtyDaysAgo;
      });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleOpenForm = (entry?: IncomeEntry) => {
    if (entry) {
      setEditingIncome(entry);
      setFormData({
        date: entry.date,
        origin: entry.origin,
        account: entry.account || '',
        value: entry.value.toString(),
        category_ids: entry.categories?.map((c) => c.id) || [],
      });
    } else {
      setEditingIncome(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        origin: '',
        account: '',
        value: '',
        category_ids: [],
      });
    }
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      date: formData.date,
      origin: formData.origin,
      account: formData.account || undefined,
      value: parseFloat(formData.value),
      category_ids: formData.category_ids,
    };

    if (editingIncome) {
      onUpdateIncome({
        id: editingIncome.id,
        data: {
          date: data.date,
          origin: data.origin,
          account: data.account,
          value: data.value,
        },
        category_ids: data.category_ids,
      });
    } else {
      onCreateIncome(data);
    }
    setFormOpen(false);
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter((id) => id !== categoryId)
        : [...prev.category_ids, categoryId],
    }));
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-success/10">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <h3 className="text-lg font-display font-semibold">{title}</h3>
        </div>
        <Button
          size="sm"
          className="h-8 gradient-success text-success-foreground"
          onClick={() => handleOpenForm()}
        >
          <Plus className="w-3 h-3 mr-1" />
          Nova
        </Button>
      </div>

      <ScrollArea style={{ maxHeight }} className="pr-2">
        <div className="space-y-2">
          {filteredIncome.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma entrada encontrada
            </div>
          ) : (
            filteredIncome.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 py-3 px-4 bg-background rounded-lg border border-border hover:shadow-card transition-shadow"
              >
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(entry.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                  <div className="font-medium truncate">{entry.origin}</div>
                  <div className="flex flex-wrap gap-1">
                    {entry.categories?.map((cat) => (
                      <CategoryTag key={cat.id} name={cat.name} color={cat.color} />
                    ))}
                  </div>
                  <div className="font-semibold text-success">{formatCurrency(entry.value)}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleOpenForm(entry)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIncome ? 'Editar entrada' : 'Nova entrada'}</DialogTitle>
            <DialogDescription>
              {editingIncome
                ? 'Atualize as informações da entrada'
                : 'Registre uma nova entrada de dinheiro'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="origin">Origem *</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Ex: Salário"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Conta</Label>
              <Input
                id="account"
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                placeholder="Ex: Banco do Brasil"
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
                {incomeCategories.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    Nenhuma categoria cadastrada
                  </span>
                ) : (
                  incomeCategories.map((category) => (
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
              <Button type="submit" className="gradient-success text-success-foreground">
                {editingIncome ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
