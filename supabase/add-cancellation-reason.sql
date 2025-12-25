-- Add cancellation_reason column to appointment_services table
-- This allows tracking why a service wasn't completed

ALTER TABLE appointment_services 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN appointment_services.cancellation_reason IS 'Reason why service was not completed (null if completed)';
