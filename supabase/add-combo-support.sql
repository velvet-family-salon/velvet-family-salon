-- Migration: Add Combo and Special Offer Support
-- Run this in Supabase SQL Editor

-- 1. Update Category Constraint to allow 'combo'
-- First drop the existing constraint to modify it
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_category_check;

-- Re-add with 'combo' option
ALTER TABLE services ADD CONSTRAINT services_category_check 
  CHECK (category IN ('men', 'women', 'unisex', 'combo'));

-- 2. Add New Columns for Offers & Combos
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_combo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS offer_end_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS included_services JSONB DEFAULT '[]'::jsonb;

-- 3. Create Indexes for performance checks
CREATE INDEX IF NOT EXISTS idx_services_is_combo ON services(is_combo);
CREATE INDEX IF NOT EXISTS idx_services_featured ON services(is_featured);

-- 4. Comment on columns for clarity
COMMENT ON COLUMN services.compare_at_price IS 'Original market price before discount. Used to show "Save X%"';
COMMENT ON COLUMN services.included_services IS 'Array of service IDs/names included in this combo. Format: [{id, name}, ...]';
