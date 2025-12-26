-- BUG #9 FIX: SQL Error on Complete Appointment
-- Error: FOR UPDATE cannot be applied to the nullable side of an outer join
-- Fix: Lock only the appointments table, not the LEFT JOINed users table

CREATE OR REPLACE FUNCTION complete_appointment_with_bill(
    p_appointment_id UUID,
    p_final_amount NUMERIC,
    p_payment_mode TEXT,
    p_discount_percent NUMERIC DEFAULT 0,
    p_services JSONB DEFAULT '[]'::JSONB,
    p_staff_name TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_appointment RECORD;
    v_user RECORD;
    v_bill_number TEXT;
    v_bill_id UUID;
    v_subtotal NUMERIC;
    v_discount_amount NUMERIC;
    v_bill_date DATE := CURRENT_DATE;
    v_bill_time TIME := CURRENT_TIME;
BEGIN
    -- Step 1: Lock ONLY the appointment row (not the joined user)
    -- FIX: Removed LEFT JOIN from FOR UPDATE - can't lock nullable side
    SELECT * INTO v_appointment
    FROM appointments
    WHERE id = p_appointment_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Appointment not found'
        );
    END IF;
    
    -- Step 1b: Fetch user info separately (no lock needed - read-only)
    SELECT name, phone, email INTO v_user
    FROM users
    WHERE id = v_appointment.user_id;
    
    -- Check if already completed
    IF v_appointment.status = 'completed' THEN
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
    END IF;
    
    -- Step 2: Generate atomic bill number
    INSERT INTO bill_sequences (bill_date, last_number)
    VALUES (v_bill_date, 1)
    ON CONFLICT (bill_date) 
    DO UPDATE SET last_number = bill_sequences.last_number + 1
    RETURNING 'VFS-' || TO_CHAR(v_bill_date, 'YYYYMMDD') || '-' || LPAD(last_number::TEXT, 3, '0')
    INTO v_bill_number;
    
    -- Step 3: Calculate amounts
    -- FIX: Safely check if p_services is a valid non-empty array before extracting elements
    IF p_services IS NULL OR jsonb_typeof(p_services) != 'array' OR jsonb_array_length(p_services) = 0 THEN
        v_subtotal := p_final_amount;
    ELSE
        v_subtotal := (SELECT COALESCE(SUM((svc->>'price')::NUMERIC), p_final_amount) FROM jsonb_array_elements(p_services) svc);
    END IF;
    v_discount_amount := ROUND(v_subtotal * p_discount_percent / 100, 2);
    
    -- Step 4: Create bill
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
        COALESCE(v_user.name, 'Walk-in Customer'),
        v_user.phone,
        v_user.email,
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
    
    -- Step 5: Update appointment status
    UPDATE appointments
    SET 
        status = 'completed',
        final_amount = p_final_amount,
        discount_percent = p_discount_percent,
        payment_mode = p_payment_mode
    WHERE id = p_appointment_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', p_appointment_id,
        'bill_id', v_bill_id,
        'bill_number', v_bill_number
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION complete_appointment_with_bill TO authenticated;
