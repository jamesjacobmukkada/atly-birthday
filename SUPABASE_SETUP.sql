-- Run this in your Supabase SQL editor (supabase.com → your project → SQL Editor)

-- 1. Create the quotes table
CREATE TABLE quotes (
  id BIGSERIAL PRIMARY KEY,
  quote TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Allow anyone to READ quotes (so the game can fetch them)
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quotes"
  ON quotes FOR SELECT
  USING (true);

-- 3. Allow anyone to INSERT quotes (so friends can submit without login)
CREATE POLICY "Anyone can insert quotes"
  ON quotes FOR INSERT
  WITH CHECK (true);
