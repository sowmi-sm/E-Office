-- System Diagnostic: Checking KPI integrity and visibility
-- This script performs an internal audit of the KPI tracking system to identify why data 
-- might be hidden from the administrative view.

DO $$
DECLARE
    admin_count INTEGER;
    kpi_count INTEGER;
    sowmiya_id UUID;
    sowmiya_role public.app_role;
BEGIN
    -- 1. Check Admin User
    SELECT id INTO sowmiya_id FROM public.profiles WHERE email ILIKE '%sowmiya%' LIMIT 1;
    SELECT role INTO sowmiya_role FROM public.user_roles WHERE user_id = sowmiya_id;
    
    -- 2. Check Global KPI Count
    SELECT COUNT(*) INTO kpi_count FROM public.user_kpis;
    
    RAISE NOTICE '--- KPI SYSTEM DIAGNOSTIC ---';
    RAISE NOTICE 'Sowmiya ID: %', sowmiya_id;
    RAISE NOTICE 'Sowmiya Role in user_roles: %', sowmiya_role;
    RAISE NOTICE 'Total Rows in user_kpis: %', kpi_count;
    
    IF sowmiya_role IS NULL THEN
        RAISE NOTICE 'WARNING: Sowmiya has NO ROLE assigned in user_roles table!';
    END IF;
    
    IF kpi_count = 0 THEN
        RAISE NOTICE 'WARNING: The user_kpis table is COMPLETELY EMPTY!';
    END IF;
END;
$$;
