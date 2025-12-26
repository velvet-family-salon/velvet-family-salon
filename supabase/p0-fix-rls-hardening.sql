-- P0 Fix: Restrictive RLS Policies
-- Run this migration in Supabase SQL Editor
-- WARNING: This removes anonymous access. Admin authentication REQUIRED after this.

-- =============================================
-- STEP 1: Drop existing permissive policies
-- =============================================

-- Appointments
DROP POLICY IF EXISTS "Anyone can create appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can view appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can update appointments" ON appointments;

-- Users
DROP POLICY IF EXISTS "Anyone can create users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- =============================================
-- STEP 2: Create restrictive policies
-- =============================================

-- APPOINTMENTS: Public can create (via RPC), only authenticated can read/update
-- Note: booking happens through book_appointment_atomic RPC which uses SECURITY DEFINER

CREATE POLICY "Authenticated users can view all appointments" ON appointments
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update appointments" ON appointments
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert appointments" ON appointments
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- USERS: Only authenticated can view, RPC handles creation
CREATE POLICY "Authenticated users can view all users" ON users
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update users" ON users
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Note: Users are created by book_appointment_atomic RPC which is SECURITY DEFINER
-- so it bypasses RLS. We don't need a public INSERT policy.

-- =============================================
-- STEP 3: Ensure RPC has proper permissions
-- =============================================

-- The book_appointment_atomic function already has SECURITY DEFINER
-- This means it runs with elevated privileges regardless of caller's role

-- =============================================
-- STEP 4: Add policies for appointment_services
-- =============================================

ALTER TABLE IF EXISTS appointment_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view appointment_services" ON appointment_services;
DROP POLICY IF EXISTS "Anyone can create appointment_services" ON appointment_services;
DROP POLICY IF EXISTS "Anyone can update appointment_services" ON appointment_services;

CREATE POLICY "Authenticated users can view appointment_services" ON appointment_services
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert appointment_services" ON appointment_services
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update appointment_services" ON appointment_services
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- =============================================
-- STEP 5: Bills table RLS
-- =============================================

ALTER TABLE IF EXISTS bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view bills" ON bills;
DROP POLICY IF EXISTS "Anyone can create bills" ON bills;

CREATE POLICY "Authenticated users can view bills" ON bills
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert bills" ON bills
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- VERIFICATION QUERIES
-- Run these to confirm policies are applied
-- =============================================

-- Check all policies
SELECT tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Test: This should FAIL for anonymous users:
-- SELECT * FROM appointments LIMIT 1;
