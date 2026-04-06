-- Add an issued timestamp to the profile's unlock override
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unlock_issued_at TIMESTAMPTZ;

-- Retroactively set it if unlock_until exists
UPDATE public.profiles 
SET unlock_issued_at = unlock_until - interval '4 hours'
WHERE unlock_until IS NOT NULL AND unlock_issued_at IS NULL;
