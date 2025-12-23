-- Multi-Service Booking System
-- Run this in Supabase SQL Editor

-- Create appointment_services junction table
CREATE TABLE IF NOT EXISTS appointment_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    staff_id UUID REFERENCES staff(id),
    is_completed BOOLEAN DEFAULT false,
    final_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now)
CREATE POLICY "Allow all appointment_services operations"
    ON appointment_services FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment ON appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service ON appointment_services(service_id);
