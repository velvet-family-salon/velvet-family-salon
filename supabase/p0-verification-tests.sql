-- P0 VERIFICATION TESTS
-- Run these tests AFTER applying all P0 migrations
-- Execute in Supabase SQL Editor

-- =============================================
-- TEST 1: RLS Anonymous Access Denied
-- =============================================

-- This test requires running as an anonymous user
-- In Supabase Dashboard: Go to SQL Editor > Run as "anon" role

-- Expected: ERROR (permission denied)
-- SELECT * FROM appointments LIMIT 1;

-- Expected: ERROR (permission denied)  
-- SELECT * FROM users LIMIT 1;

-- Expected: ERROR (permission denied)
-- INSERT INTO appointments (appointment_date, start_time, end_time, status) 
-- VALUES (CURRENT_DATE, '10:00', '11:00', 'pending');

-- =============================================
-- TEST 2: RLS Authenticated Access Works
-- =============================================

-- Run as authenticated user (logged in admin)
-- Expected: Returns data
SELECT COUNT(*) as authenticated_can_read FROM appointments;
SELECT COUNT(*) as authenticated_can_read_users FROM users;

-- =============================================
-- TEST 3: Bill Sequence Atomic (Race Condition Fix)
-- =============================================

-- Run this twice in quick succession - should get sequential numbers
SELECT generate_bill_number_atomic(CURRENT_DATE) as bill_1;
SELECT generate_bill_number_atomic(CURRENT_DATE) as bill_2;

-- Verify they are different
SELECT bill_number, COUNT(*) 
FROM bills 
GROUP BY bill_number 
HAVING COUNT(*) > 1;
-- Expected: No rows (no duplicates)

-- =============================================
-- TEST 4: Booking Uniqueness Constraint
-- =============================================

-- Check index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'appointments' 
AND indexname LIKE '%double_booking%';
-- Expected: 1 row with partial unique index

-- Attempt to create duplicate (should fail)
-- Note: This test requires a valid service_id from your database
-- Replace the UUID with an actual service ID or skip this test

-- Get a real service ID first:
-- SELECT id FROM services LIMIT 1;

-- Then run with proper types:
DO $$
DECLARE
    v_result JSONB;
    v_service_id UUID;
    v_test_date DATE := (CURRENT_DATE + 30)::DATE;
BEGIN
    -- Get a real service ID
    SELECT id INTO v_service_id FROM services WHERE is_active = true LIMIT 1;
    
    IF v_service_id IS NULL THEN
        RAISE NOTICE 'No active services found, skipping booking test';
        RETURN;
    END IF;

    -- First booking should succeed
    v_result := book_appointment_atomic(
        ARRAY[v_service_id],
        NULL::UUID,
        v_test_date,
        '14:00'::TIME,
        '15:00'::TIME,
        'Test User 1'::TEXT,
        '9876543210'::TEXT,
        NULL::TEXT
    );
    RAISE NOTICE 'First booking: %', v_result;
    
    -- Second booking for same slot should fail
    v_result := book_appointment_atomic(
        ARRAY[v_service_id],
        NULL::UUID,
        v_test_date,
        '14:00'::TIME,
        '15:00'::TIME,
        'Test User 2'::TEXT,
        '9876543211'::TEXT,
        NULL::TEXT
    );
    RAISE NOTICE 'Second booking (should fail): %', v_result;
    
    -- Cleanup: Cancel the test appointment
    UPDATE appointments 
    SET status = 'cancelled' 
    WHERE appointment_date = v_test_date 
    AND start_time = '14:00'::TIME
    AND notes IS NULL;
    
    RAISE NOTICE 'Test appointments cleaned up';
END $$;

-- =============================================
-- TEST 5: Advisory Lock Working
-- =============================================

-- Check if pg_advisory_xact_lock is being used
-- (This is implicitly tested by the booking uniqueness above)

-- =============================================
-- VERIFICATION SUMMARY
-- =============================================

SELECT 
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND qual LIKE '%authenticated%') as authenticated_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'appointments' AND indexname LIKE '%double_booking%') as uniqueness_index,
    (SELECT COUNT(*) FROM pg_proc WHERE proname = 'generate_bill_number_atomic') as bill_rpc_exists,
    (SELECT COUNT(*) FROM pg_constraint WHERE conname = 'bills_bill_number_unique') as bill_unique_constraint;
