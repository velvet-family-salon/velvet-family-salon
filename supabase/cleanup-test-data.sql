-- CLEANUP SCRIPT: Delete all test data except services and staff
-- Run this in Supabase SQL Editor

-- WARNING: This deletes all appointments, users, and bills!

-- Step 1: Delete bills first (references appointments)
DELETE FROM bills;

-- Step 2: Delete appointment_services (junction table)
DELETE FROM appointment_services;

-- Step 3: Delete appointments
DELETE FROM appointments;

-- Step 4: Delete users (customers)
DELETE FROM users;

-- Step 5: Reset bill sequences
DELETE FROM bill_sequences;

-- Step 6: Clear blocked slots
DELETE FROM blocked_slots;

-- Verify cleanup
SELECT 'appointments' as table_name, COUNT(*) as count FROM appointments
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'appointment_services', COUNT(*) FROM appointment_services;

-- Should show all zeros
