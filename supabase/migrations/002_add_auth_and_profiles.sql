-- Phase 1: Authentication & User Profiles
-- Adds authentication support, user profiles, and favorite meals

-- =====================================================
-- USER PROFILES TABLE
-- Extends auth.users with app-specific data
-- =====================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE, -- Nullable to support OAuth and other auth methods without email

  -- Physical data (from onboarding - all optional)
  height_cm INTEGER CHECK (height_cm IS NULL OR (height_cm >= 100 AND height_cm <= 300)),
  weight_kg NUMERIC(5, 2) CHECK (weight_kg IS NULL OR (weight_kg >= 20 AND weight_kg <= 500)),
  age INTEGER CHECK (age IS NULL OR (age >= 13 AND age <= 120)),
  gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say')),

  -- Dietary preferences (from onboarding)
  dietary_preference TEXT DEFAULT 'none' CHECK (dietary_preference IN ('none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo')),
  allergies TEXT[], -- Array of allergen strings

  -- Nutrition goals (migrated from user_settings)
  daily_calorie_goal INTEGER NOT NULL DEFAULT 2000 CHECK (daily_calorie_goal >= 1000 AND daily_calorie_goal <= 10000),
  activity_level TEXT DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  target_protein INTEGER NOT NULL DEFAULT 150 CHECK (target_protein >= 0 AND target_protein <= 1000),
  target_carbs INTEGER NOT NULL DEFAULT 250 CHECK (target_carbs >= 0 AND target_carbs <= 2000),
  target_fat INTEGER NOT NULL DEFAULT 65 CHECK (target_fat >= 0 AND target_fat <= 500),

  -- App preferences
  theme TEXT NOT NULL DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  meal_reminders BOOLEAN NOT NULL DEFAULT false,
  track_water BOOLEAN NOT NULL DEFAULT false,

  -- Privacy & consent
  data_sharing_consent BOOLEAN NOT NULL DEFAULT false,
  analytics_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Migration tracking
  device_id TEXT, -- Original device ID for data migration
  migrated_at TIMESTAMPTZ, -- When device data was migrated to this account

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Index for device_id lookups during migration
CREATE INDEX idx_user_profiles_device_id ON user_profiles(device_id) WHERE device_id IS NOT NULL;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with all required defaults to prevent constraint violations
  INSERT INTO user_profiles (
    id, 
    email,
    daily_calorie_goal,
    activity_level,
    target_protein,
    target_carbs,
    target_fat,
    theme,
    meal_reminders,
    track_water,
    data_sharing_consent,
    analytics_enabled,
    created_at,
    updated_at,
    last_active
  )
  VALUES (
    NEW.id, 
    NEW.email,
    2000, -- daily_calorie_goal
    'moderate', -- activity_level
    150, -- target_protein
    250, -- target_carbs
    65, -- target_fat
    'auto', -- theme
    false, -- meal_reminders
    false, -- track_water
    false, -- data_sharing_consent
    true, -- analytics_enabled
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate if somehow triggered twice
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile after signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- FAVORITE MEALS TABLE
-- Saved meals for quick-add functionality
-- =====================================================
CREATE TABLE favorite_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Meal details
  name TEXT NOT NULL CHECK (LENGTH(name) > 0 AND LENGTH(name) <= 100),
  calories NUMERIC(10, 2) NOT NULL CHECK (calories >= 0 AND calories <= 10000),
  protein NUMERIC(10, 2) CHECK (protein IS NULL OR (protein >= 0 AND protein <= 1000)),
  carbs NUMERIC(10, 2) CHECK (carbs IS NULL OR (carbs >= 0 AND carbs <= 2000)),
  fat NUMERIC(10, 2) CHECK (fat IS NULL OR (fat >= 0 AND fat <= 500)),

  -- Optional metadata
  emoji TEXT, -- Optional emoji icon (e.g., '🍳', '🥗', '🍗')
  notes TEXT, -- Optional user notes

  -- Usage tracking
  frequency_count INTEGER NOT NULL DEFAULT 0 CHECK (frequency_count >= 0),
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by user
CREATE INDEX idx_favorite_meals_user_id ON favorite_meals(user_id);

-- Index for sorting by frequency (most used first)
CREATE INDEX idx_favorite_meals_frequency ON favorite_meals(user_id, frequency_count DESC);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_favorite_meals_updated_at
  BEFORE UPDATE ON favorite_meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ADD user_id TO EXISTING TABLES
-- =====================================================

-- Add user_id to meals table (nullable for migration period)
ALTER TABLE meals
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to daily_summaries table (nullable for migration period)
ALTER TABLE daily_summaries
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to user_settings table (nullable for migration period)
ALTER TABLE user_settings
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for user_id queries
CREATE INDEX idx_meals_user_id ON meals(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_meals_user_timestamp ON meals(user_id, timestamp DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_daily_summaries_user_id ON daily_summaries(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, date DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id) WHERE user_id IS NOT NULL;

-- =====================================================
-- UPDATE ROW LEVEL SECURITY POLICIES
-- Now that we have auth, restrict access to user's own data
-- =====================================================

-- Drop old "allow all" policies
DROP POLICY IF EXISTS "Allow all operations on meals" ON meals;
DROP POLICY IF EXISTS "Allow all operations on user_settings" ON user_settings;
DROP POLICY IF EXISTS "Allow all operations on daily_summaries" ON daily_summaries;

-- MEALS POLICIES
CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT
  USING (auth.uid() = user_id OR device_id IS NOT NULL); -- Allow device_id fallback during migration

CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT
  WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND device_id IS NOT NULL)); -- Allow device_id for guest mode

CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  USING (auth.uid() = user_id OR device_id IS NOT NULL)
  WITH CHECK (auth.uid() = user_id OR device_id IS NOT NULL);

CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  USING (auth.uid() = user_id OR device_id IS NOT NULL);

-- USER PROFILES POLICIES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- CRITICAL: Allow profile creation on signup (required for trigger to work)
CREATE POLICY "Allow profile creation on signup"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Note: Users cannot delete their own profile (done via auth.users deletion)

-- DAILY SUMMARIES POLICIES
CREATE POLICY "Users can view own summaries"
  ON daily_summaries FOR SELECT
  USING (auth.uid() = user_id OR device_id IS NOT NULL);

CREATE POLICY "Users can insert own summaries"
  ON daily_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND device_id IS NOT NULL));

