-- =========================================================================
-- ORBIT — Initial schema migration
-- "Every person is a universe."
-- =========================================================================
-- Run via: supabase db push
-- or paste into the Supabase SQL editor.
-- =========================================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- ENUM-LIKE CHECK DOMAINS (kept as text + check constraints, not native
-- enums, so future categories/styles can be added without a migration
-- that rewrites the type).
-- -------------------------------------------------------------------------

-- language:     'en' | 'ar'
-- visibility:   'public' | 'private'
-- universe_mood:'calm' | 'mysterious' | 'creative' | 'warm' | 'futuristic' | 'minimal'
-- category:     'interest' | 'idea' | 'value' | 'skill' | 'goal' | 'passion' | 'current_exploration'
-- visual_type:  'star' | 'moon' | 'planet' | 'comet' | 'satellite'

-- -------------------------------------------------------------------------
-- TABLE: profiles
-- One row per user. id == auth.users.id (1:1).
-- -------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  username text not null unique,
  display_name text not null,
  bio text,

  language text not null default 'en'
    check (language in ('en', 'ar')),

  visibility text not null default 'private'
    check (visibility in ('public', 'private')),

  planet_color text not null default '#7c8cff',
  planet_surface_style text not null default 'smooth'
    check (planet_surface_style in ('smooth', 'cratered', 'banded', 'crystalline', 'oceanic')),
  planet_atmosphere text not null default 'thin'
    check (planet_atmosphere in ('none', 'thin', 'thick', 'stormy')),
  planet_glow integer not null default 3
    check (planet_glow between 0 and 5),
  planet_has_ring boolean not null default false,
  universe_mood text not null default 'calm'
    check (universe_mood in ('calm', 'mysterious', 'creative', 'warm', 'futuristic', 'minimal')),
  space_background text not null default 'deep_space'
    check (space_background in ('deep_space', 'nebula', 'aurora', 'void')),

  is_published boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint username_format check (
    username ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
    and username !~ '--'
  ),
  constraint username_length check (char_length(username) between 3 and 30),
  constraint display_name_length check (char_length(display_name) between 1 and 60),
  constraint bio_length check (bio is null or char_length(bio) <= 240)
);

comment on table public.profiles is 'One personal universe per user. id is shared with auth.users.';
comment on column public.profiles.bio is 'The one-sentence description shown on the public planet page.';

-- Reserved usernames that would collide with app routes or be abused.
create table if not exists public.reserved_usernames (
  username text primary key
);

insert into public.reserved_usernames (username) values
  ('admin'), ('api'), ('app'), ('auth'), ('create'), ('dashboard'),
  ('settings'), ('login'), ('logout'), ('signup'), ('signin'),
  ('about'), ('help'), ('support'), ('terms'), ('privacy'), ('orbit'),
  ('www'), ('null'), ('undefined'), ('root'), ('static'), ('assets'),
  ('public'), ('supabase')
on conflict do nothing;

-- -------------------------------------------------------------------------
-- TABLE: universe_objects
-- Many rows per profile. The things orbiting the planet.
-- -------------------------------------------------------------------------

create table if not exists public.universe_objects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,

  name text not null,
  category text not null
    check (category in ('interest', 'idea', 'value', 'skill', 'goal', 'passion', 'current_exploration')),
  description text,
  importance integer not null default 3
    check (importance between 1 and 5),

  visual_type text not null default 'star'
    check (visual_type in ('star', 'moon', 'planet', 'comet', 'satellite')),

  -- Deterministic layout, seeded by profile id + insertion order.
  -- Stored so the client never has to recompute/guess a stable position.
  position_x numeric not null default 0,
  position_y numeric not null default 0,
  object_size numeric not null default 1
    check (object_size > 0),
  object_color text,
  orbit_radius numeric not null default 100
    check (orbit_radius > 0),
  orbit_speed numeric not null default 1
    check (orbit_speed >= 0),

  -- Explicit ordering so drag/reorder in the editor is stable and doesn't
  -- depend on created_at ties.
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint object_name_length check (char_length(name) between 1 and 60),
  constraint object_description_length check (description is null or char_length(description) <= 280)
);

comment on table public.universe_objects is 'Identity objects (interests, values, goals, etc.) orbiting a profile''s planet.';

create index if not exists idx_universe_objects_profile_id
  on public.universe_objects(profile_id);

create index if not exists idx_universe_objects_profile_sort
  on public.universe_objects(profile_id, sort_order);

create index if not exists idx_profiles_username
  on public.profiles(username);

create index if not exists idx_profiles_published
  on public.profiles(is_published) where is_published = true;

