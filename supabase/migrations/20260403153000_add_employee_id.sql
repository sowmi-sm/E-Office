ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON profiles(employee_id);
