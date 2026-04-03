
-- Working hours configuration table (admin-managed)
CREATE TABLE public.working_hours_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  work_start_time time NOT NULL DEFAULT '09:00',
  work_end_time time NOT NULL DEFAULT '17:30',
  break_start_time time NOT NULL DEFAULT '13:00',
  break_end_time time NOT NULL DEFAULT '14:00',
  is_working_day boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(day_of_week)
);

ALTER TABLE public.working_hours_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage working hours config"
ON public.working_hours_config FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view working hours config"
ON public.working_hours_config FOR SELECT TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_working_hours_config_updated_at
BEFORE UPDATE ON public.working_hours_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default working hours (Mon-Fri working, Sat-Sun off)
INSERT INTO public.working_hours_config (day_of_week, work_start_time, work_end_time, break_start_time, break_end_time, is_working_day, created_by)
VALUES
  (0, '09:00', '17:30', '13:00', '14:00', false, '00000000-0000-0000-0000-000000000000'), -- Sunday
  (1, '09:00', '17:30', '13:00', '14:00', true, '00000000-0000-0000-0000-000000000000'),  -- Monday
  (2, '09:00', '17:30', '13:00', '14:00', true, '00000000-0000-0000-0000-000000000000'),  -- Tuesday
  (3, '09:00', '17:30', '13:00', '14:00', true, '00000000-0000-0000-0000-000000000000'),  -- Wednesday
  (4, '09:00', '17:30', '13:00', '14:00', true, '00000000-0000-0000-0000-000000000000'),  -- Thursday
  (5, '09:00', '17:30', '13:00', '14:00', true, '00000000-0000-0000-0000-000000000000'),  -- Friday
  (6, '09:00', '17:30', '13:00', '14:00', false, '00000000-0000-0000-0000-000000000000'); -- Saturday