-- Enforce max 20 objects per profile at the database level (app also
-- enforces this in the UI, but the DB is the source of truth).
create or replace function public.enforce_max_universe_objects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  object_count integer;
begin
  select count(*) into object_count
  from public.universe_objects
  where profile_id = new.profile_id;

  if tg_op = 'INSERT' and object_count >= 20 then
    raise exception 'A universe can contain at most 20 objects';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_max_universe_objects on public.universe_objects;
create trigger trg_enforce_max_universe_objects
  before insert on public.universe_objects
  for each row execute function public.enforce_max_universe_objects();

-- -------------------------------------------------------------------------
-- updated_at TRIGGERS
-- -------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_universe_objects_updated_at on public.universe_objects;
create trigger trg_universe_objects_updated_at
  before update on public.universe_objects
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- USERNAME RESERVATION CHECK (defense in depth, on top of the RLS/app
-- validation — a reserved username can never be written to profiles).
-- -------------------------------------------------------------------------

create or replace function public.check_username_not_reserved()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.reserved_usernames where username = new.username) then
    raise exception 'This username is reserved.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_username_reserved on public.profiles;
create trigger trg_check_username_reserved
  before insert or update of username on public.profiles
  for each row execute function public.check_username_not_reserved();

-- -------------------------------------------------------------------------
-- AUTO-CREATE PROFILE ON SIGNUP
-- A minimal, unpublished, private profile is created automatically so the
-- rest of the app can assume every authenticated user has a profile row.
-- Username starts as a temporary placeholder derived from the user id;
-- the creation flow (Step 1) immediately lets the user claim a real one.
-- -------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, visibility, is_published)
  values (
    new.id,
    'user-' || replace(new.id::text, '-', ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', 'New Explorer'),
    'private',
    false
  );
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.universe_objects enable row level security;

-- ---- profiles ------------------------------------------------------------

-- Owner can always read their own profile (published or not).
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Anyone (including anonymous visitors) can read a profile if it is
-- published AND public. This is what powers /[username].
create policy "profiles_select_public_published"
  on public.profiles
  for select
  to anon, authenticated
  using (is_published = true and visibility = 'public');

-- Owner can insert only their own row (in practice this happens via the
-- handle_new_user trigger, but this policy covers any direct insert path).
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Owner can update only their own row.
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Owner can delete only their own row.
create policy "profiles_delete_own"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

-- ---- universe_objects -----------------------------------------------------

-- Owner can read all of their own objects regardless of publish state.
create policy "universe_objects_select_own"
  on public.universe_objects
  for select
  to authenticated
  using (
    profile_id = auth.uid()
  );

-- Public visitors (and any authenticated user browsing someone else's
-- world) can read objects that belong to a published, public profile.
create policy "universe_objects_select_public_published"
  on public.universe_objects
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = universe_objects.profile_id
        and p.is_published = true
        and p.visibility = 'public'
    )
  );

-- Owner can insert objects only into their own universe.
create policy "universe_objects_insert_own"
  on public.universe_objects
  for insert
  to authenticated
  with check (profile_id = auth.uid());

-- Owner can update only their own objects.
create policy "universe_objects_update_own"
  on public.universe_objects
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Owner can delete only their own objects.
create policy "universe_objects_delete_own"
  on public.universe_objects
  for delete
  to authenticated
  using (profile_id = auth.uid());

-- reserved_usernames is readable by everyone (needed for client-side
-- username availability checks) but never writable from the client.
alter table public.reserved_usernames enable row level security;

create policy "reserved_usernames_select_all"
  on public.reserved_usernames
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policies on reserved_usernames for anon/authenticated
-- => only service_role (server) can modify it. This is intentional.

-- =========================================================================
-- CONVENIENCE VIEW: public_universes
-- Simplifies the public page query into a single read with objects
-- pre-aggregated as JSON, reducing round trips from the client.
-- Inherits RLS from the underlying tables via security_invoker.
-- =========================================================================

create or replace view public.public_universes
with (security_invoker = true)
as
select
  p.id,
  p.username,
  p.display_name,
  p.bio,
  p.language,
  p.planet_color,
  p.planet_surface_style,
  p.planet_atmosphere,
  p.planet_glow,
  p.planet_has_ring,
  p.universe_mood,
  p.space_background,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'category', o.category,
        'description', o.description,
        'importance', o.importance,
        'visual_type', o.visual_type,
        'position_x', o.position_x,
        'position_y', o.position_y,
        'object_size', o.object_size,
        'object_color', o.object_color,
        'orbit_radius', o.orbit_radius,
        'orbit_speed', o.orbit_speed,
        'sort_order', o.sort_order
      ) order by o.sort_order
    ) filter (where o.id is not null),
    '[]'::jsonb
  ) as objects
from public.profiles p
left join public.universe_objects o on o.profile_id = p.id
where p.is_published = true and p.visibility = 'public'
group by p.id;

-- =========================================================================
-- End of migration 0001
-- =========================================================================
