-- Create a dedicated table if not exists for system blocks
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  blocked_reason TEXT NOT NULL,
  unblocked_at TIMESTAMPTZ,
  unblocked_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Allow users to block themselves (system-triggered)
DROP POLICY IF EXISTS "Users can insert their own blocks" ON public.user_blocks;
CREATE POLICY "Users can insert their own blocks" 
ON public.user_blocks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to see if they are blocked
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.user_blocks;
CREATE POLICY "Users can view their own blocks" 
ON public.user_blocks FOR SELECT 
USING (auth.uid() = user_id);

-- Allow admins to oversee and manage all blocks
DROP POLICY IF EXISTS "Admins can view all blocks" ON public.user_blocks;
CREATE POLICY "Admins can view all blocks" 
ON public.user_blocks FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage blocks" ON public.user_blocks;
CREATE POLICY "Admins can manage blocks" 
ON public.user_blocks FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));
