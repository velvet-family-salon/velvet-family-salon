-- P0 HOTFIX: Slot Availability RPC
-- Creates a SECURITY DEFINER function to check booked slots for public booking page
-- Run this IMMEDIATELY after p0-fix-rls-hardening.sql

-- =============================================
-- Create RPC for checking booked slots
-- =============================================

CREATE OR REPLACE FUNCTION get_booked_slots(
    p_staff_id UUID,
    p_date DATE
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slots TEXT[] := ARRAY[]::TEXT[];
    v_apt RECORD;
    v_mins INT;
    v_h INT;
    v_m INT;
    v_start_mins INT;
    v_end_mins INT;
BEGIN
    -- Get all non-cancelled appointments for this date
    FOR v_apt IN 
        SELECT start_time, end_time, staff_id
        FROM appointments
        WHERE appointment_date = p_date
        AND status NOT IN ('cancelled')
        AND (
            p_staff_id IS NULL 
            OR staff_id = p_staff_id 
            OR staff_id IS NULL
        )
    LOOP
        -- Calculate start and end in minutes
        v_start_mins := EXTRACT(HOUR FROM v_apt.start_time)::INT * 60 + EXTRACT(MINUTE FROM v_apt.start_time)::INT;
        v_end_mins := EXTRACT(HOUR FROM v_apt.end_time)::INT * 60 + EXTRACT(MINUTE FROM v_apt.end_time)::INT;
        
        -- Generate all 30-min slots blocked by this appointment
        v_mins := v_start_mins;
        WHILE v_mins < v_end_mins LOOP
            v_h := v_mins / 60;
            v_m := v_mins % 60;
            v_slots := array_append(v_slots, LPAD(v_h::TEXT, 2, '0') || ':' || LPAD(v_m::TEXT, 2, '0'));
            v_mins := v_mins + 30;
        END LOOP;
    END LOOP;
    
    -- Return unique slots
    RETURN ARRAY(SELECT DISTINCT unnest(v_slots) ORDER BY 1);
END;
$$;

-- Grant execution to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION get_booked_slots TO anon, authenticated;

-- =============================================
-- VERIFICATION
-- =============================================

-- Test: Get booked slots for today
-- SELECT get_booked_slots(NULL, CURRENT_DATE);

-- =============================================
-- RPC #2: Get User By Phone (for history page)
-- =============================================

CREATE OR REPLACE FUNCTION get_user_by_phone(p_phone TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.phone, u.created_at
    FROM users u
    WHERE u.phone = p_phone
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_by_phone TO anon, authenticated;

-- =============================================
-- RPC #3: Get Appointments By Phone (for history page)
-- =============================================

CREATE OR REPLACE FUNCTION get_appointments_by_phone(p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    -- Find user by phone
    SELECT id INTO v_user_id FROM users WHERE phone = p_phone LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RETURN '[]'::JSONB;
    END IF;
    
    -- Fetch appointments with all related data
    SELECT COALESCE(jsonb_agg(apt_json ORDER BY apt_date DESC, apt_time DESC), '[]'::JSONB)
    INTO v_result
    FROM (
        SELECT 
            jsonb_build_object(
                'id', a.id,
                'user_id', a.user_id,
                'service_id', a.service_id,
                'staff_id', a.staff_id,
                'appointment_date', a.appointment_date,
                'start_time', a.start_time,
                'end_time', a.end_time,
                'status', a.status,
                'notes', a.notes,
                'final_amount', a.final_amount,
                'discount_percent', a.discount_percent,
                'payment_mode', a.payment_mode,
                'created_at', a.created_at,
                'service', (SELECT row_to_json(s) FROM services s WHERE s.id = a.service_id),
                'staff', (SELECT row_to_json(st) FROM staff st WHERE st.id = a.staff_id),
                'user', (SELECT row_to_json(u) FROM users u WHERE u.id = a.user_id),
                'allServices', (
                    SELECT COALESCE(jsonb_agg(
                        jsonb_build_object(
                            'id', aps.id,
                            'appointment_id', aps.appointment_id,
                            'service_id', aps.service_id,
                            'staff_id', aps.staff_id,
                            'is_completed', aps.is_completed,
                            'cancellation_reason', aps.cancellation_reason,
                            'service', (SELECT row_to_json(s2) FROM services s2 WHERE s2.id = aps.service_id)
                        )
                    ), '[]'::jsonb)
                    FROM appointment_services aps
                    WHERE aps.appointment_id = a.id
                )
            ) as apt_json,
            a.appointment_date as apt_date,
            a.start_time as apt_time
        FROM appointments a
        WHERE a.user_id = v_user_id
    ) sub;
    
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_appointments_by_phone TO anon, authenticated;
