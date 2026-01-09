import { useState, useMemo } from 'react';
import { Header } from '@/components/dashboard/Header';
import { useBills, Bill } from '@/hooks/useBills';
import { useCategories } from '@/hooks/useCategories';
import { BillCard } from '@/components/dashboard/BillCard';
import { BillForm } from '@/components/dashboard/BillForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, FileText, ArrowUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function BillsPage() {
  const { bills, isLoading, createBill, updateBill, payBill, unpayBill } = useBills();
  const { expenseCategories } = useCategories();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');

  const filteredBills = useMemo(() => {
    let result = [...bills];

    // Search
    if (search) {
      result = result.filter((bill) =>
        bill.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((bill) =>
        bill.categories?.some((cat) => cat.id === categoryFilter)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((bill) => bill.status === statusFilter);
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
  }, [bills, search, categoryFilter, statusFilter, sortBy]);

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl gradient-primary">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Contas a Pagar</h1>
              <p className="text-muted-foreground">Todas as suas contas em um só lugar</p>
            </div>
          </div>
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={() => {
              setEditingBill(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Paga</SelectItem>
              <SelectItem value="overdue">Vencida</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setSortBy(sortBy === 'date' ? 'value' : 'date')}
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {sortBy === 'date' ? 'Data' : 'Valor'}
          </Button>
        </div>

        {/* Bills List */}
        <div className="space-y-2">
          {filteredBills.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Nenhuma conta encontrada
            </div>
          ) : (
            filteredBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onPay={payBill}
                onUnpay={unpayBill}
                onEdit={handleEdit}
                showPayButton={bill.status !== 'paid'}
                showUnpayButton={bill.status === 'paid'}
              />
            ))
          )}
        </div>

        {/* Form Dialog */}
        <BillForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={createBill}
          onUpdate={updateBill}
          editingBill={editingBill}
        />
      </main>
    </div>
  );
}
