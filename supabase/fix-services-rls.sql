-- Fix RLS for services table
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read services" ON services;
DROP POLICY IF EXISTS "Admins can read all services" ON services;
DROP POLICY IF EXISTS "Admins can insert services" ON services;
DROP POLICY IF EXISTS "Admins can update services" ON services;
DROP POLICY IF EXISTS "Admins can delete services" ON services;

-- Create permissive policies (using anon key)
CREATE POLICY "Allow all services operations"
    ON services FOR ALL
    USING (true)
    WITH CHECK (true);
