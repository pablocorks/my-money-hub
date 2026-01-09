import { useMemo } from 'react';
import { Header } from '@/components/dashboard/Header';
import { BillsBlock } from '@/components/dashboard/BillsBlock';
import { IncomeBlock } from '@/components/dashboard/IncomeBlock';
import { ExpenseBlock } from '@/components/dashboard/ExpenseBlock';
import { SummaryBlock } from '@/components/dashboard/SummaryBlock';
import { useBills } from '@/hooks/useBills';
import { useIncome } from '@/hooks/useIncome';
import { useExpenses } from '@/hooks/useExpenses';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { bills, isLoading: billsLoading, createBill, updateBill, payBill, unpayBill } = useBills();
  const { income, isLoading: incomeLoading, createIncome, updateIncome } = useIncome();
  const { expenses, isLoading: expensesLoading, createExpense } = useExpenses();

  const currentMonthBills = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      pending: bills.filter((bill) => {
        const dueDate = new Date(bill.due_date);
        return (
          bill.status === 'pending' &&
          dueDate >= currentMonthStart &&
          dueDate <= currentMonthEnd
        );
      }),
      paid: bills.filter((bill) => {
        if (bill.status !== 'paid' || !bill.paid_at) return false;
        const paidDate = new Date(bill.paid_at);
        return paidDate >= currentMonthStart && paidDate <= currentMonthEnd;
      }),
      overdue: bills.filter((bill) => {
        const dueDate = new Date(bill.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return bill.status === 'pending' && dueDate < today;
      }),
    };
  }, [bills]);

  const isLoading = billsLoading || incomeLoading || expensesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[400px] rounded-xl" />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Block 1: Bills to Pay */}
          <BillsBlock
            title="Contas a Pagar"
            bills={currentMonthBills.pending}
            onCreateBill={createBill}
            onUpdateBill={updateBill}
            onPayBill={payBill}
            showPayButton
            showAddButton
            emptyMessage="Nenhuma conta a pagar este mês 🎉"
          />

          {/* Block 2: Paid Bills */}
          <BillsBlock
            title="Contas Pagas"
            bills={currentMonthBills.paid}
            onUnpayBill={unpayBill}
            onUpdateBill={updateBill}
            showUnpayButton
            variant="success"
            emptyMessage="Nenhuma conta paga este mês"
          />

          {/* Block 3: Overdue Bills */}
          <BillsBlock
            title="Contas Vencidas"
            bills={currentMonthBills.overdue}
            onPayBill={payBill}
            onUpdateBill={updateBill}
            showPayButton
            variant="danger"
            emptyMessage="Nenhuma conta vencida 👏"
          />

          {/* Block 4: Income */}
          <IncomeBlock
            income={income}
            onCreateIncome={createIncome}
            onUpdateIncome={updateIncome}
          />

          {/* Block 5: Expenses */}
          <ExpenseBlock expenses={expenses} onCreateExpense={createExpense} />

          {/* Block 6: Summary - spans 2 columns on larger screens */}
          <div className="lg:col-span-2 xl:col-span-1">
            <SummaryBlock bills={bills} income={income} expenses={expenses} />
          </div>
        </div>
      </main>
    </div>
  );
}
