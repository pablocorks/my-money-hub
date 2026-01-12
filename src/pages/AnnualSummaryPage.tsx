import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Header } from '@/components/dashboard/Header';
import { CategoryFilter } from '@/components/dashboard/CategoryFilter';
import { useBills } from '@/hooks/useBills';
import { useIncome } from '@/hooks/useIncome';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function AnnualSummaryPage() {
  const { bills, isLoading: billsLoading } = useBills();
  const { income, isLoading: incomeLoading } = useIncome();
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { categories } = useCategories();

  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMM/yy', { locale: ptBR });

      const filterByCategory = (items: any[]) => {
        if (categoryFilters.length === 0) return items;
        return items.filter((item) =>
          item.categories?.some((cat: any) => categoryFilters.includes(cat.id))
        );
      };

      // Bills to pay
      const monthBillsToPay = filterByCategory(
        bills.filter((bill) => {
          const dueDate = new Date(bill.due_date);
          return (
            bill.status === 'pending' &&
            dueDate >= monthStart &&
            dueDate <= monthEnd
          );
        })
      );

      // Bills paid
      const monthBillsPaid = filterByCategory(
        bills.filter((bill) => {
          if (bill.status !== 'paid' || !bill.paid_at) return false;
          const paidDate = new Date(bill.paid_at);
          return paidDate >= monthStart && paidDate <= monthEnd;
        })
      );

      // Income
      const monthIncome = filterByCategory(
        income.filter((entry) => {
          const entryDate = new Date(entry.date);
          return entryDate >= monthStart && entryDate <= monthEnd;
        })
      );

      // Expenses
      const monthExpenses = filterByCategory(
        expenses.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
      );

      // Overdue (calculated at month end)
      const overdueAtMonthEnd = filterByCategory(
        bills.filter((bill) => {
          const dueDate = new Date(bill.due_date);
          return bill.status === 'pending' && dueDate < monthStart;
        })
      );

      months.push({
        month: monthLabel,
        billsToPay: monthBillsToPay.reduce((sum, b) => sum + (b.value || 0), 0),
        billsPaid: monthBillsPaid.reduce((sum, b) => sum + (b.paid_value || 0), 0),
        income: monthIncome.reduce((sum, i) => sum + i.value, 0),
        expenses: monthExpenses.reduce((sum, e) => sum + e.value, 0),
        overdue: overdueAtMonthEnd.reduce((sum, b) => sum + (b.value || 0), 0),
      });
    }

    return months;
  }, [bills, income, expenses, categoryFilters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const isLoading = billsLoading || incomeLoading || expensesLoading;

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
      <main className="container py-6 space-y-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl gradient-primary">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Resumo Anual</h1>
                <p className="text-sm text-muted-foreground">
                  Evolução financeira dos últimos 12 meses
                </p>
              </div>
            </div>
            <CategoryFilter
              categories={categories}
              selectedCategories={categoryFilters}
              onSelectionChange={setCategoryFilters}
              label="Filtrar categorias"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Income vs Expenses */}
            <div className="bg-background rounded-xl border border-border p-4">
              <h3 className="text-lg font-semibold mb-4">Entradas vs Saídas</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Entradas"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--success))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    name="Saídas"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--destructive))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Bills to Pay */}
            <div className="bg-background rounded-xl border border-border p-4">
              <h3 className="text-lg font-semibold mb-4">Contas a Pagar</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="billsToPay"
                    name="A Pagar"
                    stroke="hsl(var(--warning))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--warning))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 3: Bills Paid */}
            <div className="bg-background rounded-xl border border-border p-4">
              <h3 className="text-lg font-semibold mb-4">Contas Pagas</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="billsPaid"
                    name="Pagas"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--success))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 4: Overdue */}
            <div className="bg-background rounded-xl border border-border p-4">
              <h3 className="text-lg font-semibold mb-4">Contas Vencidas</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="overdue"
                    name="Vencidas"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--destructive))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
