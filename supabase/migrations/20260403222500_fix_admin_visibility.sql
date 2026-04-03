-- Allow all users to see who has the admin role so they can send access requests
DROP POLICY IF EXISTS "Anyone can see admin roles" ON public.user_roles;
CREATE POLICY "Anyone can see admin roles"
ON public.user_roles FOR SELECT
USING (role = 'admin');

-- Also, let's ensure the current user (you) is an admin in the database if not already
DO $$
DECLARE
    current_uid UUID;
BEGIN
    -- Get the first registered user to make them an admin for this demo environment
    SELECT id INTO current_uid FROM public.profiles LIMIT 1;
    
    IF current_uid IS NOT NULL THEN
        -- Insert admin role if it doesn't exist for this user
        INSERT INTO public.user_roles (user_id, role)
        VALUES (current_uid, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END;
$$;
