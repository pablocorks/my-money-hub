import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { IncomePrediction } from '@/hooks/useIncomePredictions';
import { useCategories } from '@/hooks/useCategories';
import { CategoryTag } from './CategoryTag';
import { CategoryFilter } from './CategoryFilter';
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
import { Plus, Pencil, Calendar, Check, Trash2 } from 'lucide-react';

interface IncomePredictionBlockProps {
  predictions: IncomePrediction[];
  onCreatePrediction: (data: any) => void;
  onUpdatePrediction: (data: any) => void;
  onMarkAsPaid: (id: string) => void;
  onDeletePrediction: (id: string) => void;
  title?: string;
  maxHeight?: string;
}

export function IncomePredictionBlock({
  predictions,
  onCreatePrediction,
  onUpdatePrediction,
  onMarkAsPaid,
  onDeletePrediction,
  title = 'Previsão de Entradas',
  maxHeight = '400px',
}: IncomePredictionBlockProps) {
  const { incomeCategories } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState<IncomePrediction | null>(null);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    origin: '',
    value: '',
    category_ids: [] as string[],
  });

  // Filter pending predictions (not paid)
  const pendingPredictions = useMemo(() => {
    let result = predictions.filter((p) => !p.paid_at);
    
    if (categoryFilters.length > 0) {
      result = result.filter((p) =>
        p.categories?.some((cat) => categoryFilters.includes(cat.id))
      );
    }
    
    return result;
  }, [predictions, categoryFilters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleOpenForm = (prediction?: IncomePrediction) => {
    if (prediction) {
      setEditingPrediction(prediction);
      setFormData({
        date: prediction.date,
        origin: prediction.origin,
        value: prediction.value.toString(),
        category_ids: prediction.categories?.map((c) => c.id) || [],
      });
    } else {
      setEditingPrediction(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        origin: '',
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
      value: parseFloat(formData.value),
      category_ids: formData.category_ids,
    };

    if (editingPrediction) {
      onUpdatePrediction({
        id: editingPrediction.id,
        data: {
          date: data.date,
          origin: data.origin,
          value: data.value,
        },
        category_ids: data.category_ids,
      });
    } else {
      onCreatePrediction(data);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (editingPrediction) {
      onDeletePrediction(editingPrediction.id);
      setFormOpen(false);
    }
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
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-display font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <CategoryFilter
            categories={incomeCategories}
            selectedCategories={categoryFilters}
            onSelectionChange={setCategoryFilters}
          />
          <Button
            size="sm"
            className="h-8 gradient-primary text-primary-foreground"
            onClick={() => handleOpenForm()}
          >
            <Plus className="w-3 h-3 mr-1" />
            Nova
          </Button>
        </div>
      </div>

      <ScrollArea style={{ maxHeight }} className="pr-2">
        <div className="space-y-2">
          {pendingPredictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma previsão pendente
            </div>
          ) : (
            pendingPredictions.map((prediction) => (
              <div
                key={prediction.id}
                className="py-3 px-4 bg-background rounded-lg border border-border hover:shadow-card transition-shadow"
              >
                {/* Line 1: Date, Name, Value */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(prediction.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    <div className="font-medium truncate">{prediction.origin}</div>
                  </div>
                  <div className="font-semibold text-primary">{formatCurrency(prediction.value)}</div>
                </div>
                
                {/* Line 2: Tags, Edit, Paid button */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {prediction.categories?.map((cat) => (
                      <CategoryTag key={cat.id} name={cat.name} color={cat.color} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(prediction)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 gradient-success text-success-foreground"
                      onClick={() => onMarkAsPaid(prediction.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Pago
                    </Button>
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
            <DialogTitle>{editingPrediction ? 'Editar previsão' : 'Nova previsão'}</DialogTitle>
            <DialogDescription>
              {editingPrediction
                ? 'Atualize as informações da previsão'
                : 'Registre uma nova previsão de entrada'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data prevista *</Label>
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

            <DialogFooter className="flex justify-between">
              {editingPrediction && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Apagar
                </Button>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="gradient-primary text-primary-foreground">
                  {editingPrediction ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
