-- Gamification tables: weight_logs, user_achievements
-- Extend user_profiles with goal_type, target_weight_kg, streak fields

-- =====================================================
-- WEIGHT LOGS TABLE
-- One entry per day per user (unique constraint)
-- =====================================================
CREATE TABLE IF NOT EXISTS "public"."weight_logs" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "weight_kg" NUMERIC(5, 2) NOT NULL,
  "logged_at" DATE NOT NULL DEFAULT CURRENT_DATE,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("user_id", "logged_at")
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date
  ON "public"."weight_logs"("user_id", "logged_at" DESC);

ALTER TABLE "public"."weight_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weight logs"
  ON "public"."weight_logs" FOR ALL
  USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

-- =====================================================
-- USER ACHIEVEMENTS TABLE
-- Tracks which badges each user has unlocked
-- =====================================================
CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "achievement_id" TEXT NOT NULL,
  "unlocked_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("user_id", "achievement_id")
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user
  ON "public"."user_achievements"("user_id");

ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own achievements"
  ON "public"."user_achievements" FOR ALL
  USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

-- =====================================================
-- EXTEND user_profiles WITH GAMIFICATION COLUMNS
-- =====================================================
ALTER TABLE "public"."user_profiles"
  ADD COLUMN IF NOT EXISTS "goal_type" TEXT
    CHECK ("goal_type" IN ('weight_loss', 'maintenance', 'weight_gain', 'muscle_gain'))
    DEFAULT 'maintenance',
  ADD COLUMN IF NOT EXISTS "target_weight_kg" NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS "current_streak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "best_streak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "last_streak_date" DATE;
