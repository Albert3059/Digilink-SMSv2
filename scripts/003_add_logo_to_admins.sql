-- Add logo_url column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS logo_url TEXT;
