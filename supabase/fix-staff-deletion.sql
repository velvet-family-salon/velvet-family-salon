-- Migration: Implement Soft Delete for Staff
-- Run this in Supabase SQL Editor

-- 1. Add is_deleted column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_staff_is_deleted ON staff(is_deleted);

-- 3. Fix RLS Policies for Staff
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Staff are viewable by everyone" ON staff;

-- Allow everyone to view ONLY non-deleted staff (for public booking)
CREATE POLICY "Anyone can view non-deleted staff" ON staff
  FOR SELECT USING (is_deleted = false);

-- Allow authenticated users (admins) to view ALL staff (even deleted ones)
CREATE POLICY "Admins can view all staff" ON staff
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to manage staff
CREATE POLICY "Admins can manage staff" ON staff
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Fix RLS Policies for Services (Missing manage permissions)
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;

CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all services" ON services
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage services" ON services
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
