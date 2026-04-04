-- Reset and seed correct working hours with 3 breaks for Mon-Sat
TRUNCATE TABLE public.working_hours_config;

INSERT INTO public.working_hours_config (day_of_week, work_start_time, work_end_time, break_start_time, break_end_time, break_type, is_working_day, created_by)
SELECT d.day, '09:00:00'::time, '18:00:00'::time, b.break_start::time, b.break_end::time, b.break_type,
  CASE WHEN d.day = 0 THEN false ELSE true END,
  '00000000-0000-0000-0000-000000000000'::uuid
FROM generate_series(0, 6) AS d(day)
CROSS JOIN (VALUES 
  ('10:30:00'::time, '10:45:00'::time, 'morning'),
  ('13:00:00'::time, '14:00:00'::time, 'lunch'),
  ('15:30:00'::time, '15:45:00'::time, 'evening')
) AS b(break_start, break_end, break_type);
