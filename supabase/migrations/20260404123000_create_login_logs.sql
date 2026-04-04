-- Create a table to track real-time login and break return events
CREATE TABLE IF NOT EXISTS public.daily_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'shift_start', 'morning_tea_return', 'lunch_return', 'evening_tea_return'
  logged_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  event_date DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE (user_id, event_type, event_date)
);

-- Enable RLS
ALTER TABLE public.daily_login_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.daily_login_logs;
CREATE POLICY "Users can insert their own logs" 
ON public.daily_login_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own logs" ON public.daily_login_logs;
CREATE POLICY "Users can view their own logs" 
ON public.daily_login_logs FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all logs" ON public.daily_login_logs;
CREATE POLICY "Admins can view all logs" 
ON public.daily_login_logs FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));
