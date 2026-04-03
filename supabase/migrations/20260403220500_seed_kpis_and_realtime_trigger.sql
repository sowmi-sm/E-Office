-- Create Real-Time Analysis Trigger for Task Completion KPI
DO $$
DECLARE
    first_user_id UUID;
    task_kpi_template_id UUID;
BEGIN
    -- 1. Create a base KPI Template for Task Completion Activity
    INSERT INTO public.kpi_templates (name, description, unit, target_value, is_active)
    VALUES ('Monthly Task Completions', 'The total volume of operational tasks fully resolved and closed by the employee.', 'tasks', 10, true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO task_kpi_template_id;

    -- If conflict happened and we didn't get an ID, select it directly
    IF task_kpi_template_id IS NULL THEN
        SELECT id INTO task_kpi_template_id FROM public.kpi_templates WHERE name = 'Monthly Task Completions' LIMIT 1;
    END IF;

    -- 2. Link the KPI to the active User
    SELECT id INTO first_user_id FROM public.profiles LIMIT 1;
    
    IF first_user_id IS NOT NULL AND task_kpi_template_id IS NOT NULL THEN
        INSERT INTO public.user_kpis (user_id, kpi_template_id, current_value, target_value, period_start, period_end, status)
        VALUES (
            first_user_id, 
            task_kpi_template_id, 
            0,  -- Initial completed tasks 
            10, -- Target completed tasks
            DATE_TRUNC('month', CURRENT_DATE)::DATE, 
            (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
            'on_track'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$;

-- 3. Create the Real-Time Automation Function
CREATE OR REPLACE FUNCTION public.calculate_realtime_kpi_on_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when a task transitions specifically to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Real-time analysis: Increment the user's specific Task KPI and calculate their standing
        UPDATE public.user_kpis uk
        SET 
            current_value = current_value + 1,
            -- Determine if they are hitting their targets automatically
            status = CASE 
                WHEN (current_value + 1) >= target_value THEN 'exceeded'
                WHEN (current_value + 1) >= (target_value * 0.5) THEN 'on_track'
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

-- 4. Bind the Trigger to the Tasks Table
DROP TRIGGER IF EXISTS tr_calculate_realtime_kpi ON public.tasks;
CREATE TRIGGER tr_calculate_realtime_kpi
    AFTER UPDATE OF status ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_realtime_kpi_on_task_completion();
