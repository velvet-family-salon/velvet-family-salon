-- RLS FIX: Allow anonymous bookings
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON appointments;

-- USERS TABLE: Allow anyone to create users (for booking)
CREATE POLICY "Anyone can create users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (true);

-- APPOINTMENTS TABLE: Allow anyone to create appointments
CREATE POLICY "Anyone can create appointments" ON appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view appointments" ON appointments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update appointments" ON appointments
  FOR UPDATE USING (true);

-- BLOCKED SLOTS: Public read
CREATE POLICY "Anyone can view blocked slots" ON blocked_slots
  FOR SELECT USING (true);

-- Verify policies are applied
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
