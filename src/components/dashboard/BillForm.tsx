import { useState, useEffect } from 'react';
import { Bill, CreateBillData } from '@/hooks/useBills';
import { useCategories } from '@/hooks/useCategories';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';

interface BillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBillData) => void;
  onUpdate?: (data: { id: string; data: Partial<Bill>; category_ids?: string[] }) => void;
  onDelete?: (id: string) => void;
  editingBill?: Bill | null;
}

export function BillForm({ open, onOpenChange, onSubmit, onUpdate, onDelete, editingBill }: BillFormProps) {
  const { expenseCategories } = useCategories();
  const [formData, setFormData] = useState<CreateBillData>({
    name: '',
    due_date: '',
    value: null,
    recurrence: 'single',
    recurrence_months: null,
    total_installments: null,
    observation: null,
    category_ids: [],
  });

  useEffect(() => {
    if (editingBill) {
      setFormData({
        name: editingBill.name,
        due_date: editingBill.due_date,
        value: editingBill.value,
        recurrence: editingBill.recurrence,
        recurrence_months: editingBill.recurrence_months,
        total_installments: editingBill.total_installments,
        observation: editingBill.observation,
        category_ids: editingBill.categories?.map((c) => c.id) || [],
      });
    } else {
      setFormData({
        name: '',
        due_date: '',
        value: null,
        recurrence: 'single',
        recurrence_months: null,
        total_installments: null,
        observation: null,
        category_ids: [],
      });
    }
  }, [editingBill, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBill && onUpdate) {
      onUpdate({
        id: editingBill.id,
        data: {
          name: formData.name,
          due_date: formData.due_date,
          value: formData.value,
          observation: formData.observation,
        },
        category_ids: formData.category_ids,
      });
    } else {
      onSubmit(formData);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (editingBill && onDelete) {
      onDelete(editingBill.id);
      onOpenChange(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: prev.category_ids?.includes(categoryId)
        ? prev.category_ids.filter((id) => id !== categoryId)
        : [...(prev.category_ids || []), categoryId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingBill ? 'Editar conta' : 'Nova conta a pagar'}</DialogTitle>
          <DialogDescription>
            {editingBill
              ? 'Atualize as informações da conta'
              : 'Preencha os dados da nova conta a pagar'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da conta *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Conta de luz"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Data de vencimento *</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor (opcional)</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={formData.value || ''}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value ? parseFloat(e.target.value) : null })
              }
              placeholder="0,00"
            />
          </div>

          {!editingBill && (
            <>
              <div className="space-y-2">
                <Label htmlFor="recurrence">Recorrência</Label>
                <Select
                  value={formData.recurrence}
                  onValueChange={(value: 'single' | 'monthly' | 'custom') =>
                    setFormData({ ...formData, recurrence: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Única</SelectItem>
                    <SelectItem value="monthly">Mensal (parcelado)</SelectItem>
                    <SelectItem value="custom">A cada X meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.recurrence === 'monthly' && (
                <div className="space-y-2">
                  <Label htmlFor="total_installments">Número de parcelas</Label>
                  <Input
                    id="total_installments"
                    type="number"
                    min="2"
                    value={formData.total_installments || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_installments: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Ex: 12"
                  />
                </div>
              )}

              {formData.recurrence === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="recurrence_months">A cada quantos meses?</Label>
                  <Input
                    id="recurrence_months"
                    type="number"
                    min="1"
                    value={formData.recurrence_months || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurrence_months: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Ex: 3"
                  />
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Categorias</Label>
            <div className="flex flex-wrap gap-2 p-3 bg-secondary rounded-lg max-h-32 overflow-y-auto">
              {expenseCategories.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  Nenhuma categoria cadastrada
                </span>
              ) : (
                expenseCategories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.category_ids?.includes(category.id)}
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

          <div className="space-y-2">
            <Label htmlFor="observation">Observação</Label>
            <Textarea
              id="observation"
              value={formData.observation || ''}
              onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
              placeholder="Observações sobre esta conta..."
              rows={2}
            />
          </div>

          <DialogFooter className="flex justify-between">
            {editingBill && onDelete && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-1" />
                Apagar
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary text-primary-foreground">
                {editingBill ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
