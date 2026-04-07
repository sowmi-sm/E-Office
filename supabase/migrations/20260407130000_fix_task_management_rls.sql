-- Ensure Admins have absolute permissions to manage all tasks regardless of context
-- This fixes the issue where some older policies lacked the explicit enum cast on 'admin'
-- or used too-restrictive USING clauses.

DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.tasks;
CREATE POLICY "Admins can manage all tasks" 
ON public.tasks FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure officers can also manage tasks they create
DROP POLICY IF EXISTS "Officers can update tasks they created" ON public.tasks;
CREATE POLICY "Officers can update tasks they created" 
ON public.tasks FOR UPDATE 
TO authenticated 
USING (
  has_role(auth.uid(), 'reporting_officer'::app_role) OR
  has_role(auth.uid(), 'project_manager'::app_role) OR
  has_role(auth.uid(), 'division_head'::app_role) OR
  has_role(auth.uid(), 'top_management'::app_role) OR
  created_by = auth.uid()
);

-- Ensure employees can always update their assigned work status
DROP POLICY IF EXISTS "Staff can update their own tasks" ON public.tasks;
CREATE POLICY "Staff can update their own tasks" 
ON public.tasks FOR UPDATE 
TO authenticated 
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());
