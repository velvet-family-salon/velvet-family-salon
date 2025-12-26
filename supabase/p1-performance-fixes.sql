-- P1 Performance Fixes: SQL Aggregation RPCs
-- Run this in Supabase SQL Editor

-- =============================================
-- RPC #1: Get Most Booked Services (eliminates N+1 query)
-- =============================================
-- BEFORE: 2 queries + JS sorting of all services
-- AFTER: 1 query with SQL GROUP BY and ORDER BY

CREATE OR REPLACE FUNCTION get_most_booked_services(p_limit INT DEFAULT 5)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    price NUMERIC,
    duration_minutes INT,
    category TEXT,
    image_url TEXT,
    is_active BOOLEAN,
    is_featured BOOLEAN,
    is_combo BOOLEAN,
    compare_at_price NUMERIC,
    included_services JSONB,
    booking_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        s.id,
        s.name,
        s.description,
        s.price,
        s.duration_minutes,
        s.category,
        s.image_url,
        s.is_active,
        s.is_featured,
        s.is_combo,
        s.compare_at_price,
        s.included_services,
        COALESCE(COUNT(aps.id), 0) as booking_count
    FROM services s
    LEFT JOIN appointment_services aps ON s.id = aps.service_id
    WHERE s.is_active = true AND s.is_combo = false
    GROUP BY s.id
    ORDER BY booking_count DESC, s.name ASC
    LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_most_booked_services TO authenticated;

-- =============================================
-- RPC #2: Get Revenue Stats (eliminates loading all bills into memory)
-- =============================================
-- BEFORE: Loads ALL bills into JS memory, processes with array methods
-- AFTER: SQL SUM/COUNT with date filtering, no memory overflow

CREATE OR REPLACE FUNCTION get_revenue_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_today DATE := CURRENT_DATE;
    v_month_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_year_start DATE := DATE_TRUNC('year', CURRENT_DATE)::DATE;
BEGIN
    SELECT jsonb_build_object(
        -- Core metrics from single aggregation
        'totalRevenue', COALESCE(SUM(final_amount), 0),
        'totalBills', COUNT(*),
        'totalClients', COUNT(DISTINCT customer_phone),
        'avgBillValue', CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(final_amount) / COUNT(*)) ELSE 0 END,
        
        -- Discount metrics
        'totalDiscount', COALESCE(SUM(discount_amount), 0),
        'billsWithDiscount', COUNT(*) FILTER (WHERE discount_percent > 0),
        'avgDiscountPercent', COALESCE(
            ROUND(AVG(discount_percent) FILTER (WHERE discount_percent > 0)), 0
        ),
        
        -- Period-based revenue
        'todayRevenue', COALESCE(SUM(final_amount) FILTER (WHERE bill_date = v_today), 0),
        'mtdRevenue', COALESCE(SUM(final_amount) FILTER (WHERE bill_date >= v_month_start), 0),
        'ytdRevenue', COALESCE(SUM(final_amount) FILTER (WHERE bill_date >= v_year_start), 0)
    )
    INTO v_result
    FROM bills;
    
    -- Add monthly revenue breakdown (last 12 months only)
    v_result := v_result || jsonb_build_object(
        'monthlyRevenue', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'month', TO_CHAR(month_start, 'YYYY-MM'),
                    'revenue', revenue,
                    'bills', bill_count
                ) ORDER BY month_start
            ), '[]'::jsonb)
            FROM (
                SELECT 
                    DATE_TRUNC('month', bill_date)::DATE as month_start,
                    COALESCE(SUM(final_amount), 0) as revenue,
                    COUNT(*) as bill_count
                FROM bills
                WHERE bill_date >= (CURRENT_DATE - INTERVAL '12 months')
                GROUP BY DATE_TRUNC('month', bill_date)
            ) monthly
        )
    );
    
    -- Add top 10 services by usage
    v_result := v_result || jsonb_build_object(
        'serviceStats', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'name', svc_name,
                    'count', svc_count,
                    'revenue', svc_revenue
                ) ORDER BY svc_count DESC
            ), '[]'::jsonb)
            FROM (
                SELECT 
                    svc->>'name' as svc_name,
                    COUNT(*) as svc_count,
                    SUM((svc->>'price')::NUMERIC) as svc_revenue
                FROM bills, jsonb_array_elements(services) as svc
                GROUP BY svc->>'name'
                ORDER BY svc_count DESC
                LIMIT 10
            ) top_services
        )
    );
    
    -- Add best/worst month
    v_result := v_result || (
        SELECT jsonb_build_object(
            'bestMonth', (
                SELECT jsonb_build_object('month', TO_CHAR(DATE_TRUNC('month', bill_date), 'YYYY-MM'), 'revenue', SUM(final_amount))
                FROM bills
                GROUP BY DATE_TRUNC('month', bill_date)
                ORDER BY SUM(final_amount) DESC
                LIMIT 1
            ),
            'worstMonth', (
                SELECT jsonb_build_object('month', TO_CHAR(DATE_TRUNC('month', bill_date), 'YYYY-MM'), 'revenue', SUM(final_amount))
                FROM bills
                GROUP BY DATE_TRUNC('month', bill_date)
                ORDER BY SUM(final_amount) ASC
                LIMIT 1
            )
        )
    );
    
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_revenue_stats TO authenticated;

-- =============================================
-- VERIFICATION
-- =============================================

-- Test most booked services
-- SELECT * FROM get_most_booked_services(5);

-- Test revenue stats
-- SELECT get_revenue_stats();
