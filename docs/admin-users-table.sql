-- Admin Users Table for Velvet Family Salon
-- Run this in Supabase SQL Editor

-- Create the admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'staff')),
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view admin_users
CREATE POLICY "Authenticated users can view admin_users" ON admin_users
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only super_admins can insert new admin users
CREATE POLICY "Super admins can insert admin_users" ON admin_users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'super_admin')
    );

-- Policy: Only super_admins can update admin users
CREATE POLICY "Super admins can update admin_users" ON admin_users
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'super_admin')
    );

-- Policy: Only super_admins can delete admin users
CREATE POLICY "Super admins can delete admin_users" ON admin_users
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'super_admin')
    );

-- Insert your current admin user as super_admin
-- Replace the email and user_id with your actual values
-- You can find your user_id in Supabase Dashboard > Authentication > Users

-- IMPORTANT: Run this AFTER the table is created
-- INSERT INTO admin_users (user_id, email, name, role)
-- SELECT id, email, 'Admin', 'super_admin'
-- FROM auth.users
-- WHERE email = 'admin@velvetfamilysalon.com';
