-- Insert realistic tasks and dynamically link them to the first available user and project
DO $$
DECLARE
    first_user_id UUID;
    first_project_id UUID;
BEGIN
    -- Get the first available user to act as both creator and assignee
    SELECT id INTO first_user_id FROM public.profiles LIMIT 1;
    
    -- Get the first available project to link tasks
    SELECT id INTO first_project_id FROM public.projects WHERE name = 'Infrastructure Modernization Suite' LIMIT 1;

    -- Only proceed if we have a user
    IF first_user_id IS NOT NULL THEN
        INSERT INTO public.tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date)
        VALUES 
            (
                'Review Initial Field Surveys', 
                'Analyze the topological reports submitted by the regional engineering team.', 
                first_project_id, 
                first_user_id, 
                first_user_id, 
                'pending', 
                'high', 
                CURRENT_DATE + INTERVAL '5 days'
            ),
            (
                'Update Equipment Logs', 
                'Ensure all newly procured sensors and drilling equipment are documented in the central manifest.', 
                first_project_id, 
                first_user_id, 
                first_user_id, 
                'in_progress', 
                'medium', 
                CURRENT_DATE + INTERVAL '2 days'
            ),
            (
                'Draft Final Safety Protocol', 
                'Compile the multi-site safety protocols required for the next phase of structural testing.', 
                NULL,  -- Independent task, no project
                first_user_id, 
                first_user_id, 
                'completed', 
                'critical', 
                CURRENT_DATE - INTERVAL '1 day'
            );
    END IF;
END;
$$;
