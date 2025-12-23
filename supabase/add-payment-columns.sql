-- Add payment tracking columns to appointments table
-- Run this in Supabase SQL Editor

-- Add final_amount column for tracking actual payment
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10,2);

-- Add payment_mode column
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_mode TEXT 
CHECK (payment_mode IN ('cash', 'upi', 'card'));

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments';
