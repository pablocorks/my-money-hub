-- Create table for income predictions (Previsão de Entrada)
CREATE TABLE public.income_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date date NOT NULL,
  origin TEXT NOT NULL,
  value NUMERIC NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.income_predictions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own income predictions"
ON public.income_predictions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income predictions"
ON public.income_predictions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income predictions"
ON public.income_predictions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income predictions"
ON public.income_predictions
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_income_predictions_updated_at
BEFORE UPDATE ON public.income_predictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.income_predictions;

-- Create prediction categories junction table
CREATE TABLE public.income_prediction_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL REFERENCES public.income_predictions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.income_prediction_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view income prediction categories"
ON public.income_prediction_categories
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM income_predictions
  WHERE income_predictions.id = income_prediction_categories.prediction_id
  AND income_predictions.user_id = auth.uid()
));

CREATE POLICY "Users can insert income prediction categories"
ON public.income_prediction_categories
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM income_predictions
  WHERE income_predictions.id = income_prediction_categories.prediction_id
  AND income_predictions.user_id = auth.uid()
));

CREATE POLICY "Users can delete income prediction categories"
ON public.income_prediction_categories
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM income_predictions
  WHERE income_predictions.id = income_prediction_categories.prediction_id
  AND income_predictions.user_id = auth.uid()
));