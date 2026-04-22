-- Clean Auth-First Schema for Calorie Tracker App
-- This schema requires authentication for all features (no device_id/guest mode)
-- Run this in a NEW Supabase project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: user_profiles
-- Core user profile linked to auth.users
-- Created automatically via trigger when user signs up
-- ============================================================================

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,

  -- Physical attributes
  height_cm INTEGER CHECK (height_cm IS NULL OR (height_cm >= 100 AND height_cm <= 300)),
  weight_kg NUMERIC CHECK (weight_kg IS NULL OR (weight_kg >= 20 AND weight_kg <= 500)),
  age INTEGER CHECK (age IS NULL OR (age >= 13 AND age <= 120)),
  gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say')),

  -- Dietary preferences
  dietary_preference TEXT NOT NULL DEFAULT 'none' CHECK (
    dietary_preference IN ('none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo')
  ),
  allergies TEXT[],

  -- Nutrition goals
  daily_calorie_goal INTEGER NOT NULL DEFAULT 2000 CHECK (daily_calorie_goal >= 1000 AND daily_calorie_goal <= 10000),
  activity_level TEXT NOT NULL DEFAULT 'moderate' CHECK (
    activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')
  ),
  target_protein INTEGER NOT NULL DEFAULT 150 CHECK (target_protein >= 0 AND target_protein <= 1000),
  target_carbs INTEGER NOT NULL DEFAULT 250 CHECK (target_carbs >= 0 AND target_carbs <= 2000),
  target_fat INTEGER NOT NULL DEFAULT 65 CHECK (target_fat >= 0 AND target_fat <= 500),

  -- App preferences
  theme TEXT NOT NULL DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  meal_reminders BOOLEAN NOT NULL DEFAULT false,
  track_water BOOLEAN NOT NULL DEFAULT false,

  -- Privacy settings
  data_sharing_consent BOOLEAN NOT NULL DEFAULT false,
  analytics_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- Index for activity tracking
CREATE INDEX idx_user_profiles_last_active ON public.user_profiles(last_active);

-- ============================================================================
-- TABLE: meals
-- Stores individual meal entries with nutrition data
-- ============================================================================

CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Meal data
  text TEXT NOT NULL,
  calories NUMERIC NOT NULL CHECK (calories >= 0),
  protein NUMERIC CHECK (protein IS NULL OR protein >= 0),
  carbs NUMERIC CHECK (carbs IS NULL OR carbs >= 0),
  fat NUMERIC CHECK (fat IS NULL OR fat >= 0),

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL,

  -- AI-generated data
  ai_explanation TEXT,
  confidence NUMERIC CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  sources JSONB,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user + timestamp queries (most common query pattern)
-- This index efficiently handles date range queries, time-ordered queries, and recent meals
CREATE INDEX idx_meals_user_timestamp ON public.meals(user_id, timestamp DESC);

-- ============================================================================
-- TABLE: user_settings
-- User-specific settings and preferences
-- NOTE: Primary key is user_id (fixes upsert issues)
-- ============================================================================

CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Nutrition goals
  daily_calorie_goal INTEGER NOT NULL DEFAULT 2000 CHECK (daily_calorie_goal >= 1000 AND daily_calorie_goal <= 10000),
  target_protein INTEGER NOT NULL DEFAULT 150 CHECK (target_protein >= 0 AND target_protein <= 1000),
  target_carbs INTEGER NOT NULL DEFAULT 250 CHECK (target_carbs >= 0 AND target_carbs <= 2000),
  target_fat INTEGER NOT NULL DEFAULT 65 CHECK (target_fat >= 0 AND target_fat <= 500),

  -- App preferences
  meal_reminders BOOLEAN NOT NULL DEFAULT false,
  track_water BOOLEAN NOT NULL DEFAULT false,
  dark_mode BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: favorite_meals
-- User's saved/favorite meals for quick adding
-- ============================================================================

