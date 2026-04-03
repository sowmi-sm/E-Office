
-- First add the column
ALTER TABLE public.working_hours_config ADD COLUMN IF NOT EXISTS break_type text NOT NULL DEFAULT 'lunch';

-- Drop the unique constraint on day_of_week
ALTER TABLE public.working_hours_config DROP CONSTRAINT IF EXISTS working_hours_config_day_of_week_key;
