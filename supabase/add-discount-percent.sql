-- Add discount_percent column to appointments table
-- Run this in the Supabase SQL Editor

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0;

-- Add a comment for documentation
COMMENT ON COLUMN appointments.discount_percent IS 'Percentage discount applied to the booking at completion time';
