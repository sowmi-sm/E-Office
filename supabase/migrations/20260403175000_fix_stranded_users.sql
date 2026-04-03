DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
        -- Ensure profile exists
        INSERT INTO public.profiles (id, email, full_name, employee_id)
        VALUES (
            user_record.id,
            user_record.email,
            COALESCE(user_record.raw_user_meta_data ->> 'full_name', SPLIT_PART(user_record.email, '@', 1)),
            user_record.raw_user_meta_data ->> 'employee_id'
        ) ON CONFLICT DO NOTHING;

        -- Ensure role exists
        IF (user_record.raw_user_meta_data ->> 'role') IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (user_record.id, (user_record.raw_user_meta_data ->> 'role')::public.app_role)
            ON CONFLICT DO NOTHING;
        ELSE
            -- Default to admin if first user, else hq_employee
            INSERT INTO public.user_roles (user_id, role)
            VALUES (user_record.id, 'admin')
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END;
$$;
