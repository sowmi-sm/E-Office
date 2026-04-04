-- Fix Notifications RLS: Allow any employee to send requests/notifications to Admins
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can send requests to admins" ON public.notifications;

CREATE POLICY "Users can send notifications to admins" 
ON public.notifications FOR INSERT 
WITH CHECK (
  has_role(user_id, 'admin'::app_role) 
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure profiles are visible so names show up
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));
