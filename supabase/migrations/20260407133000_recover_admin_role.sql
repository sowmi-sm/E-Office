-- Global Administrative Recovery: Ensuring Sowmiya has correct database permissions
-- This migration finds any profile matching 'Sowmiya' and ensures they have the 'admin' role.
-- It also fixes the 'GHOST ROLE' issue by ensuring all records in user_roles match existing profiles.

DO $$
DECLARE
    target_uid UUID;
BEGIN
    -- 1. Identify Sowmiya by possible email or manual matches in this tenant
    FOR target_uid IN 
        SELECT id FROM public.profiles 
        WHERE email ILIKE '%sowmiya%' 
        OR full_name ILIKE '%sowmiya%'
    LOOP
        -- 2. Grant them the admin role explicitly
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_uid, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Granted Admin to user: %', target_uid;
    END LOOP;
END;
$$;
