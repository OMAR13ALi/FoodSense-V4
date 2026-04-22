-- Migration: add XP tracking, level tracking, and weight milestone celebration tracking

ALTER TABLE "public"."user_profiles"
  ADD COLUMN IF NOT EXISTS "xp" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "celebrated_milestones" TEXT[] NOT NULL DEFAULT '{}';

-- Atomic XP increment RPC to avoid race conditions
CREATE OR REPLACE FUNCTION "public"."award_xp"(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, did_level_up BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_thresholds INTEGER[] := ARRAY[0,100,250,500,1000,2000,3500,5500,8000,12000];
  i INTEGER;
BEGIN
  UPDATE public.user_profiles
    SET xp = xp + p_amount, updated_at = NOW()
    WHERE id = p_user_id
    RETURNING xp, level INTO v_new_xp, v_old_level;

  v_new_level := 1;
  FOR i IN 1..array_length(v_thresholds, 1) LOOP
    IF v_new_xp >= v_thresholds[i] THEN v_new_level := i; END IF;
  END LOOP;

  IF v_new_level != v_old_level THEN
    UPDATE public.user_profiles SET level = v_new_level WHERE id = p_user_id;
  END IF;

  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > v_old_level);
END;
$$;
