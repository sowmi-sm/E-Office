-- Emergency Maintenance: Suspend real-time KPI triggers to restore core task functionality
-- This allows admins to approve tasks without being blocked by background analytics processing.
-- We will rebuild the KPI automation once the core task management is verified stable.

DROP TRIGGER IF EXISTS tr_calculate_realtime_kpi ON public.tasks;
DROP FUNCTION IF EXISTS public.calculate_realtime_kpi_on_task_completion();

-- Also, let's simplify the task management RLS even further to prevent ANY collision
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.tasks;
CREATE POLICY "Admins can manage all tasks" 
ON public.tasks FOR ALL 
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
