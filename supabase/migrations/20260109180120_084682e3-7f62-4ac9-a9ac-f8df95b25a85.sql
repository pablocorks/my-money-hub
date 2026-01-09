
-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    cpf TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bills table (contas a pagar)
CREATE TABLE public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    due_date DATE NOT NULL,
    value DECIMAL(12,2),
    paid_value DECIMAL(12,2),
    recurrence TEXT NOT NULL DEFAULT 'single' CHECK (recurrence IN ('single', 'monthly', 'custom')),
    recurrence_months INTEGER,
    total_installments INTEGER,
    current_installment INTEGER,
    observation TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bill_categories junction table
CREATE TABLE public.bill_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    UNIQUE(bill_id, category_id)
);

-- Create income entries table (entradas de dinheiro)
CREATE TABLE public.income_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    origin TEXT NOT NULL,
    account TEXT,
    value DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create income_categories junction table
CREATE TABLE public.income_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    income_id UUID NOT NULL REFERENCES public.income_entries(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    UNIQUE(income_id, category_id)
);

-- Create expense entries table (saídas de dinheiro que não são contas)
CREATE TABLE public.expense_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create expense_categories junction table
CREATE TABLE public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expense_entries(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    UNIQUE(expense_id, category_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Bills policies
CREATE POLICY "Users can view own bills" ON public.bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bills" ON public.bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bills" ON public.bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bills" ON public.bills FOR DELETE USING (auth.uid() = user_id);

-- Bill categories policies (access through bill ownership)
CREATE POLICY "Users can view bill categories" ON public.bill_categories FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bills WHERE bills.id = bill_categories.bill_id AND bills.user_id = auth.uid())
);
CREATE POLICY "Users can insert bill categories" ON public.bill_categories FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.bills WHERE bills.id = bill_categories.bill_id AND bills.user_id = auth.uid())
);
CREATE POLICY "Users can delete bill categories" ON public.bill_categories FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.bills WHERE bills.id = bill_categories.bill_id AND bills.user_id = auth.uid())
);

-- Income entries policies
CREATE POLICY "Users can view own income" ON public.income_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income" ON public.income_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income" ON public.income_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income" ON public.income_entries FOR DELETE USING (auth.uid() = user_id);

-- Income categories policies
CREATE POLICY "Users can view income categories" ON public.income_categories FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.income_entries WHERE income_entries.id = income_categories.income_id AND income_entries.user_id = auth.uid())
);
CREATE POLICY "Users can insert income categories" ON public.income_categories FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.income_entries WHERE income_entries.id = income_categories.income_id AND income_entries.user_id = auth.uid())
);
CREATE POLICY "Users can delete income categories" ON public.income_categories FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.income_entries WHERE income_entries.id = income_categories.income_id AND income_entries.user_id = auth.uid())
);

-- Expense entries policies
CREATE POLICY "Users can view own expenses" ON public.expense_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expense_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expense_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expense_entries FOR DELETE USING (auth.uid() = user_id);

-- Expense categories policies
CREATE POLICY "Users can view expense categories" ON public.expense_categories FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.expense_entries WHERE expense_entries.id = expense_categories.expense_id AND expense_entries.user_id = auth.uid())
);
CREATE POLICY "Users can insert expense categories" ON public.expense_categories FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.expense_entries WHERE expense_entries.id = expense_categories.expense_id AND expense_entries.user_id = auth.uid())
);
CREATE POLICY "Users can delete expense categories" ON public.expense_categories FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.expense_entries WHERE expense_entries.id = expense_categories.expense_id AND expense_entries.user_id = auth.uid())
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_income_entries_updated_at BEFORE UPDATE ON public.income_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.income_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_entries;
