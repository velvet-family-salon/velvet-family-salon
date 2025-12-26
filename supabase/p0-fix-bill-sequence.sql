-- P0 Fix: Bill Number Race Condition
-- Uses a sequence table with atomic increment
-- Run this migration in Supabase SQL Editor

-- =============================================
-- STEP 1: Create sequence table
-- =============================================

CREATE TABLE IF NOT EXISTS bill_sequences (
    bill_date DATE PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0
);

-- =============================================
-- STEP 2: Create atomic bill number function
-- =============================================

CREATE OR REPLACE FUNCTION generate_bill_number_atomic(p_date DATE)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_number INTEGER;
    v_date_formatted TEXT;
BEGIN
    -- Insert or update sequence atomically
    INSERT INTO bill_sequences (bill_date, last_number)
    VALUES (p_date, 1)
    ON CONFLICT (bill_date) 
    DO UPDATE SET last_number = bill_sequences.last_number + 1
    RETURNING last_number INTO v_next_number;
    
    -- Format: VFS-YYYYMMDD-XXX
    v_date_formatted := TO_CHAR(p_date, 'YYYYMMDD');
    
    RETURN 'VFS-' || v_date_formatted || '-' || LPAD(v_next_number::TEXT, 3, '0');
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION generate_bill_number_atomic TO authenticated;

-- =============================================
-- STEP 3: Add unique constraint on bill_number
-- =============================================

ALTER TABLE bills 
ADD CONSTRAINT bills_bill_number_unique UNIQUE (bill_number);

-- =============================================
-- STEP 4: RLS for bill_sequences table
-- =============================================

ALTER TABLE bill_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage bill_sequences" ON bill_sequences
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- =============================================
-- VERIFICATION
-- =============================================

-- Test the function (should return VFS-YYYYMMDD-001):
-- SELECT generate_bill_number_atomic(CURRENT_DATE);

-- Run twice rapidly to verify sequential:
-- SELECT generate_bill_number_atomic(CURRENT_DATE);
-- Should return VFS-YYYYMMDD-002
