-- Testimonials table for admin-curated customer reviews
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    customer_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews config table (single row for site-wide settings)
CREATE TABLE IF NOT EXISTS reviews_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    average_rating DECIMAL(2,1) NOT NULL DEFAULT 5.0 CHECK (average_rating >= 1 AND average_rating <= 5),
    total_reviews_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default config row
INSERT INTO reviews_config (average_rating, total_reviews_count)
VALUES (5.0, 0)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews_config ENABLE ROW LEVEL SECURITY;

-- Testimonials policies (allow all operations for now - using anon key)
CREATE POLICY "Allow all testimonials operations"
    ON testimonials FOR ALL
    USING (true)
    WITH CHECK (true);

-- Reviews config policies (allow all operations)
CREATE POLICY "Allow all reviews_config operations"
    ON reviews_config FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_testimonials_is_active ON testimonials(is_active);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);
