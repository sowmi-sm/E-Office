-- 1. Ensure we have the unique constraint to support ON CONFLICT
ALTER TABLE public.user_kpis DROP CONSTRAINT IF EXISTS user_kpi_period_unique;
ALTER TABLE public.user_kpis ADD CONSTRAINT user_kpi_period_unique UNIQUE (user_id, kpi_template_id, period_start, period_end);

DO $$
DECLARE
    task_kpi_template_id UUID;
    user_record RECORD;
BEGIN
    -- 2. Identify the target template
    SELECT id INTO task_kpi_template_id FROM public.kpi_templates WHERE name = 'Monthly Task Completions' LIMIT 1;
    
    IF task_kpi_template_id IS NOT NULL THEN
        -- 3. Link ALL current profiles to this KPI who don't have it yet
        FOR user_record IN SELECT id FROM public.profiles LOOP
            INSERT INTO public.user_kpis (user_id, kpi_template_id, current_value, target_value, period_start, period_end, status)
            VALUES (
                user_record.id, 
                task_kpi_template_id, 
                0, 
                10, 
                DATE_TRUNC('month', CURRENT_DATE)::DATE, 
                (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
                'on_track'
            )
            ON CONFLICT ON CONSTRAINT user_kpi_period_unique DO NOTHING;
        END LOOP;
    END IF;
END;
$$;

-- 4. Re-enable the Hardened Real-Time Trigger
CREATE OR REPLACE FUNCTION public.calculate_realtime_kpi_on_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE public.user_kpis uk
        SET 
            current_value = COALESCE(current_value, 0) + 1,
            status = CASE 
                WHEN (COALESCE(current_value, 0) + 1) >= COALESCE(target_value, 1) THEN 'exceeded'
                WHEN (COALESCE(current_value, 0) + 1) >= (COALESCE(target_value, 1) * 0.5) THEN 'on_track'
                ELSE 'behind'
            END,
            updated_at = NOW()
        FROM public.kpi_templates kt
        WHERE uk.kpi_template_id = kt.id
          AND uk.user_id = NEW.assigned_to
          AND kt.name = 'Monthly Task Completions';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_calculate_realtime_kpi ON public.tasks;
CREATE TRIGGER tr_calculate_realtime_kpi
    AFTER UPDATE OF status ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_realtime_kpi_on_task_completion();
