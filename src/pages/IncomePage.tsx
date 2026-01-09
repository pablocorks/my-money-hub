import { Header } from '@/components/dashboard/Header';
import { useIncome } from '@/hooks/useIncome';
import { IncomeBlock } from '@/components/dashboard/IncomeBlock';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function IncomePage() {
  const { income, isLoading, createIncome, updateIncome } = useIncome();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl gradient-success">
            <TrendingUp className="w-6 h-6 text-success-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Entradas</h1>
            <p className="text-muted-foreground">Todas as suas entradas de dinheiro</p>
          </div>
        </div>

        <IncomeBlock
          income={income}
          onCreateIncome={createIncome}
          onUpdateIncome={updateIncome}
          title="Histórico de Entradas"
          maxHeight="calc(100vh - 250px)"
          showAllEntries
        />
      </main>
    </div>
  );
}
