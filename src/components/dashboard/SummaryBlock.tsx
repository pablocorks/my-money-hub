import { useMemo, useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bill } from '@/hooks/useBills';
import { IncomeEntry } from '@/hooks/useIncome';
import { ExpenseEntry } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { CategoryFilter } from './CategoryFilter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, TrendingDown, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface SummaryBlockProps {
  bills: Bill[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
}

type PeriodType = 'current' | '6months' | '12months' | '24months';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(210, 70%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(30, 70%, 50%)',
  'hsl(180, 70%, 50%)',
];

export function SummaryBlock({ bills, income, expenses }: SummaryBlockProps) {
  const { categories } = useCategories();
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [periodType, setPeriodType] = useState<PeriodType>('current');
  const [showCharts, setShowCharts] = useState(false);

  const periodMonths = useMemo(() => {
    switch (periodType) {
      case 'current': return 1;
      case '6months': return 6;
      case '12months': return 12;
      case '24months': return 24;
      default: return 1;
    }
  }, [periodType]);

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = periodMonths - 1; i >= 0; i--) {
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

      const monthBillsToPay = filterByCategory(bills.filter((bill) => {
        const dueDate = parseISO(bill.due_date);
        return bill.status === 'pending' && dueDate >= monthStart && dueDate <= monthEnd;
      }));

      const monthBillsPaid = filterByCategory(bills.filter((bill) => {
        if (bill.status !== 'paid' || !bill.paid_at) return false;
        const paidDate = new Date(bill.paid_at);
        return paidDate >= monthStart && paidDate <= monthEnd;
      }));

      const monthIncome = filterByCategory(income.filter((entry) => {
        const entryDate = parseISO(entry.date);
        return entryDate >= monthStart && entryDate <= monthEnd;
      }));

      const monthExpenses = filterByCategory(expenses.filter((expense) => {
        const expenseDate = parseISO(expense.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      }));

      const incomeTotal = monthIncome.reduce((sum, i) => sum + i.value, 0);
      const expensesTotal = monthExpenses.reduce((sum, e) => sum + e.value, 0);

      months.push({
        month: monthLabel,
        billsToPay: monthBillsToPay.reduce((sum, b) => sum + (b.value || 0), 0),
        billsPaid: monthBillsPaid.reduce((sum, b) => sum + (b.paid_value || 0), 0),
        income: incomeTotal,
        expenses: expensesTotal,
        balance: incomeTotal - expensesTotal,
      });
    }
    return months;
  }, [bills, income, expenses, categoryFilters, periodMonths]);

  // Category distribution data for pie chart
  const categoryDistribution = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(subMonths(now, periodMonths - 1));
    const monthEnd = endOfMonth(now);

    const filteredExpenses = expenses.filter((expense) => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });

    const categoryTotals: { [key: string]: number } = {};
    
    filteredExpenses.forEach((expense) => {
      if (expense.categories && expense.categories.length > 0) {
        expense.categories.forEach((cat: any) => {
          const catName = cat.name || 'Sem categoria';
          categoryTotals[catName] = (categoryTotals[catName] || 0) + expense.value;
        });
      } else {
        categoryTotals['Sem categoria'] = (categoryTotals['Sem categoria'] || 0) + expense.value;
      }
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [expenses, periodMonths]);

  // Income sources for pie chart
  const incomeSourcesData = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(subMonths(now, periodMonths - 1));
    const monthEnd = endOfMonth(now);

    const filteredIncome = income.filter((entry) => {
      const entryDate = parseISO(entry.date);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    const sourceTotals: { [key: string]: number } = {};
    
    filteredIncome.forEach((entry) => {
      sourceTotals[entry.origin] = (sourceTotals[entry.origin] || 0) + entry.value;
    });

    return Object.entries(sourceTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [income, periodMonths]);

  const summary = useMemo(() => {
    const lastMonth = chartData[chartData.length - 1] || { billsToPay: 0, billsPaid: 0, income: 0, expenses: 0, balance: 0 };
    const totalBillsToPay = bills.filter((b) => b.status === 'pending').reduce((sum, b) => sum + (b.value || 0), 0);
    return { ...lastMonth, totalBillsToPay, totalBillsToPayCount: bills.filter((b) => b.status === 'pending').length };
  }, [chartData, bills]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const balance = summary.income - summary.expenses;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>{entry.name}: {formatCurrency(entry.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl gradient-primary">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold">Resumo</h3>
            <p className="text-sm text-muted-foreground capitalize">{format(new Date(), 'MMMM yyyy', { locale: ptBR })}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
            <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Mês atual</SelectItem>
              <SelectItem value="6months">6 meses</SelectItem>
              <SelectItem value="12months">12 meses</SelectItem>
              <SelectItem value="24months">24 meses</SelectItem>
            </SelectContent>
          </Select>
          <CategoryFilter categories={categories} selectedCategories={categoryFilters} onSelectionChange={setCategoryFilters} />
          <Button variant="outline" size="sm" onClick={() => setShowCharts(!showCharts)}>
            {showCharts ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            {showCharts ? 'Ocultar' : 'Gráficos'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className={`p-4 rounded-xl border ${balance >= 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
          <div className="flex items-center gap-2 mb-2">{balance >= 0 ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}<span className="text-sm font-medium text-muted-foreground">Saldo</span></div>
          <div className={`text-base font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(balance)}</div>
        </div>
        <div className="p-4 rounded-xl bg-success/5 border border-success/20"><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-success" /><span className="text-sm font-medium text-muted-foreground">Entradas</span></div><div className="text-base font-bold text-success">{formatCurrency(summary.income)}</div></div>
        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20"><div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-destructive" /><span className="text-sm font-medium text-muted-foreground">Saídas</span></div><div className="text-base font-bold text-destructive">{formatCurrency(summary.expenses)}</div></div>
        <div className="p-4 rounded-xl bg-warning/5 border border-warning/20"><div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-warning" /><span className="text-sm font-medium text-muted-foreground">A pagar</span></div><div className="text-base font-bold text-warning">{formatCurrency(summary.billsToPay)}</div></div>
        <div className="p-4 rounded-xl bg-success/5 border border-success/20"><div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-success" /><span className="text-sm font-medium text-muted-foreground">Pagas</span></div><div className="text-base font-bold text-success">{formatCurrency(summary.billsPaid)}</div></div>
        <div className="p-4 rounded-xl bg-secondary border border-border"><div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium text-muted-foreground">Total pendente</span></div><div className="text-base font-bold text-foreground">{formatCurrency(summary.totalBillsToPay)}</div></div>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Line Chart - Entradas vs Saídas */}
          <div className="bg-background rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Entradas vs Saídas
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="income" name="Entradas" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))' }} />
                <Line type="monotone" dataKey="expenses" name="Saídas" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ fill: 'hsl(var(--destructive))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Bar Chart - Contas Pagas vs A Pagar */}
          <div className="bg-background rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Contas: Pagas vs A Pagar
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="billsPaid" name="Pagas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="billsToPay" name="A Pagar" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Area Chart - Evolução do Saldo */}
          <div className="bg-background rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Evolução do Saldo
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  name="Saldo" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4: Pie Chart - Distribuição de Gastos por Categoria */}
          <div className="bg-background rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              Gastos por Categoria
            </h4>
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name.substring(0, 10)}${name.length > 10 ? '...' : ''} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados de gastos no período
              </div>
            )}
          </div>

          {/* Chart 5: Pie Chart - Fontes de Receita */}
          <div className="bg-background rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Fontes de Receita
            </h4>
            {incomeSourcesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={incomeSourcesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name.substring(0, 10)}${name.length > 10 ? '...' : ''} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {incomeSourcesData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados de receita no período
              </div>
            )}
          </div>

          {/* Chart 6: Stacked Bar Chart - Comparativo Mensal Completo */}
          <div className="bg-background rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Comparativo Mensal
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
