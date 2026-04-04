-- Unrestricted Internal Visibility: Allowing all team members to see each other
-- This fixes the issue where the Admin dashboard was only showing a subset of users.
-- By allowing all authenticated users to view profiles, we ensure the employee directory
-- and productivity monitors are always fully populated.

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all authenticated to view profiles" ON public.profiles;

CREATE POLICY "Allow all authenticated to view profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- Also ensure notifications are visible to their respective senders and recipients
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR auth.uid() = sender_id);
