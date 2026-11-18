-- ORBIT 0003 — planet design engine + Explore removed
--
-- * profiles.planet_design (jsonb): the extended look — secondary colour,
--   atmosphere tint, ring style, moons, tilt, spin, light, pattern scale,
--   variant and effects. Parsed/clamped by lib/planet/design.ts.
-- * Two new atmospheres (electric, dusty) and three new backdrops
--   (galaxy, milkyway, sunrise).
-- * The Explore directory is gone: drop its view, index and opt-out flag.

alter table public.profiles
  add column if not exists planet_design jsonb not null default '{}'::jsonb;

alter table public.profiles drop constraint if exists profiles_planet_design_check;
alter table public.profiles
  add constraint profiles_planet_design_check
  check (jsonb_typeof(planet_design) = 'object' and pg_column_size(planet_design) <= 2048);

alter table public.profiles drop constraint if exists profiles_planet_atmosphere_check;
alter table public.profiles
  add constraint profiles_planet_atmosphere_check
  check (planet_atmosphere in ('none', 'thin', 'thick', 'stormy', 'electric', 'dusty'));

alter table public.profiles drop constraint if exists profiles_space_background_check;
alter table public.profiles
  add constraint profiles_space_background_check
  check (space_background in ('deep_space', 'nebula', 'aurora', 'void', 'galaxy', 'milkyway', 'sunrise'));

-- Keep the legacy ring flag truthful for anything still reading it.
update public.profiles
   set planet_design = jsonb_build_object('ring', 'classic')
 where planet_has_ring and planet_design = '{}'::jsonb;

drop view if exists public.explore_planets;
drop index if exists public.idx_profiles_explore;
alter table public.profiles drop column if exists show_in_explore;
