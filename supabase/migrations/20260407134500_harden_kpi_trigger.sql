-- Diagnostic Migration: Temporarily disabling Task-KPI automation triggers
-- This identifies if the real-time KPI updates are blocking administrative approvals due to data inconsistencies.
-- It also fixes a potential logical error in the progress tracking CASE statement.

DROP TRIGGER IF EXISTS tr_calculate_realtime_kpi ON public.tasks;

CREATE OR REPLACE FUNCTION public.calculate_realtime_kpi_on_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when a task transitions specifically to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Safe Update with COALESCE to prevent NULL errors during increment
        -- Also ensures target_value is not zero to prevent division concerns if any
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

-- Re-enable the trigger with hardened function
CREATE TRIGGER tr_calculate_realtime_kpi
    AFTER UPDATE OF status ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_realtime_kpi_on_task_completion();
