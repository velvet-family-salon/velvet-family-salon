-- RELEASE BLOCKER FIX: Atomic Completion + Idempotency
-- Run this in Supabase SQL Editor
-- Fixes BUG-C1 (partial write) and BUG-C3 (missing idempotency)

-- =============================================
-- PART 1: BUG-C3 FIX - Add idempotency_key column
-- =============================================

-- Add idempotency_key column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_appointments_idempotency_key 
ON appointments(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- =============================================
-- PART 2: Update book_appointment_atomic with idempotency
-- =============================================

-- Drop existing function(s) to avoid signature conflicts
DROP FUNCTION IF EXISTS book_appointment_atomic(UUID[], UUID, DATE, TIME, TIME, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS book_appointment_atomic(UUID[], UUID, DATE, TIME, TIME, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION book_appointment_atomic(
    p_service_ids UUID[],
    p_staff_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_user_name TEXT,
    p_user_phone TEXT,
    p_user_email TEXT DEFAULT NULL,
    p_idempotency_key UUID DEFAULT NULL  -- NEW: Optional idempotency key
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_appointment_id UUID;
    v_conflict_count INT;
    v_service_id UUID;
    v_lock_key BIGINT;
    v_existing_apt RECORD;
BEGIN
    -- IDEMPOTENCY CHECK: If key provided, check for existing appointment
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id, status INTO v_existing_apt 
        FROM appointments 
        WHERE idempotency_key = p_idempotency_key;
        
        IF FOUND THEN
            -- Return existing appointment (idempotent response)
            RETURN jsonb_build_object(
                'success', true,
                'appointment_id', v_existing_apt.id,
                'idempotent', true,
                'message', 'Booking already exists for this request'
            );
        END IF;
    END IF;

    -- Generate a lock key based on date and staff
    v_lock_key := HASHTEXT(
        p_appointment_date::TEXT || 
        COALESCE(p_staff_id::TEXT, 'ANY') || 
        p_start_time::TEXT
    );
    
    -- Acquire advisory lock
    PERFORM pg_advisory_xact_lock(v_lock_key);

    -- Check for conflicting appointments
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments
    WHERE appointment_date = p_appointment_date
      AND status NOT IN ('cancelled')
      AND (
          (p_staff_id IS NULL) OR
          (staff_id = p_staff_id) OR
          (staff_id IS NULL)
      )
      AND (start_time < p_end_time AND end_time > p_start_time);

    IF v_conflict_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This time slot is no longer available. Please choose another time.'
        );
    END IF;

    -- Find or create user
    SELECT id INTO v_user_id FROM users WHERE phone = p_user_phone LIMIT 1;

    IF v_user_id IS NULL AND p_user_email IS NOT NULL THEN
        SELECT id INTO v_user_id FROM users WHERE email = p_user_email LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        INSERT INTO users (name, phone, email)
        VALUES (p_user_name, p_user_phone, p_user_email)
        RETURNING id INTO v_user_id;
    END IF;

    -- Create the appointment with idempotency key
    BEGIN
        INSERT INTO appointments (
            user_id,
            service_id,
            staff_id,
            appointment_date,
            start_time,
            end_time,
            status,
            idempotency_key  -- NEW: Store idempotency key
        )
        VALUES (
            v_user_id,
            p_service_ids[1],
            p_staff_id,
            p_appointment_date,
            p_start_time,
            p_end_time,
            'pending',
            p_idempotency_key
        )
        RETURNING id INTO v_appointment_id;
    EXCEPTION 
        WHEN unique_violation THEN
            -- Could be idempotency key or slot conflict
            IF SQLERRM LIKE '%idempotency_key%' THEN
                -- Race condition: another request with same key just succeeded
                SELECT id INTO v_appointment_id 
                FROM appointments 
                WHERE idempotency_key = p_idempotency_key;
                
                RETURN jsonb_build_object(
                    'success', true,
                    'appointment_id', v_appointment_id,
                    'idempotent', true
                );
            END IF;
            
            RETURN jsonb_build_object(
                'success', false,
                'error', 'This time slot was just booked. Please choose another time.'
            );
    END;

    -- Create appointment_services
    FOREACH v_service_id IN ARRAY p_service_ids LOOP
        INSERT INTO appointment_services (appointment_id, service_id, staff_id, is_completed)
        VALUES (v_appointment_id, v_service_id, p_staff_id, true);
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION book_appointment_atomic TO anon, authenticated;

-- =============================================
-- PART 3: BUG-C1 FIX - Atomic completion with bill
-- =============================================

CREATE OR REPLACE FUNCTION complete_appointment_with_bill(
    p_appointment_id UUID,
    p_final_amount NUMERIC,
    p_payment_mode TEXT,
    p_discount_percent NUMERIC DEFAULT 0,
    p_services JSONB DEFAULT '[]'::JSONB,  -- Array of {name, price}
    p_staff_name TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_appointment RECORD;
    v_bill_number TEXT;
    v_bill_id UUID;
    v_subtotal NUMERIC;
    v_discount_amount NUMERIC;
    v_bill_date DATE := CURRENT_DATE;
    v_bill_time TIME := CURRENT_TIME;
BEGIN
    -- Step 1: Lock and fetch appointment
    SELECT a.*, u.name as user_name, u.phone as user_phone, u.email as user_email
    INTO v_appointment
    FROM appointments a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.id = p_appointment_id
    FOR UPDATE;  -- Row lock prevents concurrent completion
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Appointment not found'
        );
    END IF;
    
    -- Check if already completed
    IF v_appointment.status = 'completed' THEN
        -- Check if bill exists (idempotent check)
        SELECT id INTO v_bill_id FROM bills WHERE appointment_id = p_appointment_id;
        
        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'appointment_id', p_appointment_id,
                'bill_id', v_bill_id,
                'idempotent', true,
                'message', 'Appointment already completed with bill'
            );
        END IF;
        -- If completed but no bill, continue to create bill
    END IF;
    
    -- Step 2: Generate atomic bill number
    INSERT INTO bill_sequences (bill_date, last_number)
    VALUES (v_bill_date, 1)
    ON CONFLICT (bill_date) 
    DO UPDATE SET last_number = bill_sequences.last_number + 1
    RETURNING 'VFS-' || TO_CHAR(v_bill_date, 'YYYYMMDD') || '-' || LPAD(last_number::TEXT, 3, '0')
    INTO v_bill_number;
    
    -- Step 3: Calculate amounts
    v_subtotal := (SELECT COALESCE(SUM((svc->>'price')::NUMERIC), p_final_amount) FROM jsonb_array_elements(p_services) svc);
    v_discount_amount := ROUND(v_subtotal * p_discount_percent / 100, 2);
    
    -- Step 4: Create bill (inside same transaction)
    INSERT INTO bills (
        bill_number,
        appointment_id,
        customer_name,
        customer_phone,
        customer_email,
        bill_date,
        bill_time,
        services,
        subtotal,
        discount_percent,
        discount_amount,
        final_amount,
        payment_mode,
        staff_name,
        notes
    )
    VALUES (
        v_bill_number,
        p_appointment_id,
        v_appointment.user_name,
        v_appointment.user_phone,
        v_appointment.user_email,
        v_bill_date,
        v_bill_time,
        p_services,
        v_subtotal,
        p_discount_percent,
        v_discount_amount,
        p_final_amount,
        p_payment_mode,
        p_staff_name,
        p_notes
    )
    RETURNING id INTO v_bill_id;
    
    -- Step 5: Update appointment status (same transaction)
    UPDATE appointments
    SET 
        status = 'completed',
        final_amount = p_final_amount,
        discount_percent = p_discount_percent,
        payment_mode = p_payment_mode
    WHERE id = p_appointment_id;
    
    -- If we reach here, BOTH operations succeeded
    -- Transaction will auto-commit on return
    
    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', p_appointment_id,
        'bill_id', v_bill_id,
        'bill_number', v_bill_number
    );

EXCEPTION WHEN OTHERS THEN
    -- Any error causes full rollback (appointment stays unchanged, no bill created)
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION complete_appointment_with_bill TO authenticated;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify idempotency column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND column_name = 'idempotency_key';

-- Verify functions exist
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname IN ('book_appointment_atomic', 'complete_appointment_with_bill');

-- =============================================
-- ROLLBACK SQL (if needed)
-- =============================================

-- To rollback these changes:
/*
-- Remove idempotency column
ALTER TABLE appointments DROP COLUMN IF EXISTS idempotency_key;
DROP INDEX IF EXISTS idx_appointments_idempotency_key;

-- Restore original booking function (run atomic-booking.sql or p0-fix-booking-uniqueness.sql)

-- Remove completion function
DROP FUNCTION IF EXISTS complete_appointment_with_bill;
*/
