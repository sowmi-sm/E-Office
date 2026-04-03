-- Add necessary columns for access request approval
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unlock_until TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id);
