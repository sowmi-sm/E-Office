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
BEGIN
    -- Extract role and department from metadata if provided
    IF (NEW.raw_user_meta_data ->> 'role') IS NOT NULL THEN
        role_name := (NEW.raw_user_meta_data ->> 'role')::public.app_role;
    END IF;

    IF (NEW.raw_user_meta_data ->> 'department_id') IS NOT NULL 
       AND (NEW.raw_user_meta_data ->> 'department_id') != 'none' 
       AND (NEW.raw_user_meta_data ->> 'department_id') != 'null' 
       AND (NEW.raw_user_meta_data ->> 'department_id') != '' THEN
        dept_id := (NEW.raw_user_meta_data ->> 'department_id')::uuid;
    END IF;

    IF (NEW.raw_user_meta_data ->> 'employee_id') IS NOT NULL 
       AND (NEW.raw_user_meta_data ->> 'employee_id') != 'null' 
       AND (NEW.raw_user_meta_data ->> 'employee_id') != '' THEN
        emp_id := NEW.raw_user_meta_data ->> 'employee_id';
    END IF;

    -- Update or insert profile
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
        employee_id = COALESCE(EXCLUDED.employee_id, public.profiles.employee_id);

    -- Insert role if provided
    IF role_name IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, role_name)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user failed: %', SQLERRM;
        RETURN NEW;
END;
$$;
