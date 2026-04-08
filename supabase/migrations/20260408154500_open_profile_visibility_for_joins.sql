-- Advanced Profile Visibility Audit
-- This migration ensures that Administrators have absolute, verified visibility into all 
-- employee profiles. This is critical for relational joins (like KPI name-mapping) 
-- to function without silent collection failure.

-- 1. Ensure absolute profile visibility for Admins
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- 2. Ensure general visibility exists as a fallback
DROP POLICY IF EXISTS "Allow all authenticated to view profiles" ON public.profiles;
CREATE POLICY "Allow all authenticated to view profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- 3. Also fix the KPI fetch logic to be more resilient to join failures
-- (I will do this in the code next)
