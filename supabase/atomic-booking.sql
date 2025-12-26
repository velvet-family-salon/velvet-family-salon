-- Atomic Booking RPC
-- This function prevents double bookings by checking availability within a transaction.
-- Run this in Supabase SQL Editor.

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
BEGIN
    -- Step 1: Check for conflicting appointments (with row lock)
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments
    WHERE appointment_date = p_appointment_date
      AND status NOT IN ('cancelled')
      AND (
          (p_staff_id IS NULL) OR -- If "Any Stylist", check all slots
          (staff_id = p_staff_id) OR
          (staff_id IS NULL)
      )
      AND (
          (start_time < p_end_time AND end_time > p_start_time) -- Overlapping slots
      )
    FOR UPDATE; -- Lock these rows to prevent concurrent modifications

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
        p_service_ids[1], -- Primary service for backward compat
        p_staff_id,
        p_appointment_date,
        p_start_time,
        p_end_time,
        'pending'
    )
    RETURNING id INTO v_appointment_id;

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

-- Grant execution rights to anon and authenticated roles
GRANT EXECUTE ON FUNCTION book_appointment_atomic TO anon, authenticated;
