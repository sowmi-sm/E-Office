
-- Create a security definer function to get user's department_id without recursion
CREATE OR REPLACE FUNCTION public.get_user_department_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Officers can view profiles in their department" ON public.profiles;

-- Recreate without recursion
CREATE POLICY "Officers can view profiles in their department"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_officer_or_above(auth.uid()) AND (
    department_id = get_user_department_id(auth.uid())
    OR department_id IS NULL
  )
);