CREATE POLICY "Users can update own summaries"
  ON daily_summaries FOR UPDATE
  USING (auth.uid() = user_id OR device_id IS NOT NULL)
  WITH CHECK (auth.uid() = user_id OR device_id IS NOT NULL);

CREATE POLICY "Users can delete own summaries"
  ON daily_summaries FOR DELETE
  USING (auth.uid() = user_id OR device_id IS NOT NULL);

-- USER SETTINGS POLICIES
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id OR device_id IS NOT NULL);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND device_id IS NOT NULL));

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id OR device_id IS NOT NULL)
  WITH CHECK (auth.uid() = user_id OR device_id IS NOT NULL);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id OR device_id IS NOT NULL);

-- FAVORITE MEALS POLICIES
ALTER TABLE favorite_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorite_meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorite_meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites"
  ON favorite_meals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorite_meals FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- DATA MIGRATION HELPER FUNCTION
-- Migrates device_id data to authenticated user
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_device_data_to_user(
  p_device_id TEXT,
  p_user_id UUID
)
RETURNS TABLE(
  meals_migrated INTEGER,
  settings_migrated INTEGER,
  summaries_migrated INTEGER
) AS $$
DECLARE
  v_meals_count INTEGER;
  v_settings_count INTEGER;
  v_summaries_count INTEGER;
BEGIN
  -- Check if device_id has already been claimed
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE device_id = p_device_id AND id != p_user_id
  ) THEN
    RAISE EXCEPTION 'Device data already claimed by another user';
  END IF;

  -- Migrate meals
  UPDATE meals
  SET user_id = p_user_id
  WHERE device_id = p_device_id AND user_id IS NULL;

  GET DIAGNOSTICS v_meals_count = ROW_COUNT;

  -- Migrate settings
  UPDATE user_settings
  SET user_id = p_user_id
  WHERE device_id = p_device_id AND user_id IS NULL;

  GET DIAGNOSTICS v_settings_count = ROW_COUNT;

  -- Migrate daily summaries
  UPDATE daily_summaries
  SET user_id = p_user_id
  WHERE device_id = p_device_id AND user_id IS NULL;

  GET DIAGNOSTICS v_summaries_count = ROW_COUNT;

  -- Update user profile with device_id and migration timestamp
  UPDATE user_profiles
  SET
    device_id = p_device_id,
    migrated_at = NOW()
  WHERE id = p_user_id;

  -- Return migration stats
  RETURN QUERY SELECT v_meals_count, v_settings_count, v_summaries_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UPDATED VIEWS (Include user_id)
-- =====================================================

-- Drop existing views before recreating with new column structure
DROP VIEW IF EXISTS today_meals;
DROP VIEW IF EXISTS daily_stats;

-- Update today_meals view to support both device_id and user_id
CREATE OR REPLACE VIEW today_meals AS
SELECT
  device_id,
  user_id,
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

-- Update daily_stats view to support both device_id and user_id
CREATE OR REPLACE VIEW daily_stats AS
SELECT
  device_id,
  user_id,
  DATE(timestamp AT TIME ZONE 'UTC') as date,
  COUNT(*) as meal_count,
  SUM(calories) as total_calories,
  SUM(protein) as total_protein,
  SUM(carbs) as total_carbs,
  SUM(fat) as total_fat
FROM meals
GROUP BY device_id, user_id, DATE(timestamp AT TIME ZONE 'UTC')
ORDER BY date DESC;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_profiles IS 'Extended user profile data including physical info, dietary preferences, and nutrition goals';
COMMENT ON TABLE favorite_meals IS 'User-saved meals for quick-add functionality';
COMMENT ON COLUMN user_profiles.device_id IS 'Original device ID for data migration tracking';
COMMENT ON COLUMN user_profiles.migrated_at IS 'Timestamp when device data was migrated to this user account';
COMMENT ON FUNCTION migrate_device_data_to_user IS 'Migrates all data from device_id to authenticated user_id';
