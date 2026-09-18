CREATE TABLE public.fund_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_account_id UUID NOT NULL REFERENCES public.broker_accounts(id) ON DELETE CASCADE,
  broker TEXT NOT NULL,
  amount_inr NUMERIC(14,2) NOT NULL CHECK (amount_inr > 0),
  direction TEXT NOT NULL DEFAULT 'credit' CHECK (direction IN ('credit','debit')),
  method TEXT NOT NULL DEFAULT 'upi_qr' CHECK (method IN ('upi_qr','upi_id')),
  upi_ref TEXT NOT NULL,
  upi_id TEXT,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('pending','success','failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.fund_transactions TO authenticated;
GRANT ALL ON public.fund_transactions TO service_role;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own fund transactions" ON public.fund_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own fund transactions" ON public.fund_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all fund transactions" ON public.fund_transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX fund_transactions_user_idx ON public.fund_transactions (user_id, created_at DESC);

CREATE TABLE public.user_preferences (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned_indices TEXT[] NOT NULL DEFAULT ARRAY['NIFTY50','SENSEX','BANKNIFTY']::TEXT[],
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences" ON public.user_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);