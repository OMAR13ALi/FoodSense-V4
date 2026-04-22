-- Add pace_kg_per_week to user_profiles so the calorie recommendation
-- can derive a dynamic deficit/surplus from the user's chosen pace.
alter table public.user_profiles
  add column if not exists pace_kg_per_week numeric(4, 2) default 0.5;
