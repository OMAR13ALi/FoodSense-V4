-- ============================================================
-- SEED DATA — local development only
-- Demo account: demo@calorieapp.com / Demo1234!
-- Shows: 35-day streak, weight loss progress, all achievements
-- ============================================================

DO $$
DECLARE
  uid       UUID := '00000000-0000-0000-0000-000000000001';
  today     DATE := CURRENT_DATE;
  i         INTEGER;
  meal_cal  INTEGER;
  meal_pro  INTEGER;
  meal_carb INTEGER;
  meal_fat  INTEGER;
BEGIN

-- ============================================================
-- 1. Auth user (email: demo@calorieapp.com / Demo1234!)
-- ============================================================
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  aud, role, created_at, updated_at
) VALUES (
  uid,
  '00000000-0000-0000-0000-000000000000',
  'demo@calorieapp.com',
  crypt('Demo1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated', 'authenticated',
  NOW() - INTERVAL '40 days', NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data,
  provider, last_sign_in_at, created_at, updated_at
) VALUES (
  uid, uid, 'demo@calorieapp.com',
  jsonb_build_object('sub', uid::text, 'email', 'demo@calorieapp.com'),
  'email', NOW(), NOW() - INTERVAL '40 days', NOW()
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. User profile — weight loss goal, 35-day streak
-- ============================================================
INSERT INTO public.user_profiles (
  id, email,
  height_cm, weight_kg, age, gender, activity_level,
  dietary_preference,
  daily_calorie_goal, target_protein, target_carbs, target_fat,
  theme, meal_reminders, track_water,
  data_sharing_consent, analytics_enabled,
  goal_type, target_weight_kg,
  current_streak, best_streak, last_streak_date,
  created_at, updated_at
) VALUES (
  uid, 'demo@calorieapp.com',
  178, 82.0, 28, 'male', 'moderate',
  'none',
  1800, 130, 200, 60,
  'auto', false, true,
  true, true,
  'weight_loss', 75.0,
  35, 35, today,
  NOW() - INTERVAL '40 days', NOW()
) ON CONFLICT (id) DO UPDATE SET
  goal_type        = EXCLUDED.goal_type,
  target_weight_kg = EXCLUDED.target_weight_kg,
  current_streak   = EXCLUDED.current_streak,
  best_streak      = EXCLUDED.best_streak,
  last_streak_date = EXCLUDED.last_streak_date;

-- ============================================================
-- 3. User settings
-- ============================================================
INSERT INTO public.user_settings (
  user_id,
  daily_calorie_goal, target_protein, target_carbs, target_fat,
  meal_reminders, track_water, dark_mode
) VALUES (
  uid,
  1800, 130, 200, 60,
  false, true, false
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Meals — 35 consecutive days, 3 meals/day
--    Totals per day: ~1750–1850 cal, ~115g protein
--    (within goal range → unlocks goal_hit and protein badges)
-- ============================================================
FOR i IN 1..35 LOOP

  -- Breakfast ~420 cal, 25g protein
  INSERT INTO public.meals (
    id, user_id, text,
    calories, protein, carbs, fat, timestamp
  ) VALUES (
    gen_random_uuid(), uid,
    CASE i % 5
      WHEN 0 THEN 'Oatmeal with banana and almond butter'
      WHEN 1 THEN 'Greek yogurt with berries and granola'
      WHEN 2 THEN 'Scrambled eggs on whole grain toast'
      WHEN 3 THEN 'Protein smoothie with banana and peanut butter'
      ELSE      'Avocado toast with two poached eggs'
    END,
    CASE i % 5 WHEN 0 THEN 420 WHEN 1 THEN 380 WHEN 2 THEN 440 WHEN 3 THEN 460 ELSE 400 END,
    CASE i % 5 WHEN 0 THEN 18  WHEN 1 THEN 25  WHEN 2 THEN 28  WHEN 3 THEN 32  ELSE 18  END,
    CASE i % 5 WHEN 0 THEN 62  WHEN 1 THEN 46  WHEN 2 THEN 44  WHEN 3 THEN 50  ELSE 36  END,
    CASE i % 5 WHEN 0 THEN 14  WHEN 1 THEN 8   WHEN 2 THEN 16  WHEN 3 THEN 14  ELSE 20  END,
    ((today - (35 - i))::TIMESTAMP + INTERVAL '8 hours')
  );

  -- Lunch ~600 cal, 45g protein
  INSERT INTO public.meals (
    id, user_id, text,
    calories, protein, carbs, fat, timestamp
  ) VALUES (
    gen_random_uuid(), uid,
    CASE i % 5
      WHEN 0 THEN 'Grilled chicken breast with rice and salad'
      WHEN 1 THEN 'Tuna wrap with lettuce and tomato'
      WHEN 2 THEN 'Turkey and cheese sandwich with apple'
      WHEN 3 THEN 'Salmon salad with olive oil dressing'
      ELSE      'Chicken stir-fry with brown rice'
    END,
    CASE i % 5 WHEN 0 THEN 580 WHEN 1 THEN 520 WHEN 2 THEN 545 WHEN 3 THEN 490 ELSE 600 END,
    CASE i % 5 WHEN 0 THEN 52  WHEN 1 THEN 38  WHEN 2 THEN 36  WHEN 3 THEN 42  ELSE 45  END,
    CASE i % 5 WHEN 0 THEN 56  WHEN 1 THEN 50  WHEN 2 THEN 60  WHEN 3 THEN 18  ELSE 64  END,
    CASE i % 5 WHEN 0 THEN 12  WHEN 1 THEN 15  WHEN 2 THEN 18  WHEN 3 THEN 28  ELSE 14  END,
    ((today - (35 - i))::TIMESTAMP + INTERVAL '13 hours')
  );

  -- Dinner ~650 cal, 42g protein
  INSERT INTO public.meals (
    id, user_id, text,
    calories, protein, carbs, fat, timestamp
  ) VALUES (
    gen_random_uuid(), uid,
    CASE i % 5
      WHEN 0 THEN 'Baked salmon with sweet potato and broccoli'
      WHEN 1 THEN 'Lean beef bolognese with pasta'
      WHEN 2 THEN 'Chicken curry with brown rice'
      WHEN 3 THEN 'Grilled cod with quinoa and vegetables'
      ELSE      'Turkey meatballs with zucchini noodles'
    END,
    CASE i % 5 WHEN 0 THEN 620 WHEN 1 THEN 690 WHEN 2 THEN 650 WHEN 3 THEN 520 ELSE 570 END,
    CASE i % 5 WHEN 0 THEN 45  WHEN 1 THEN 42  WHEN 2 THEN 38  WHEN 3 THEN 40  ELSE 44  END,
    CASE i % 5 WHEN 0 THEN 50  WHEN 1 THEN 74  WHEN 2 THEN 68  WHEN 3 THEN 44  ELSE 22  END,
    CASE i % 5 WHEN 0 THEN 22  WHEN 1 THEN 20  WHEN 2 THEN 18  WHEN 3 THEN 15  ELSE 26  END,
    ((today - (35 - i))::TIMESTAMP + INTERVAL '19 hours')
  );

END LOOP;

-- ============================================================
-- 5. Weight logs — 20 days, 82.0 → 80.3 kg (downward trend)
-- ============================================================
FOR i IN 1..20 LOOP
  INSERT INTO public.weight_logs (id, user_id, weight_kg, logged_at)
  VALUES (
    gen_random_uuid(),
    uid,
    ROUND((82.0 - (i - 1) * 0.09)::NUMERIC, 1),
    today - (20 - i)
  ) ON CONFLICT (user_id, logged_at) DO NOTHING;
END LOOP;

-- ============================================================
-- 6. Achievements — all 9 unlocked at realistic timestamps
-- ============================================================
INSERT INTO public.user_achievements (id, user_id, achievement_id, unlocked_at)
VALUES
  (gen_random_uuid(), uid, 'first_meal',        NOW() - INTERVAL '35 days'),
  (gen_random_uuid(), uid, 'streak_3',          NOW() - INTERVAL '32 days'),
  (gen_random_uuid(), uid, 'streak_7',          NOW() - INTERVAL '28 days'),
  (gen_random_uuid(), uid, 'streak_14',         NOW() - INTERVAL '21 days'),
  (gen_random_uuid(), uid, 'streak_30',         NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), uid, 'goal_hit_3',        NOW() - INTERVAL '32 days'),
  (gen_random_uuid(), uid, 'goal_hit_7',        NOW() - INTERVAL '28 days'),
  (gen_random_uuid(), uid, 'protein_champ',     NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), uid, 'under_budget_week', NOW() - INTERVAL '7 days')
ON CONFLICT (user_id, achievement_id) DO NOTHING;

END $$;
