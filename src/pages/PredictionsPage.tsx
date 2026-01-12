import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Header } from '@/components/dashboard/Header';
import { CategoryTag } from '@/components/dashboard/CategoryTag';
import { CategoryFilter } from '@/components/dashboard/CategoryFilter';
import { useIncomePredictions, IncomePrediction } from '@/hooks/useIncomePredictions';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Check, Trash2, ArrowUpDown, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PredictionsPage() {
  const { predictions, isLoading, createPrediction, updatePrediction, markAsPaid, deletePrediction } =
    useIncomePredictions();
  const { incomeCategories } = useCategories();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState<IncomePrediction | null>(null);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
  const [formData, setFormData] = useState({
    date: '',
    origin: '',
    value: '',
    category_ids: [] as string[],
  });

  const filteredPredictions = useMemo(() => {
    let pending = predictions.filter((p) => !p.paid_at);
    let paid = predictions.filter((p) => p.paid_at);

    if (categoryFilters.length > 0) {
      pending = pending.filter((p) =>
        p.categories?.some((cat) => categoryFilters.includes(cat.id))
      );
      paid = paid.filter((p) =>
        p.categories?.some((cat) => categoryFilters.includes(cat.id))
      );
    }

    const sortFn = (a: IncomePrediction, b: IncomePrediction) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return b.value - a.value;
    };

    return {
      pending: pending.sort(sortFn),
      paid: paid.sort(sortFn),
    };
  }, [predictions, categoryFilters, sortBy]);

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
      updatePrediction({
        id: editingPrediction.id,
        data: {
          date: data.date,
          origin: data.origin,
          value: data.value,
        },
        category_ids: data.category_ids,
      });
    } else {
      createPrediction(data);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (editingPrediction) {
      deletePrediction(editingPrediction.id);
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

  const renderPredictionCard = (prediction: IncomePrediction, showPayButton: boolean) => (
    <div
      key={prediction.id}
      className="py-3 px-4 bg-card rounded-lg border border-border hover:shadow-card transition-shadow"
    >
      {/* Line 1 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="text-sm text-muted-foreground">
            {format(new Date(prediction.date), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
          <div className="font-medium truncate">{prediction.origin}</div>
        </div>
        <div className="font-semibold text-primary">{formatCurrency(prediction.value)}</div>
      </div>

      {/* Line 2 */}
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
          {showPayButton && (
            <Button
              size="sm"
              className="h-8 gradient-success text-success-foreground"
              onClick={() => markAsPaid(prediction.id)}
            >
              <Check className="w-4 h-4 mr-1" />
              Pago
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <Skeleton className="h-[600px] rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl gradient-primary">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Previsões de Entrada</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas previsões de entradas de dinheiro
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CategoryFilter
                categories={incomeCategories}
                selectedCategories={categoryFilters}
                onSelectionChange={setCategoryFilters}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortBy(sortBy === 'date' ? 'value' : 'date')}
                className="h-8 text-xs"
              >
                <ArrowUpDown className="w-3 h-3 mr-1" />
                {sortBy === 'date' ? 'Data' : 'Valor'}
              </Button>
              <Button
                size="sm"
                className="gradient-primary text-primary-foreground"
                onClick={() => handleOpenForm()}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova Previsão
              </Button>
            </div>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pendentes ({filteredPredictions.pending.length})
              </TabsTrigger>
              <TabsTrigger value="paid">
                Concluídas ({filteredPredictions.paid.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-2">
              {filteredPredictions.pending.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma previsão pendente
                </div>
              ) : (
                filteredPredictions.pending.map((p) => renderPredictionCard(p, true))
              )}
            </TabsContent>

            <TabsContent value="paid" className="space-y-2">
              {filteredPredictions.paid.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma previsão concluída
                </div>
              ) : (
                filteredPredictions.paid.map((p) => renderPredictionCard(p, false))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

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
