import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bill } from '@/hooks/useBills';
import { IncomeEntry } from '@/hooks/useIncome';
import { ExpenseEntry } from '@/hooks/useExpenses';
import { useCategories, Category } from '@/hooks/useCategories';
import { CategoryFilter } from './CategoryFilter';
import { BarChart3, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

interface SummaryBlockProps {
  bills: Bill[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
}

export function SummaryBlock({ bills, income, expenses }: SummaryBlockProps) {
  const { categories } = useCategories();
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);

  const currentMonth = useMemo(() => {
    return format(new Date(), 'MMMM yyyy', { locale: ptBR });
  }, []);

  const summary = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const filterByCategory = (items: any[], categoryField: string = 'categories') => {
      if (categoryFilters.length === 0) return items;
      return items.filter((item) =>
        item[categoryField]?.some((cat: Category) => categoryFilters.includes(cat.id))
      );
    };

    // Bills to pay this month
    const monthlyBillsToPay = filterByCategory(
      bills.filter((bill) => {
        const dueDate = new Date(bill.due_date);
        return (
          bill.status === 'pending' &&
          dueDate >= currentMonthStart &&
          dueDate <= currentMonthEnd
        );
      })
    );

    // Total bills to pay (all pending)
    const totalBillsToPay = filterByCategory(bills.filter((bill) => bill.status === 'pending'));

    // Bills paid this month
    const monthlyBillsPaid = filterByCategory(
      bills.filter((bill) => {
        if (bill.status !== 'paid' || !bill.paid_at) return false;
        const paidDate = new Date(bill.paid_at);
        return paidDate >= currentMonthStart && paidDate <= currentMonthEnd;
      })
    );

    // Expenses this month
    const monthlyExpenses = filterByCategory(
      expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= currentMonthStart && expenseDate <= currentMonthEnd;
      })
    );

    // Income this month
    const monthlyIncome = filterByCategory(
      income.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= currentMonthStart && entryDate <= currentMonthEnd;
      })
    );

    return {
      monthlyBillsToPayTotal: monthlyBillsToPay.reduce((sum, bill) => sum + (bill.value || 0), 0),
      monthlyBillsToPayCount: monthlyBillsToPay.length,
      totalBillsToPayTotal: totalBillsToPay.reduce((sum, bill) => sum + (bill.value || 0), 0),
      totalBillsToPayCount: totalBillsToPay.length,
      monthlyBillsPaidTotal: monthlyBillsPaid.reduce(
        (sum, bill) => sum + (bill.paid_value || 0),
        0
      ),
      monthlyBillsPaidCount: monthlyBillsPaid.length,
      monthlyExpensesTotal: monthlyExpenses.reduce((sum, expense) => sum + expense.value, 0),
      monthlyExpensesCount: monthlyExpenses.length,
      monthlyIncomeTotal: monthlyIncome.reduce((sum, entry) => sum + entry.value, 0),
      monthlyIncomeCount: monthlyIncome.length,
    };
  }, [bills, income, expenses, categoryFilters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const balance = summary.monthlyIncomeTotal - summary.monthlyExpensesTotal;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl gradient-primary">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold">Resumo do Mês</h3>
            <p className="text-sm text-muted-foreground capitalize">{currentMonth}</p>
          </div>
        </div>
        <CategoryFilter
          categories={categories}
          selectedCategories={categoryFilters}
          onSelectionChange={setCategoryFilters}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Balance */}
        <div
          className={`p-4 rounded-xl border ${
            balance >= 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {balance >= 0 ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span className="text-sm font-medium text-muted-foreground">Saldo do mês</span>
          </div>
          <div className={`text-lg font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(balance)}
          </div>
        </div>

        {/* Income */}
        <div className="p-4 rounded-xl bg-success/5 border border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-muted-foreground">Entradas</span>
          </div>
          <div className="text-lg font-bold text-success">
            {formatCurrency(summary.monthlyIncomeTotal)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {summary.monthlyIncomeCount} registro(s)
          </div>
        </div>

        {/* Expenses */}
        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-muted-foreground">Saídas</span>
          </div>
          <div className="text-lg font-bold text-destructive">
            {formatCurrency(summary.monthlyExpensesTotal)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {summary.monthlyExpensesCount} registro(s)
          </div>
        </div>

        {/* Bills to pay this month */}
        <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-muted-foreground">A pagar (mês)</span>
          </div>
          <div className="text-lg font-bold text-warning">
            {formatCurrency(summary.monthlyBillsToPayTotal)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {summary.monthlyBillsToPayCount} conta(s)
          </div>
        </div>

        {/* Bills paid this month */}
        <div className="p-4 rounded-xl bg-success/5 border border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-muted-foreground">Pagas (mês)</span>
          </div>
          <div className="text-lg font-bold text-success">
            {formatCurrency(summary.monthlyBillsPaidTotal)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {summary.monthlyBillsPaidCount} conta(s)
          </div>
        </div>

        {/* Total bills to pay */}
        <div className="p-4 rounded-xl bg-secondary border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">A pagar (total)</span>
          </div>
          <div className="text-lg font-bold text-foreground">
            {formatCurrency(summary.totalBillsToPayTotal)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {summary.totalBillsToPayCount} conta(s) pendentes
          </div>
        </div>
      </div>
    </div>
  );
}
