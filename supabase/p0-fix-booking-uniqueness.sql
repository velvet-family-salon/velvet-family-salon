-- P0 Fix: Booking Uniqueness Constraint + Atomic Lock Improvement
-- Prevents double bookings at the database level
-- Run this migration in Supabase SQL Editor

-- =============================================
-- STEP 0: FIX EXISTING DUPLICATES
-- Marks duplicate bookings as 'cancelled' (keeps oldest)
-- =============================================

-- First, view duplicates (informational - run separately if needed)
-- SELECT appointment_date, start_time, staff_id, COUNT(*) as count
-- FROM appointments
-- WHERE status NOT IN ('cancelled')
-- GROUP BY appointment_date, start_time, staff_id
-- HAVING COUNT(*) > 1;

-- Cancel duplicate appointments (keeps the one created first, marks others cancelled)
UPDATE appointments
SET status = 'cancelled', notes = COALESCE(notes, '') || ' [AUTO-CANCELLED: Duplicate booking resolved during P0 migration]'
WHERE id IN (
    SELECT id FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY appointment_date, start_time, staff_id 
                ORDER BY created_at ASC
            ) as rn
        FROM appointments
        WHERE status NOT IN ('cancelled')
        AND staff_id IS NOT NULL
    ) sub
    WHERE rn > 1  -- Cancel all but the first (oldest)
);

-- Report how many were cancelled
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM appointments WHERE notes LIKE '%AUTO-CANCELLED: Duplicate%';
    RAISE NOTICE 'Cancelled % duplicate appointments', v_count;
END $$;

-- =============================================
-- STEP 1: Add unique constraint for bookings
-- Prevents same staff from having overlapping appointments
-- =============================================

-- Create partial unique index (excludes cancelled appointments)
-- This is better than a constraint because it allows cancelled duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_booking
ON appointments (appointment_date, start_time, staff_id)
WHERE status NOT IN ('cancelled') AND staff_id IS NOT NULL;

-- Index for "Any Stylist" bookings (staff_id IS NULL)
-- These need special handling - we can't have unique on NULL
-- But we DO want to prevent overlapping times
CREATE INDEX IF NOT EXISTS idx_appointments_any_staff_slot
ON appointments (appointment_date, start_time)
WHERE status NOT IN ('cancelled') AND staff_id IS NULL;

-- =============================================
-- STEP 2: Improved atomic booking function
-- Uses advisory lock for true serialization
-- =============================================

CREATE OR REPLACE FUNCTION book_appointment_atomic(
    p_service_ids UUID[],
    p_staff_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_user_name TEXT,
    p_user_phone TEXT,
    p_user_email TEXT DEFAULT NULL
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
BEGIN
    -- Generate a lock key based on date and staff (or 0 for "any staff")
    -- This ensures only one booking at a time for this slot combination
    v_lock_key := HASHTEXT(
        p_appointment_date::TEXT || 
        COALESCE(p_staff_id::TEXT, 'ANY') || 
        p_start_time::TEXT
    );
    
    -- Acquire advisory lock (blocks concurrent bookings for same slot)
    PERFORM pg_advisory_xact_lock(v_lock_key);

    -- Step 1: Check for conflicting appointments
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

    -- Step 2: Find or create user
    SELECT id INTO v_user_id FROM users WHERE phone = p_user_phone LIMIT 1;

    IF v_user_id IS NULL AND p_user_email IS NOT NULL THEN
        SELECT id INTO v_user_id FROM users WHERE email = p_user_email LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        INSERT INTO users (name, phone, email)
        VALUES (p_user_name, p_user_phone, p_user_email)
        RETURNING id INTO v_user_id;
    END IF;

    -- Step 3: Create the appointment
    BEGIN
        INSERT INTO appointments (
            user_id,
            service_id,
            staff_id,
            appointment_date,
            start_time,
            end_time,
            status
        )
        VALUES (
            v_user_id,
            p_service_ids[1],
            p_staff_id,
            p_appointment_date,
            p_start_time,
            p_end_time,
            'pending'
        )
        RETURNING id INTO v_appointment_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This time slot was just booked. Please choose another time.'
        );
    END;

    -- Step 4: Create appointment_services for each service
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

-- Grant execution rights
GRANT EXECUTE ON FUNCTION book_appointment_atomic TO anon, authenticated;

-- =============================================
-- VERIFICATION
-- =============================================

-- Test 1: Try to book same slot twice in rapid succession
-- First should succeed, second should fail with conflict error

-- Test 2: Verify index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'appointments' AND indexname LIKE '%double_booking%';
