# P0 Remediation Deployment Guide

## Pre-Deployment Checklist

- [ ] Database backup completed
- [ ] Admin user credentials verified working
- [ ] Production traffic monitoring enabled

## Deployment Order (CRITICAL)

Run these SQL migrations IN ORDER in Supabase SQL Editor:

### Step 1: Bill Sequence (Safe, No Breaking Changes)
```
p0-fix-bill-sequence.sql
```
- Creates `bill_sequences` table
- Creates `generate_bill_number_atomic` RPC
- Adds unique constraint on `bill_number`

### Step 2: Booking Uniqueness (Safe, No Breaking Changes)
```
p0-fix-booking-uniqueness.sql
```
- First check for existing duplicates (query in file)
- Resolve any duplicates manually if found
- Creates partial unique index
- Updates `book_appointment_atomic` with advisory lock

### Step 3: RLS Hardening (⚠️ BREAKING CHANGE)
```
p0-fix-rls-hardening.sql
```
> [!CAUTION]
> After this step, anonymous users CANNOT access appointments/users tables directly.
> The booking RPC still works for public users.

## Post-Deployment Verification

Run verification tests:
```
p0-verification-tests.sql
```

### Manual Tests Required:

1. **Anonymous Booking Flow**:
   - Go to `/book` in incognito mode
   - Complete a booking
   - ✅ Expected: Booking succeeds (uses RPC)

2. **Admin Access**:
   - Login to `/admin`
   - Open dashboard
   - ✅ Expected: Can see appointments

3. **Bill Uniqueness**:
   - Complete two appointments rapidly
   - ✅ Expected: Different bill numbers

4. **Double Booking Prevention**:
   - Open two browser windows
   - Try to book same slot simultaneously
   - ✅ Expected: One succeeds, one fails with conflict message

## Rollback Procedures

### Rollback RLS (Emergency)
```sql
-- Re-enable anonymous access (ONLY FOR EMERGENCY)
DROP POLICY IF EXISTS "Authenticated users can view all appointments" ON appointments;
CREATE POLICY "Anyone can view appointments" ON appointments FOR SELECT USING (true);
-- Repeat for other affected tables
```

### Rollback Bill Sequence
```sql
-- Revert generateBillNumber in db.ts to count-based version
-- Then drop the RPC:
DROP FUNCTION IF EXISTS generate_bill_number_atomic;
DROP TABLE IF EXISTS bill_sequences;
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_bill_number_unique;
```

### Rollback Booking Uniqueness
```sql
DROP INDEX IF EXISTS idx_appointments_no_double_booking;
DROP INDEX IF EXISTS idx_appointments_any_staff_slot;
-- Note: book_appointment_atomic can stay with advisory lock (safe)
```

## Success Metrics

| Metric | Pre-Fix | Post-Fix Target |
|--------|---------|-----------------|
| Anonymous data access | Possible | Blocked |
| Duplicate bill numbers | Possible | Impossible |
| Double bookings | Possible | Impossible |
| Booking success rate | N/A | >99% |
