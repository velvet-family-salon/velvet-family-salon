-- Bills Table for storing all billing data
-- Run this in Supabase SQL Editor

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number VARCHAR(20) UNIQUE NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    bill_date DATE NOT NULL,
    bill_time TIME NOT NULL,
    services JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(20),
    staff_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_appointment_id ON bills(appointment_id);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);

-- Enable RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to manage bills
CREATE POLICY "Allow authenticated users to read bills"
    ON bills FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert bills"
    ON bills FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update bills"
    ON bills FOR UPDATE
    TO authenticated
    USING (true);

-- Function to get next bill number for a given date
CREATE OR REPLACE FUNCTION get_next_bill_number(p_date DATE)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_count INTEGER;
    v_date_str VARCHAR(8);
    v_bill_number VARCHAR(20);
BEGIN
    v_date_str := TO_CHAR(p_date, 'YYYYMMDD');
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM bills
    WHERE bill_date = p_date;
    
    v_bill_number := 'VFS-' || v_date_str || '-' || LPAD(v_count::TEXT, 3, '0');
    
    RETURN v_bill_number;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_bill_number(DATE) TO authenticated;
