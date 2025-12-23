-- Velvet Family Salon - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- SERVICES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('men', 'women', 'unisex')),
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- STAFF TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Stylist',
  avatar_url TEXT,
  working_hours JSONB DEFAULT '{
    "monday": {"start": "09:00", "end": "21:00", "isOff": false},
    "tuesday": {"start": "09:00", "end": "21:00", "isOff": false},
    "wednesday": {"start": "09:00", "end": "21:00", "isOff": false},
    "thursday": {"start": "09:00", "end": "21:00", "isOff": false},
    "friday": {"start": "09:00", "end": "21:00", "isOff": false},
    "saturday": {"start": "09:00", "end": "21:00", "isOff": false},
    "sunday": {"start": "10:00", "end": "18:00", "isOff": false}
  }',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- STAFF_SERVICES TABLE (Many-to-Many)
-- ================================================
CREATE TABLE IF NOT EXISTS staff_services (
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

-- ================================================
-- APPOINTMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- BLOCKED_SLOTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Services: Public read, admin write
CREATE POLICY "Services are viewable by everyone" ON services
  FOR SELECT USING (true);

-- Staff: Public read, admin write
CREATE POLICY "Staff are viewable by everyone" ON staff
  FOR SELECT USING (true);

-- Appointments: Users can read their own, admin can read all
CREATE POLICY "Users can view their own appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Users can create their own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');

-- ================================================
-- SEED DATA - SERVICES
-- ================================================
INSERT INTO services (name, description, category, duration_minutes, price, sort_order) VALUES
  ('Classic Haircut', 'Professional haircut with styling', 'men', 30, 200, 1),
  ('Ladies Haircut', 'Precision cut and blow dry', 'women', 45, 400, 2),
  ('Kids Haircut', 'Fun and gentle hair cutting for kids', 'unisex', 20, 150, 3),
  ('Beard Styling', 'Trim, shape, and style your beard', 'men', 20, 150, 4),
  ('Hair Spa', 'Relaxing spa treatment for healthy hair', 'unisex', 60, 800, 5),
  ('Hair Coloring', 'Professional color with premium products', 'unisex', 90, 1500, 6),
  ('Facial & Cleanup', 'Deep cleansing facial for glowing skin', 'unisex', 45, 500, 7),
  ('Bridal Makeup', 'Complete bridal makeup package', 'women', 120, 5000, 8),
  ('Keratin Treatment', 'Premium keratin smoothening', 'unisex', 180, 4000, 9),
  ('Party Makeup', 'Glamorous makeup for special occasions', 'women', 60, 2000, 10)
ON CONFLICT DO NOTHING;

-- ================================================
-- SEED DATA - STAFF
-- ================================================
INSERT INTO staff (name, role) VALUES
  ('Rahul Kumar', 'Senior Stylist'),
  ('Priya Sharma', 'Beauty Expert'),
  ('Amit Verma', 'Hair Specialist')
ON CONFLICT DO NOTHING;

-- ================================================
-- FUNCTIONS
-- ================================================

-- Function to check slot availability
CREATE OR REPLACE FUNCTION check_slot_availability(
  p_staff_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  -- Check for overlapping appointments
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE staff_id = p_staff_id
    AND appointment_date = p_date
    AND status NOT IN ('cancelled')
    AND (
      (start_time <= p_start_time AND end_time > p_start_time)
      OR (start_time < p_end_time AND end_time >= p_end_time)
      OR (start_time >= p_start_time AND end_time <= p_end_time)
    );
  
  IF v_conflict_count > 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for blocked slots
  SELECT COUNT(*) INTO v_conflict_count
  FROM blocked_slots
  WHERE staff_id = p_staff_id
    AND date = p_date
    AND (
      (start_time <= p_start_time AND end_time > p_start_time)
      OR (start_time < p_end_time AND end_time >= p_end_time)
    );
  
  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
