-- FIX: Admin Users RLS Infinite Recursion
-- Run this in Supabase SQL Editor to fix the RLS policy error

-- Step 1: Drop ALL existing policies on admin_users
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin_users" ON admin_users;
DROP POLICY IF EXISTS "Authenticated users can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin_users" ON admin_users;

-- Step 2: Create NEW policies that avoid recursion
-- IMPORTANT: For SELECT, we allow all authenticated users (simple, no recursion)
CREATE POLICY "Authenticated users can view admin_users" ON admin_users
    FOR SELECT
    TO authenticated
    USING (true);

-- For INSERT/UPDATE/DELETE, we use auth.uid() directly in a security definer function
-- to avoid the recursive lookup

-- First create a helper function with SECURITY DEFINER to check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Now create policies using the function
CREATE POLICY "Super admins can insert admin_users" ON admin_users
    FOR INSERT
    TO authenticated
    WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update admin_users" ON admin_users
    FOR UPDATE
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super admins can delete admin_users" ON admin_users
    FOR DELETE
    TO authenticated
    USING (is_super_admin());

-- Step 3: Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'admin_users_user_id_key'
    ) THEN
        ALTER TABLE admin_users ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Step 4: Add yourself as super_admin
-- First check if user already exists
DELETE FROM admin_users WHERE email = 'velvetfamilysalon108@gmail.com';

-- Now insert fresh
INSERT INTO admin_users (user_id, email, name, role, is_active)
SELECT id, email, 'Super Admin', 'super_admin', true
FROM auth.users
WHERE email = 'velvetfamilysalon108@gmail.com';

-- Verify the fix
SELECT * FROM admin_users;
