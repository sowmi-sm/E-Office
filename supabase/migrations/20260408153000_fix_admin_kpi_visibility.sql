-- Global Privacy Restoration: Fixing Administrative Visibility Breach
-- This migration repairs the RLS policy for user_kpis by implementing the direct subquery method.
-- This method is more robust than the function-based check (has_role) and ensures that 
-- Administrators have guaranteed oversight of all performance records.

-- 1. Correct user_kpis policies with guaranteed admin override
DROP POLICY IF EXISTS "Admins can manage all user KPIs" ON public.user_kpis;
CREATE POLICY "Admins can manage all user KPIs" 
ON public.user_kpis FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

DROP POLICY IF EXISTS "Users can view their own KPIs" ON public.user_kpis;
CREATE POLICY "Users can view their own KPIs" 
ON public.user_kpis FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 2. Similarly robust check for performance_records
DROP POLICY IF EXISTS "Admins can manage all performance records" ON public.performance_records;
CREATE POLICY "Admins can manage all performance records" 
ON public.performance_records FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

DROP POLICY IF EXISTS "Users can view their own performance records" ON public.performance_records;
CREATE POLICY "Users can view their own performance records" 
ON public.performance_records FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR evaluator_id = auth.uid());
