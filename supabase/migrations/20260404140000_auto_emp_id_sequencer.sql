-- Automated Employee ID Generation System
-- 1. Create a persistent sequence for Employee IDs
CREATE SEQUENCE IF NOT EXISTS public.employee_id_seq START 1;

-- 2. Update the handle_new_user function to automatically assign IDs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    role_name public.app_role;
    dept_id uuid;
    emp_id text;
    next_val bigint;
BEGIN
    IF (NEW.raw_user_meta_data ->> 'role') IS NOT NULL AND (NEW.raw_user_meta_data ->> 'role') != '' THEN
        role_name := (NEW.raw_user_meta_data ->> 'role')::public.app_role;
    END IF;
    
    IF (NEW.raw_user_meta_data ->> 'department_id') IS NOT NULL AND (NEW.raw_user_meta_data ->> 'department_id') NOT IN ('none', 'null', '') THEN
        dept_id := (NEW.raw_user_meta_data ->> 'department_id')::uuid;
    END IF;

    IF (NEW.raw_user_meta_data ->> 'employee_id') IS NOT NULL AND (NEW.raw_user_meta_data ->> 'employee_id') NOT IN ('null', '') THEN
        emp_id := NEW.raw_user_meta_data ->> 'employee_id';
    END IF;

    IF emp_id IS NULL OR emp_id = '' THEN
        next_val := nextval('public.employee_id_seq');
        emp_id := 'EMP' || LPAD(next_val::text, 4, '0');
    END IF;

    INSERT INTO public.profiles (id, email, full_name, department_id, employee_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)),
        dept_id,
        emp_id
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        department_id = EXCLUDED.department_id,
        employee_id = COALESCE(public.profiles.employee_id, EXCLUDED.employee_id);

    IF role_name IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, role_name)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$;

-- 3. Retroactively assign IDs
UPDATE public.profiles 
SET employee_id = 'EMP' || LPAD(nextval('public.employee_id_seq')::text, 4, '0') 
WHERE employee_id IS NULL OR employee_id = '';
