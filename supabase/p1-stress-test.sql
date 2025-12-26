-- P1 STRESS TEST: 10x Data Simulation & Performance Verification
-- Run this in Supabase SQL Editor

-- =============================================
-- STEP 1: Generate 10x Test Data (Simulation)
-- =============================================

-- Create temporary function to generate test bills
CREATE OR REPLACE FUNCTION generate_stress_test_data()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INT := 0;
    v_date DATE;
    v_service_names TEXT[] := ARRAY['Haircut', 'Shave', 'Hair Color', 'Facial', 'Massage', 'Manicure', 'Pedicure', 'Threading', 'Waxing', 'Hair Treatment'];
    v_phones TEXT[] := ARRAY['9876543210', '9876543211', '9876543212', '9876543213', '9876543214', '9876543215', '9876543216', '9876543217', '9876543218', '9876543219'];
    v_i INT;
    v_phone TEXT;
    v_amount NUMERIC;
    v_service_json JSONB;
BEGIN
    -- Generate 1000 test bills (simulating 10x typical load)
    FOR v_i IN 1..1000 LOOP
        v_date := CURRENT_DATE - (random() * 365)::INT;
        v_phone := v_phones[1 + (random() * 9)::INT];
        v_amount := 200 + (random() * 2000)::INT;
        v_service_json := jsonb_build_array(
            jsonb_build_object(
                'name', v_service_names[1 + (random() * 9)::INT],
                'price', v_amount,
                'quantity', 1
            )
        );
        
        INSERT INTO bills (
            bill_number,
            customer_name,
            customer_phone,
            bill_date,
            bill_time,
            services,
            subtotal,
            discount_percent,
            discount_amount,
            final_amount,
            payment_mode
        ) VALUES (
            'STRESS-' || LPAD(v_i::TEXT, 5, '0'),
            'Stress Test Customer ' || v_i,
            v_phone,
            v_date,
            '10:00:00',
            v_service_json,
            v_amount,
            0,
            0,
            v_amount,
            CASE WHEN random() > 0.5 THEN 'cash' ELSE 'upi' END
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN 'Generated ' || v_count || ' stress test bills';
END;
$$;

-- Uncomment to generate test data:
-- SELECT generate_stress_test_data();

-- =============================================
-- STEP 2: Performance Verification Queries
-- =============================================

-- Query 1: Verify get_revenue_stats executes without loading all rows
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT get_revenue_stats();

-- Query 2: Verify get_most_booked_services uses index scan
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM get_most_booked_services(5);

-- Query 3: Count verification - ensure no SELECT * without LIMIT
-- This should be run BEFORE P1 vs AFTER P1 to see difference

-- BEFORE P1 (would be slow):
-- EXPLAIN ANALYZE SELECT * FROM bills; -- Full table scan

-- AFTER P1 (efficient):
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*), SUM(final_amount), AVG(final_amount)
FROM bills
WHERE bill_date >= CURRENT_DATE - INTERVAL '30 days';

-- =============================================
-- STEP 3: Verify No Unbounded Queries Exist
-- =============================================

-- Check that revenue stats RPC doesn't scan entire table for monthly data
-- Should only scan last 12 months
SELECT 
    'Monthly revenue scan range' as check_name,
    MIN(bill_date) as oldest_scanned,
    MAX(bill_date) as newest_scanned,
    COUNT(*) as rows_scanned
FROM bills
WHERE bill_date >= (CURRENT_DATE - INTERVAL '12 months');

-- Check total rows in bills table
SELECT 
    'Total bills in table' as check_name,
    COUNT(*) as total_rows,
    pg_size_pretty(pg_total_relation_size('bills')) as table_size
FROM bills;

-- =============================================
-- STEP 4: Performance Metrics Summary
-- =============================================

DO $$
DECLARE
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_revenue_stats_time INTERVAL;
    v_most_booked_time INTERVAL;
    v_bill_count INT;
BEGIN
    SELECT COUNT(*) INTO v_bill_count FROM bills;
    
    -- Time get_revenue_stats
    v_start_time := clock_timestamp();
    PERFORM get_revenue_stats();
    v_end_time := clock_timestamp();
    v_revenue_stats_time := v_end_time - v_start_time;
    
    -- Time get_most_booked_services
    v_start_time := clock_timestamp();
    PERFORM * FROM get_most_booked_services(5);
    v_end_time := clock_timestamp();
    v_most_booked_time := v_end_time - v_start_time;
    
    RAISE NOTICE '=== P1 PERFORMANCE REPORT ===';
    RAISE NOTICE 'Bills in table: %', v_bill_count;
    RAISE NOTICE 'get_revenue_stats execution time: %', v_revenue_stats_time;
    RAISE NOTICE 'get_most_booked_services execution time: %', v_most_booked_time;
    RAISE NOTICE '';
    RAISE NOTICE 'Expected improvements:';
    RAISE NOTICE '- No JS heap memory usage (all aggregation in SQL)';
    RAISE NOTICE '- Constant memory O(1) regardless of table size';
    RAISE NOTICE '- Only last 12 months scanned for monthly stats';
END $$;

-- =============================================
-- STEP 5: Cleanup (Optional)
-- =============================================

-- Remove stress test data when done:
-- DELETE FROM bills WHERE bill_number LIKE 'STRESS-%';
-- DROP FUNCTION IF EXISTS generate_stress_test_data;
