-- Insert sample realistic government/corporate projects
INSERT INTO public.projects (name, description, status, start_date, end_date, budget, progress)
VALUES 
    (
        'Infrastructure Modernization Suite', 
        'Upgrading core departmental systems and field infrastructure to support modern reporting flows.', 
        'active', 
        '2026-01-10', 
        '2026-08-31', 
        1500000.00, 
        45
    ),
    (
        'Annual Compliance Security Audit', 
        'Yearly security and compliance review of all internal data storage mechanisms.', 
        'planning', 
        '2026-05-01', 
        '2026-06-30', 
        75000.00, 
        0
    ),
    (
        'Embankment Health Diagnostic Phase II', 
        'Conducting critical soil testing and structural analysis across priority sectors.', 
        'on_hold', 
        '2025-11-15', 
        '2026-10-31', 
        850000.00, 
        15
    )
ON CONFLICT DO NOTHING;
