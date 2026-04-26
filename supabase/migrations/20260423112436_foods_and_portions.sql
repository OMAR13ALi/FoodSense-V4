-- Phase 2: canonical foods knowledge base + portion-aware meal columns.

create extension if not exists pg_trgm with schema extensions;

-- ============================================================
-- foods: globally-shared, per-100g nutrition knowledge base
-- ============================================================
create table if not exists public.foods (
  id                    uuid primary key default gen_random_uuid(),
  canonical_name        text not null unique,
  display_name          text not null,
  per_100g_calories     numeric not null check (per_100g_calories >= 0),
  per_100g_protein      numeric not null check (per_100g_protein  >= 0),
  per_100g_carbs        numeric not null check (per_100g_carbs    >= 0),
  per_100g_fat          numeric not null check (per_100g_fat      >= 0),
  default_serving_g     numeric not null check (default_serving_g > 0),
  default_serving_unit  text    not null,
  density_g_per_ml      numeric,
  region                text,
  confidence            numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  sources               jsonb   not null default '[]'::jsonb,
  provider              text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists foods_canonical_name_trgm
  on public.foods using gin (canonical_name extensions.gin_trgm_ops);

alter table public.foods enable row level security;

-- Any authenticated user can read the shared catalog.
create policy "foods read (auth)" on public.foods
  for select
  to authenticated
  using (true);

-- Writes happen only via the resolve-food edge function (service role).
-- No insert/update/delete policies for regular users.

-- ============================================================
-- food_aliases: synonyms that resolve to a canonical food
-- ============================================================
create table if not exists public.food_aliases (
  alias      text primary key,
  food_id    uuid not null references public.foods(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.food_aliases enable row level security;

create policy "food_aliases read (auth)" on public.food_aliases
  for select
  to authenticated
  using (true);

-- ============================================================
-- user_food_overrides: per-user corrections
-- ============================================================
create table if not exists public.user_food_overrides (
  user_id            uuid not null references auth.users(id) on delete cascade,
  food_id            uuid not null references public.foods(id) on delete cascade,
  per_100g_calories  numeric,
  per_100g_protein   numeric,
  per_100g_carbs     numeric,
  per_100g_fat       numeric,
  default_serving_g  numeric,
  updated_at         timestamptz not null default now(),
  primary key (user_id, food_id)
);

alter table public.user_food_overrides enable row level security;

create policy "overrides own rows" on public.user_food_overrides
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- meals: snapshot the parsed portion + food linkage
-- ============================================================
alter table public.meals
  add column if not exists food_id        uuid references public.foods(id),
  add column if not exists quantity       numeric,
  add column if not exists unit           text,
  add column if not exists serving_size_g numeric;

create index if not exists meals_food_id_idx on public.meals (food_id);
