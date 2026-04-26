-- Store a short, user-facing description alongside each food so the AI
-- Analysis panel can show a clean blurb even on cache hits.
alter table public.foods
  add column if not exists description text;
