-- Update the handle_new_user function to pick up role and department from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    role_name public.app_role;
    dept_id uuid;
BEGIN
    -- Extract role and department from metadata if provided
    role_name := (NEW.raw_user_meta_data ->> 'role')::public.app_role;
    -- department_id may be 'none' or null
    IF (NEW.raw_user_meta_data ->> 'department_id') IS NOT NULL AND (NEW.raw_user_meta_data ->> 'department_id') != 'none' THEN
        dept_id := (NEW.raw_user_meta_data ->> 'department_id')::uuid;
    END IF;

    -- Update or insert profile
    INSERT INTO public.profiles (id, email, full_name, department_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)),
        dept_id
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        department_id = EXCLUDED.department_id;

    -- Insert role if provided
    IF role_name IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, role_name)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- Create missing roles in case they were missed originally
-- This is safe to run as they already exist in migrations but ensures consistency
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'strategic_planner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'designer';

-- Ensure existing users with no roles get a default (optional cleanup)
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'hq_employee'::app_role FROM public.profiles p
-- WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id);
