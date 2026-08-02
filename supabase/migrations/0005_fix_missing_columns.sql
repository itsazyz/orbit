-- =========================================================================
-- ORBIT — Fix missing columns (run this if you see "schema cache" errors)
-- Safe to run multiple times — uses IF NOT EXISTS everywhere.
-- After running: Supabase refreshes the API schema automatically within ~1 min,
-- or go to Project Settings → API → Reload schema cache.
-- =========================================================================

-- ---- profiles: planet customization columns ----
alter table public.profiles
  add column if not exists planet_color text not null default '#7c8cff';

alter table public.profiles
  add column if not exists planet_surface_style text not null default 'smooth';

alter table public.profiles
  add column if not exists planet_atmosphere text not null default 'thin';

alter table public.profiles
  add column if not exists planet_glow integer not null default 3;

alter table public.profiles
  add column if not exists planet_has_ring boolean not null default false;

alter table public.profiles
  add column if not exists universe_mood text not null default 'calm';

alter table public.profiles
  add column if not exists space_background text not null default 'deep_space';

alter table public.profiles
  add column if not exists language text not null default 'en';

alter table public.profiles
  add column if not exists visibility text not null default 'private';

alter table public.profiles
  add column if not exists is_published boolean not null default false;

alter table public.profiles
  add column if not exists bio text;

alter table public.profiles
  add column if not exists created_at timestamptz not null default now();

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

-- ---- profiles: music columns (from 0003) ----
alter table public.profiles
  add column if not exists music_url text;

alter table public.profiles
  add column if not exists music_enabled boolean not null default false;

alter table public.profiles
  add column if not exists music_volume numeric not null default 0.3;

-- ---- stars: customization columns (from 0003) ----
alter table public.stars
  add column if not exists visual_type text not null default 'sparkle';

alter table public.stars
  add column if not exists orbit_speed numeric not null default 1;

alter table public.stars
  add column if not exists star_color text;

-- Tell PostgREST to reload its schema cache immediately
notify pgrst, 'reload schema';
