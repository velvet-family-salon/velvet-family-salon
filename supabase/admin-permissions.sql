-- Admin Permissions System Migration
-- Run this in Supabase SQL Editor

-- Step 1: Add permissions column to admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "view_dashboard": true,
  "view_bookings": true,
  "manage_bookings": false,
  "view_services": true,
  "manage_services": false,
  "view_staff": true,
  "manage_staff": false,
  "view_testimonials": true,
  "manage_testimonials": false,
  "view_reviews": true,
  "manage_reviews": false,
  "view_users": false,
  "manage_users": false
}'::jsonb;

-- Step 2: Give super_admin all permissions
UPDATE admin_users 
SET permissions = '{
  "view_dashboard": true,
  "view_bookings": true,
  "manage_bookings": true,
  "view_services": true,
  "manage_services": true,
  "view_staff": true,
  "manage_staff": true,
  "view_testimonials": true,
  "manage_testimonials": true,
  "view_reviews": true,
  "manage_reviews": true,
  "view_users": true,
  "manage_users": true
}'::jsonb
WHERE role = 'super_admin';

-- Verify
SELECT id, email, role, permissions FROM admin_users;
