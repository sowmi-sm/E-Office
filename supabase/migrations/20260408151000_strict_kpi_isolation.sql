-- Enforcing Strict Individual KPI Visibility
-- This migration ensures that ONLY administrators can see all team KPIs.
-- All other roles (Reporting Officers, PMs, Staff) are restricted to seeing ONLY the KPIs assigned directly to them.

-- 1. Correct user_kpis policies
DROP POLICY IF EXISTS "Admins can manage all user KPIs" ON public.user_kpis;
CREATE POLICY "Admins can manage all user KPIs" 
ON public.user_kpis FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Officers can view all user KPIs" ON public.user_kpis;
-- We remove the broad officer visibility as requested by the user. 
-- Officers should only see their own KPIs in the "My KPIs" section.

DROP POLICY IF EXISTS "Staff can view their own KPIs" ON public.user_kpis;
CREATE POLICY "Users can view their own KPIs" 
ON public.user_kpis FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 2. Correct performance_records policies (similar scope usually desired)
DROP POLICY IF EXISTS "Admins can manage all performance records" ON public.performance_records;
CREATE POLICY "Admins can manage all performance records" 
ON public.performance_records FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Officers can view all performance records" ON public.performance_records;
-- Restricted to admins and individual owners

DROP POLICY IF EXISTS "Staff can view their own performance records" ON public.performance_records;
CREATE POLICY "Users can view their own performance records" 
ON public.performance_records FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR evaluator_id = auth.uid());