CREATE TABLE public.favorite_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Meal info
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  calories NUMERIC NOT NULL CHECK (calories >= 0 AND calories <= 10000),
  protein NUMERIC CHECK (protein IS NULL OR (protein >= 0 AND protein <= 1000)),
  carbs NUMERIC CHECK (carbs IS NULL OR (carbs >= 0 AND carbs <= 2000)),
  fat NUMERIC CHECK (fat IS NULL OR (fat >= 0 AND fat <= 500)),

  -- Optional data
  emoji TEXT,
  notes TEXT,

  -- Usage tracking
  frequency_count INTEGER NOT NULL DEFAULT 0 CHECK (frequency_count >= 0),
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX idx_favorite_meals_user ON public.favorite_meals(user_id);

-- Index for frequently used meals
CREATE INDEX idx_favorite_meals_frequency ON public.favorite_meals(user_id, frequency_count DESC);

-- ============================================================================
-- TABLE: daily_summaries
-- Pre-aggregated daily statistics for performance
-- ============================================================================

CREATE TABLE public.daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Daily totals
  total_calories NUMERIC NOT NULL DEFAULT 0 CHECK (total_calories >= 0),
  total_protein NUMERIC NOT NULL DEFAULT 0 CHECK (total_protein >= 0),
  total_carbs NUMERIC NOT NULL DEFAULT 0 CHECK (total_carbs >= 0),
  total_fat NUMERIC NOT NULL DEFAULT 0 CHECK (total_fat >= 0),
  meal_count INTEGER NOT NULL DEFAULT 0 CHECK (meal_count >= 0),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one summary per user per day
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Index for user + date queries
CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries(user_id, date DESC);

-- ============================================================================
-- FUNCTION: Automatic profile creation on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    created_at,
    updated_at,
    last_active
  ) VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Create profile when user signs up
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_profile();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- user_profiles policies
-- ============================================================================

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow trigger to insert profiles (CRITICAL for signup)
CREATE POLICY "Allow profile creation on signup"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================================================
-- meals policies
-- ============================================================================

-- Allow users to view their own meals
CREATE POLICY "Users can view own meals"
  ON public.meals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own meals
CREATE POLICY "Users can insert own meals"
  ON public.meals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own meals
CREATE POLICY "Users can update own meals"
  ON public.meals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own meals
CREATE POLICY "Users can delete own meals"
  ON public.meals
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- user_settings policies
-- ============================================================================

-- Allow users to view their own settings
CREATE POLICY "Users can view own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own settings
CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own settings
CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own settings
CREATE POLICY "Users can delete own settings"
  ON public.user_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- favorite_meals policies
-- ============================================================================

-- Allow users to view their own favorite meals
CREATE POLICY "Users can view own favorites"
  ON public.favorite_meals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own favorite meals
CREATE POLICY "Users can insert own favorites"
  ON public.favorite_meals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own favorite meals
CREATE POLICY "Users can update own favorites"
  ON public.favorite_meals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own favorite meals
CREATE POLICY "Users can delete own favorites"
  ON public.favorite_meals
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- daily_summaries policies
-- ============================================================================

-- Allow users to view their own summaries
CREATE POLICY "Users can view own summaries"
  ON public.daily_summaries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own summaries
CREATE POLICY "Users can insert own summaries"
  ON public.daily_summaries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own summaries
CREATE POLICY "Users can update own summaries"
  ON public.daily_summaries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own summaries
CREATE POLICY "Users can delete own summaries"
  ON public.daily_summaries
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_profiles IS 'Extended user profile data linked to auth.users';
COMMENT ON TABLE public.meals IS 'Individual meal entries with nutrition information';
COMMENT ON TABLE public.user_settings IS 'User-specific app settings and preferences';
COMMENT ON TABLE public.favorite_meals IS 'User-saved favorite meals for quick adding';
COMMENT ON TABLE public.daily_summaries IS 'Pre-aggregated daily nutrition statistics';

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after applying the migration to verify setup:
-- ============================================================================

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check if trigger exists
-- SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Test profile creation (after signing up a test user)
-- SELECT * FROM public.user_profiles;
