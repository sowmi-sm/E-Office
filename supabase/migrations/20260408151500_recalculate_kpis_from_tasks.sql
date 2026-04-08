-- Retroactive KPI Synchronization: Bringing analytics in line with actual performance
-- This migration recalculates the 'Monthly Task Completions' KPI for all team members
-- based on their actual completed tasks in the database. This fixes any discrepancy 
-- caused by tasks completed before the real-time trigger was enabled.

DO $$
DECLARE
    kpi_rec RECORD;
    completed_count INTEGER;
BEGIN
    -- Loop through all active 'Monthly Task Completions' KPI records
    FOR kpi_rec IN 
        SELECT uk.id, uk.user_id, uk.period_start, uk.period_end, uk.target_value
        FROM public.user_kpis uk
        JOIN public.kpi_templates kt ON uk.kpi_template_id = kt.id
        WHERE kt.name = 'Monthly Task Completions'
    LOOP
        -- Count actual completed tasks for this user within this specific period
        SELECT COUNT(*) INTO completed_count
        FROM public.tasks
        WHERE assigned_to = kpi_rec.user_id
          AND status = 'completed'
          -- Filter by period if completed_at is available, otherwise use created_at as backup
          AND (
            (completed_at >= kpi_rec.period_start::timestamp AND completed_at <= (kpi_rec.period_end::timestamp + interval '1 day'))
            OR 
            (completed_at IS NULL AND created_at >= kpi_rec.period_start::timestamp AND created_at <= (kpi_rec.period_end::timestamp + interval '1 day'))
          );

        -- Update the KPI record with the fresh count
        UPDATE public.user_kpis
        SET 
            current_value = completed_count,
            status = CASE 
                WHEN completed_count >= kpi_rec.target_value THEN 'exceeded'
                WHEN completed_count >= (kpi_rec.target_value * 0.5) THEN 'on_track'
                ELSE 'behind'
            END,
            updated_at = NOW()
        WHERE id = kpi_rec.id;
        
        RAISE NOTICE 'Recalculated KPI for user %: % completions found.', kpi_rec.user_id, completed_count;
    END LOOP;
END;
$$;
