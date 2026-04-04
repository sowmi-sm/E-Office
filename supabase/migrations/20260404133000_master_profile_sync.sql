-- Production Sync: Ensuring all registered users are visible to the Admin Dashboard
-- This script detects any accounts in Auth that haven't been linked to a Profile yet and creates them.
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data ->> 'full_name', SPLIT_PART(email, '@', 1)),
  created_at,
  COALESCE(last_sign_in_at, created_at)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Also ensure every user has at least an 'hq_employee' role if they don't have one (using valid enum)
-- Valid roles: 'admin', 'hq_employee', 'field_employee', 'reporting_officer', 'project_manager', 'division_head', 'top_management', 'strategic_planner', 'designer'
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id, 
  'hq_employee'::app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT DO NOTHING;

-- Grant broad oversight again for safety
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));
