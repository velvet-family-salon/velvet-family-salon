-- P3 FIX: Database Performance Indexes
-- Run this in Supabase SQL Editor
-- These indexes improve query performance without changing behavior

-- =============================================
-- Appointments Table Indexes
-- =============================================

-- Index for fetching appointments by date (common query pattern)
CREATE INDEX IF NOT EXISTS idx_appointments_date 
ON appointments(appointment_date);

-- Index for fetching appointments by status
CREATE INDEX IF NOT EXISTS idx_appointments_status 
ON appointments(status);

-- Composite index for date + status queries (dashboard, bookings page)
CREATE INDEX IF NOT EXISTS idx_appointments_date_status 
ON appointments(appointment_date, status);

-- Index for user lookup (history page)
CREATE INDEX IF NOT EXISTS idx_appointments_user_id 
ON appointments(user_id);

-- Index for staff lookup (staff schedule view)
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id 
ON appointments(staff_id);

-- =============================================
-- Bills Table Indexes
-- =============================================

-- Index for date-based queries (analytics, daily reports)
CREATE INDEX IF NOT EXISTS idx_bills_date 
ON bills(bill_date);

-- Index for customer lookup (history by phone)
CREATE INDEX IF NOT EXISTS idx_bills_customer_phone 
ON bills(customer_phone);

-- Composite index for monthly revenue queries
CREATE INDEX IF NOT EXISTS idx_bills_date_amount 
ON bills(bill_date, final_amount);

-- =============================================
-- Appointment Services Table Indexes
-- =============================================

-- Index for service popularity queries (most booked services)
CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id 
ON appointment_services(service_id);

-- Index for appointment lookup
CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment_id 
ON appointment_services(appointment_id);

-- =============================================
-- Users Table Indexes
-- =============================================

-- Index for phone lookup (login, history)
CREATE INDEX IF NOT EXISTS idx_users_phone 
ON users(phone);

-- Index for email lookup (admin queries)
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- =============================================
-- Services Table Indexes
-- =============================================

-- Index for active services filter
CREATE INDEX IF NOT EXISTS idx_services_active 
ON services(is_active);

-- Index for category filter
CREATE INDEX IF NOT EXISTS idx_services_category 
ON services(category);

-- Composite for common query pattern
CREATE INDEX IF NOT EXISTS idx_services_active_category 
ON services(is_active, category);

-- =============================================
-- Staff Table Indexes
-- =============================================

-- Index for active staff filter
CREATE INDEX IF NOT EXISTS idx_staff_active 
ON staff(is_active);

-- =============================================
-- Verification
-- =============================================

-- Check all indexes created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check index usage stats (run after some queries)
-- SELECT 
--     schemaname,
--     relname,
--     indexrelname,
--     idx_scan,
--     idx_tup_read,
--     idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
