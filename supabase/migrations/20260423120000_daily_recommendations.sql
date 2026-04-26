-- Daily AI-generated goal recommendations.
-- One row per user per calendar date (local to the user's device).
-- The client regenerates via the generate-recommendations edge function
-- when no row exists for today.

create table if not exists public.daily_recommendations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  date             date not null,
  pacing           jsonb not null default '{}'::jsonb,
  meal_suggestions jsonb not null default '[]'::jsonb,
  tips             jsonb not null default '[]'::jsonb,
  model            text,
  generated_at     timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists idx_daily_recommendations_user_date
  on public.daily_recommendations (user_id, date desc);

alter table public.daily_recommendations enable row level security;

create policy "daily_recommendations own rows"
  on public.daily_recommendations
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
