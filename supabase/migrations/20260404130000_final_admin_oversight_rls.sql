-- Final Production RLS Cleanup for Administrative Oversight
-- 1. Profiles: Admins must see all employees to monitor productivity
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. User Roles: Admins must see everyone's role to manage permissions
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Notifications: Admins receive system requests, must be able to view them
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Audit Logs: Admins oversight for Attendance Logs
DROP POLICY IF EXISTS "Admins can view all attendance logs" ON public.daily_login_logs;
CREATE POLICY "Admins can view all attendance logs" 
ON public.daily_login_logs FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. System Blocks: Admins oversight for Locked Accounts
DROP POLICY IF EXISTS "Admins can view all system blocks" ON public.user_blocks;
CREATE POLICY "Admins can view all system blocks" 
ON public.user_blocks FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));
