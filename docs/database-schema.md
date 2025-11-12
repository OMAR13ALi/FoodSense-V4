# Database Schema Documentation

This document outlines the database schema for the Calorie Tracker app, designed for future migration to Supabase.

## Overview

The app currently uses AsyncStorage for local persistence. This schema is designed to support:
- Multi-user support with authentication
- Meal tracking with AI-powered nutrition analysis
- User settings and preferences
- Historical data and daily summaries

## Tables

### 1. users

Stores user account information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- User profile
  full_name TEXT,
  avatar_url TEXT,

  -- Settings stored as JSONB for flexibility
  settings JSONB DEFAULT '{
    "dailyCalorieGoal": 2000,
    "targetProtein": 150,
    "targetCarbs": 250,
    "targetFat": 65,
    "mealReminders": false,
    "trackWater": true,
    "darkMode": false
  }'::jsonb
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 2. meals

Stores individual meal entries with AI analysis results.

```sql
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Meal details
  text TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Nutrition data
  calories INTEGER NOT NULL DEFAULT 0,
  protein DECIMAL(8,2),
  carbs DECIMAL(8,2),
  fat DECIMAL(8,2),

  -- AI metadata
  ai_explanation TEXT,
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  sources TEXT[], -- Array of source URLs or names

  -- Error handling
  error TEXT,

  -- Flags
  is_manual BOOLEAN DEFAULT FALSE, -- True if user manually edited
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_date ON meals(date);
CREATE INDEX idx_meals_user_date ON meals(user_id, date);
CREATE INDEX idx_meals_created_at ON meals(created_at);

-- Enable Row Level Security
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own meals
CREATE POLICY meals_select_policy ON meals
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own meals
CREATE POLICY meals_insert_policy ON meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own meals
CREATE POLICY meals_update_policy ON meals
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own meals
CREATE POLICY meals_delete_policy ON meals
  FOR DELETE USING (auth.uid() = user_id);
```

### 3. daily_summaries (Optional - for performance)

Pre-aggregated daily statistics for faster queries.

```sql
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Totals
  total_calories INTEGER NOT NULL DEFAULT 0,
  total_protein DECIMAL(8,2) DEFAULT 0,
  total_carbs DECIMAL(8,2) DEFAULT 0,
  total_fat DECIMAL(8,2) DEFAULT 0,

  -- Metadata
  meal_count INTEGER NOT NULL DEFAULT 0,
  goal_calories INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_daily_summaries_user_id ON daily_summaries(user_id);
CREATE INDEX idx_daily_summaries_date ON daily_summaries(date);
CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, date);

-- Enable Row Level Security
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own summaries
CREATE POLICY daily_summaries_select_policy ON daily_summaries
  FOR SELECT USING (auth.uid() = user_id);
```

### 4. api_usage (Optional - for tracking AI API costs)

Track AI API usage and costs.

```sql
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- API details
  provider TEXT NOT NULL, -- 'openrouter' or 'perplexity'
  model TEXT NOT NULL,
  meal_text TEXT NOT NULL,

  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Costs (if applicable)
  tokens_used INTEGER,
  cost_usd DECIMAL(10,6),

  -- Status
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_requested_at ON api_usage(requested_at);

-- Enable Row Level Security
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage
CREATE POLICY api_usage_select_policy ON api_usage
  FOR SELECT USING (auth.uid() = user_id);
```

## Database Functions

### Update updated_at timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_summaries_updated_at BEFORE UPDATE ON daily_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Recalculate daily summary

```sql
CREATE OR REPLACE FUNCTION recalculate_daily_summary(
  p_user_id UUID,
  p_date DATE
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_summaries (
    user_id,
    date,
    total_calories,
    total_protein,
    total_carbs,
    total_fat,
    meal_count,
    goal_calories
  )
  SELECT
    p_user_id,
    p_date,
    COALESCE(SUM(calories), 0),
    COALESCE(SUM(protein), 0),
    COALESCE(SUM(carbs), 0),
    COALESCE(SUM(fat), 0),
    COUNT(*),
    (SELECT (settings->>'dailyCalorieGoal')::INTEGER FROM users WHERE id = p_user_id)
  FROM meals
  WHERE user_id = p_user_id
    AND date = p_date
    AND is_deleted = FALSE
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fat = EXCLUDED.total_fat,
    meal_count = EXCLUDED.meal_count,
    goal_calories = EXCLUDED.goal_calories,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

## Migration from AsyncStorage

### Step 1: Export current data

```typescript
import { exportAllData } from '@/services/storage-service';

const jsonData = await exportAllData();
// Save to file or upload to server
```

### Step 2: Transform and import to Supabase

```typescript
// Parse AsyncStorage data
const data = JSON.parse(jsonData);

// Extract settings
const settings = data.user_settings;

// Extract meals by date
const mealsByDate = Object.keys(data)
  .filter(key => key.startsWith('meals_'))
  .map(key => ({
    date: key.replace('meals_', ''),
    meals: data[key]
  }));

// Insert into Supabase
// 1. Create user (via auth)
// 2. Insert settings
// 3. Batch insert meals
```

## Supabase Setup Checklist

- [ ] Create Supabase project
- [ ] Run schema migrations
- [ ] Enable Row Level Security
- [ ] Configure authentication providers
- [ ] Set up database triggers
- [ ] Create database functions
- [ ] Test policies with test users
- [ ] Set up realtime subscriptions (if needed)
- [ ] Configure backups

## Future Enhancements

### Potential additional tables:

1. **meal_templates**: Save frequently eaten meals for quick entry
2. **water_intake**: Track daily water consumption
3. **weight_logs**: Track body weight over time
4. **meal_photos**: Store photos of meals
5. **favorites**: User's favorite meals or foods
6. **meal_sharing**: Share meals with friends or community

### Potential columns to add:

- `meals.meal_time` (breakfast, lunch, dinner, snack)
- `meals.location` (restaurant name, home, etc.)
- `meals.tags` (quick search and categorization)
- `meals.recipe_url` (link to recipe if applicable)
- `users.timezone` (for accurate date tracking)
- `users.preferred_units` (metric vs imperial)

## Notes

- All timestamps use `TIMESTAMP WITH TIME ZONE` for global users
- JSONB used for flexible settings that may change
- Arrays used for sources to avoid additional joins
- Soft deletes with `is_deleted` flag for data recovery
- Row Level Security ensures multi-tenant data isolation
- Indexes optimized for common queries (user_id, date ranges)
