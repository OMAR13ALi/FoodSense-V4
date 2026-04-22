-- Phase 2A: Initial Schema for Calorie Tracker
-- No authentication - using device_id as user identifier

-- Enable UUID extension for generating IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MEALS TABLE
-- Stores all meal entries with nutrition data
-- =====================================================
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL,
  text TEXT NOT NULL,
  calories NUMERIC(10, 2) NOT NULL,
  protein NUMERIC(10, 2),
  carbs NUMERIC(10, 2),
  fat NUMERIC(10, 2),
  timestamp TIMESTAMPTZ NOT NULL,
  ai_explanation TEXT,
  confidence NUMERIC(3, 2), -- 0.00 to 1.00
  sources JSONB, -- Array of source URLs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by device and date
CREATE INDEX idx_meals_device_timestamp ON meals(device_id, timestamp DESC);
CREATE INDEX idx_meals_device_id ON meals(device_id);

-- =====================================================
-- USER SETTINGS TABLE
-- Stores user preferences and goals (one row per device)
-- =====================================================
CREATE TABLE user_settings (
  device_id TEXT PRIMARY KEY,
  daily_calorie_goal INTEGER NOT NULL DEFAULT 2000,
  target_protein INTEGER NOT NULL DEFAULT 150,
  target_carbs INTEGER NOT NULL DEFAULT 250,
  target_fat INTEGER NOT NULL DEFAULT 65,
  meal_reminders BOOLEAN NOT NULL DEFAULT false,
  track_water BOOLEAN NOT NULL DEFAULT false,
  dark_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DAILY SUMMARIES TABLE
-- Pre-aggregated daily stats for performance
-- =====================================================
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL,
  date DATE NOT NULL,
  total_calories NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_protein NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_carbs NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_fat NUMERIC(10, 2) NOT NULL DEFAULT 0,
  meal_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, date) -- One summary per device per day
);

-- Index for fast queries by device and date range
CREATE INDEX idx_daily_summaries_device_date ON daily_summaries(device_id, date DESC);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to meals table
CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_settings table
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to daily_summaries table
CREATE TRIGGER update_daily_summaries_updated_at
  BEFORE UPDATE ON daily_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- For now: Allow all operations (no auth)
-- Later: Restrict by authenticated user
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (Phase 2A - no auth)
-- TODO: Restrict these in Phase 2B when authentication is added

CREATE POLICY "Allow all operations on meals"
  ON meals
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on user_settings"
  ON user_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on daily_summaries"
  ON daily_summaries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- HELPFUL VIEWS (OPTIONAL)
-- =====================================================

-- View: Today's meals for each device
CREATE OR REPLACE VIEW today_meals AS
SELECT
  device_id,
  id,
  text,
  calories,
  protein,
  carbs,
  fat,
  timestamp,
  ai_explanation,
  confidence,
  sources
FROM meals
WHERE DATE(timestamp AT TIME ZONE 'UTC') = CURRENT_DATE
ORDER BY timestamp DESC;

-- View: Daily summary stats (aggregated on-the-fly)
CREATE OR REPLACE VIEW daily_stats AS
SELECT
  device_id,
  DATE(timestamp AT TIME ZONE 'UTC') as date,
  COUNT(*) as meal_count,
  SUM(calories) as total_calories,
  SUM(protein) as total_protein,
  SUM(carbs) as total_carbs,
  SUM(fat) as total_fat
FROM meals
GROUP BY device_id, DATE(timestamp AT TIME ZONE 'UTC')
ORDER BY device_id, date DESC;

-- =====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Uncomment to add sample data for testing
-- INSERT INTO user_settings (device_id) VALUES ('test_device_123');
-- INSERT INTO meals (device_id, text, calories, protein, carbs, fat, timestamp)
-- VALUES
--   ('test_device_123', 'Scrambled eggs with toast', 350, 20, 30, 15, NOW()),
--   ('test_device_123', 'Grilled chicken salad', 420, 35, 25, 18, NOW() - INTERVAL '2 hours');
