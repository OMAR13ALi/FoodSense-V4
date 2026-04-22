-- Migration: drop XP/level tracking — gamification simplified to streaks + goal progress.
-- Keeps user_profiles.celebrated_milestones (still used for weight-milestone dedup).

DROP FUNCTION IF EXISTS "public"."award_xp"(UUID, INTEGER);

ALTER TABLE "public"."user_profiles"
  DROP COLUMN IF EXISTS "xp",
  DROP COLUMN IF EXISTS "level";
