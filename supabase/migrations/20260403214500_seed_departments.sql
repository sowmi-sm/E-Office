-- Insert realistic departments directly into the database so foreign keys validate appropriately
INSERT INTO public.departments (id, name, description)
VALUES 
    (gen_random_uuid(), 'Administration', 'Internal HQ operations and support'),
    (gen_random_uuid(), 'Field Operations', 'On-ground execution and field management'),
    (gen_random_uuid(), 'Finance & Accounts', 'Accounting, budgeting, and payroll'),
    (gen_random_uuid(), 'Planning & Design', 'Strategy, architecture, and surveys'),
    (gen_random_uuid(), 'Projects Division', 'Overseeing all major active projects'),
    (gen_random_uuid(), 'Technical Division', 'Core technical and engineering tasks')
ON CONFLICT DO NOTHING;
