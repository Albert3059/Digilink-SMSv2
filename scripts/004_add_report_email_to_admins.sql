-- Add report_email column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS report_email VARCHAR(255);

-- Migrate existing emails as report emails
UPDATE admins SET report_email = (
  SELECT email FROM auth.users WHERE auth.users.id = admins.id
) WHERE report_email IS NULL;
