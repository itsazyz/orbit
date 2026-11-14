-- =========================================================================
-- ORBIT — baseline schema (v2)
-- "Every person is a universe."
--
-- Replaces the eleven incremental migrations from v1 with one clean,
-- idempotent baseline. Run once on a fresh Supabase project:
--   Supabase SQL editor → paste → Run   (or `supabase db push`)
--
-- Security model
--   * RLS on every table. The browser only ever holds the anon key.
--   * Admin rights come from private.admins (checked by public.is_admin()),
--     so the app never needs the service-role key.
--   * Counters (views, resonance) can only change through SECURITY DEFINER
--     functions, never through direct writes.
-- =========================================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------------
-- PRIVATE SCHEMA + ADMINS
-- -------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.admins (
  email text primary key check (email = lower(email))
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -------------------------------------------------------------------------
-- SHARED TRIGGER HELPERS
-- -------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------------------
-- SITE CONFIG (admin-managed CMS)
-- -------------------------------------------------------------------------
create table if not exists public.site_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_config_updated_at on public.site_config;
create trigger trg_site_config_updated_at
  before update on public.site_config
  for each row execute function public.set_updated_at();

insert into public.site_config (key, value) values
  ('site_settings', '{
     "maintenanceMode": false,
     "maintenanceMessageEn": "We are performing maintenance. Please check back soon.",
     "maintenanceMessageAr": "نجري صيانة على الموقع. عد لاحقاً.",
     "allowSignups": true,
     "showAnnouncement": false,
     "announcementEn": "",
     "announcementAr": ""
   }'::jsonb),
  ('homepage_content', '{}'::jsonb),
  ('visual_presets', '{}'::jsonb)
on conflict (key) do nothing;

-- -------------------------------------------------------------------------
-- RESERVED USERNAMES (collide with routes or are easy to abuse)
-- -------------------------------------------------------------------------
create table if not exists public.reserved_usernames (
  username text primary key
);

insert into public.reserved_usernames (username) values
  ('admin'), ('administrator'), ('api'), ('app'), ('auth'), ('create'),
  ('dashboard'), ('settings'), ('login'), ('logout'), ('signup'), ('signin'),
  ('sign-in'), ('sign-up'), ('register'), ('about'), ('help'), ('support'),
  ('terms'), ('privacy'), ('orbit'), ('orbit-control'), ('www'), ('null'),
  ('undefined'), ('root'), ('static'), ('assets'), ('public'), ('supabase'),
  ('explore'), ('discover'), ('u'), ('og'), ('share'), ('new'), ('edit'),
  ('home'), ('index'), ('sitemap'), ('robots'), ('favicon'), ('icon'),
  ('apple-icon'), ('manifest'), ('blog'), ('pricing'), ('contact'),
  ('team'), ('staff'), ('moderator'), ('official'), ('security'), ('mail')
on conflict do nothing;

-- -------------------------------------------------------------------------
-- PROFILES — one planet per user (id == auth.users.id)
-- -------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  username text not null unique,
  display_name text not null,
  bio text,

  language text not null default 'en' check (language in ('en', 'ar')),
  visibility text not null default 'private' check (visibility in ('public', 'private')),

  planet_color text not null default '#7c8cff'
    check (planet_color ~ '^#[0-9a-fA-F]{6}$'),
  planet_surface_style text not null default 'smooth'
    check (char_length(planet_surface_style) between 1 and 40),
  planet_atmosphere text not null default 'thin'
    check (planet_atmosphere in ('none', 'thin', 'thick', 'stormy')),
  planet_glow integer not null default 3 check (planet_glow between 0 and 5),
  planet_has_ring boolean not null default false,
  universe_mood text not null default 'calm'
    check (universe_mood in ('calm', 'mysterious', 'creative', 'warm', 'futuristic', 'minimal')),
  space_background text not null default 'deep_space'
    check (space_background in ('deep_space', 'nebula', 'aurora', 'void')),

  music_url text check (
    music_url is null or (char_length(music_url) <= 600 and music_url ~* '^https://')
  ),
  music_enabled boolean not null default false,
  music_volume numeric not null default 0.3 check (music_volume between 0 and 1),

  -- [{ "type": "instagram", "url": "https://..." }, ...]
  links jsonb not null default '[]'::jsonb check (
    jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 10
  ),

  is_published boolean not null default false,
  show_in_explore boolean not null default true,
  published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint username_format check (
    username ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$' and username !~ '--'
  ),
  constraint display_name_length check (char_length(display_name) between 1 and 60),
  constraint bio_length check (bio is null or char_length(bio) <= 240)
);

create index if not exists idx_profiles_explore
  on public.profiles (published_at desc)
  where is_published and visibility = 'public' and show_in_explore;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Stamp published_at the first time a planet goes live.
create or replace function public.stamp_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_published_at on public.profiles;
create trigger trg_profiles_published_at
  before insert or update of is_published on public.profiles
  for each row execute function public.stamp_published_at();

create or replace function public.check_username_not_reserved()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.reserved_usernames r where r.username = new.username) then
    raise exception 'This username is reserved.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_username_reserved on public.profiles;
create trigger trg_check_username_reserved
  before insert or update of username on public.profiles
  for each row execute function public.check_username_not_reserved();

-- -------------------------------------------------------------------------
-- STARS — the things that orbit a planet
-- -------------------------------------------------------------------------
create table if not exists public.stars (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  content text,
  icon text not null default '✦',
  category text check (category is null or char_length(category) <= 30),
  link_url text check (
    link_url is null or (char_length(link_url) <= 600 and link_url ~* '^https?://')
  ),

  angle numeric not null default 0,
  distance numeric not null default 150 check (distance > 0),
  size numeric not null default 12 check (size > 0),
  visual_type text not null default 'sparkle' check (char_length(visual_type) <= 30),
  orbit_speed numeric not null default 1 check (orbit_speed >= 0),
  star_color text,

  resonance_count integer not null default 0 check (resonance_count >= 0),
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint star_title_length check (char_length(title) between 1 and 60),
  constraint star_content_length check (content is null or char_length(content) <= 400),
  constraint star_icon_length check (char_length(icon) between 1 and 16)
);

create index if not exists idx_stars_profile_sort on public.stars (profile_id, sort_order);

drop trigger if exists trg_stars_updated_at on public.stars;
create trigger trg_stars_updated_at
  before update on public.stars
  for each row execute function public.set_updated_at();

create or replace function public.enforce_max_stars()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- An upsert of an existing star fires BEFORE INSERT too; only count new rows.
  if exists (select 1 from public.stars s where s.id = new.id) then
    return new;
  end if;
  if (select count(*) from public.stars s where s.profile_id = new.profile_id) >= 20 then
    raise exception 'A universe can contain at most 20 stars' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_max_stars on public.stars;
create trigger trg_enforce_max_stars
  before insert on public.stars
  for each row execute function public.enforce_max_stars();

-- Owners cannot fake their own resonance counts; only resonate_star() may
-- change the column (it flips a transaction-local flag).
create or replace function public.protect_resonance_count()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.resonance_count = 0;
  elsif coalesce(current_setting('orbit.allow_resonance', true), '') <> 'on' then
    new.resonance_count = old.resonance_count;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_resonance on public.stars;
create trigger trg_protect_resonance
  before insert or update on public.stars
  for each row execute function public.protect_resonance_count();

-- -------------------------------------------------------------------------
-- PLANET VIEWS — daily aggregated counter (no visitor data stored)
-- -------------------------------------------------------------------------
create table if not exists public.planet_views_daily (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  views integer not null default 0 check (views >= 0),
  primary key (profile_id, day)
);

-- -------------------------------------------------------------------------
-- NEW USER → placeholder profile (+ server-side sign-up switch)
-- -------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  signups_allowed boolean;
begin
  select coalesce((c.value ->> 'allowSignups')::boolean, true)
    into signups_allowed
    from public.site_config c
   where c.key = 'site_settings';

  if signups_allowed is false
     and not exists (select 1 from private.admins a where a.email = lower(new.email)) then
    raise exception 'Sign-ups are currently disabled' using errcode = 'P0001';
  end if;

  insert into public.profiles (id, username, display_name, language)
  values (
    new.id,
    'user-' || substr(replace(new.id::text, '-', ''), 1, 20),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'New Explorer'),
    case when new.raw_user_meta_data ->> 'language' = 'ar' then 'ar' else 'en' end
  )
  on conflict (id) do nothing;

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
alter table public.site_config enable row level security;
alter table public.reserved_usernames enable row level security;
alter table public.profiles enable row level security;
alter table public.stars enable row level security;
alter table public.planet_views_daily enable row level security;

-- site_config: world-readable, admin-writable
drop policy if exists site_config_select_all on public.site_config;
create policy site_config_select_all on public.site_config
  for select to anon, authenticated using (true);

drop policy if exists site_config_admin_insert on public.site_config;
create policy site_config_admin_insert on public.site_config
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists site_config_admin_update on public.site_config;
create policy site_config_admin_update on public.site_config
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- reserved_usernames: readable for client-side availability checks
drop policy if exists reserved_usernames_select_all on public.reserved_usernames;
create policy reserved_usernames_select_all on public.reserved_usernames
  for select to anon, authenticated using (true);

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to anon, authenticated
  using (
    (is_published and visibility = 'public')
    or id = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- stars
drop policy if exists stars_select on public.stars;
create policy stars_select on public.stars
  for select to anon, authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.profiles p
      where p.id = stars.profile_id and p.is_published and p.visibility = 'public'
    )
  );

drop policy if exists stars_insert_own on public.stars;
create policy stars_insert_own on public.stars
  for insert to authenticated with check (profile_id = (select auth.uid()));

drop policy if exists stars_update_own on public.stars;
create policy stars_update_own on public.stars
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

drop policy if exists stars_delete on public.stars;
create policy stars_delete on public.stars
  for delete to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

-- planet views: owners see their own numbers, admins see all; no direct writes
drop policy if exists planet_views_select on public.planet_views_daily;
create policy planet_views_select on public.planet_views_daily
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

-- =========================================================================
-- VIEWS
-- =========================================================================
create or replace view public.explore_planets
with (security_invoker = true)
as
select
  p.username,
  p.display_name,
  p.bio,
  p.planet_color,
  p.planet_surface_style,
  p.planet_atmosphere,
  p.planet_glow,
  p.planet_has_ring,
  p.universe_mood,
  p.space_background,
  p.published_at,
  (select count(*) from public.stars s where s.profile_id = p.id)::int as star_count
from public.profiles p
where p.is_published and p.visibility = 'public' and p.show_in_explore;

-- =========================================================================
-- RPC FUNCTIONS
-- =========================================================================

-- Public counters for the landing page social proof.
create or replace function public.get_public_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'planets', (select count(*) from public.profiles p where p.is_published and p.visibility = 'public'),
    'stars', (select count(*) from public.stars s
               join public.profiles p on p.id = s.profile_id
              where p.is_published and p.visibility = 'public')
  );
$$;

-- Count one visit to a live planet (owner's own visits are ignored).
create or replace function public.record_planet_view(p_username text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  select p.id into target
    from public.profiles p
   where p.username = lower(p_username) and p.is_published and p.visibility = 'public';

  if target is null or target = auth.uid() then
    return;
  end if;

  insert into public.planet_views_daily (profile_id, day, views)
  values (target, (now() at time zone 'utc')::date, 1)
  on conflict (profile_id, day)
  do update set views = public.planet_views_daily.views + 1;
end;
$$;

-- "This resonates with me" on a star. Returns the new count.
create or replace function public.resonate_star(p_star_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_count integer;
begin
  perform set_config('orbit.allow_resonance', 'on', true);

  update public.stars s
     set resonance_count = s.resonance_count + 1
    from public.profiles p
   where s.id = p_star_id
     and p.id = s.profile_id
     and p.is_published
     and p.visibility = 'public'
     and s.profile_id is distinct from auth.uid()
  returning s.resonance_count into new_count;

  perform set_config('orbit.allow_resonance', 'off', true);
  return coalesce(new_count, 0);
end;
$$;

-- Username check that sees every claimed name (RLS would hide drafts).
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    lower(p_username) ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
    and lower(p_username) !~ '--'
    and not exists (select 1 from public.reserved_usernames r where r.username = lower(p_username))
    and not exists (
      select 1 from public.profiles p
      where p.username = lower(p_username)
        and p.id is distinct from auth.uid()
    );
$$;

-- Self-service account deletion (cascades to profile, stars, views).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- Admin: everything the control panel needs in one round trip.
create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'utc')::date;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'stats', jsonb_build_object(
      'totalUsers',        (select count(*) from auth.users),
      'totalProfiles',     (select count(*) from public.profiles),
      'publishedProfiles', (select count(*) from public.profiles where is_published),
      'totalStars',        (select count(*) from public.stars),
      'totalViews',        (select coalesce(sum(views), 0) from public.planet_views_daily),
      'viewsToday',        (select coalesce(sum(views), 0) from public.planet_views_daily where day = today),
      'signups7d',         (select count(*) from auth.users where created_at > now() - interval '7 days'),
      'totalResonance',    (select coalesce(sum(resonance_count), 0) from public.stars)
    ),
    'users', coalesce((
      select jsonb_agg(row_to_json(u) order by u."createdAt" desc)
      from (
        select
          au.id,
          au.email,
          coalesce(p.username, '') as username,
          coalesce(p.display_name, '') as "displayName",
          coalesce(p.is_published, false) as "isPublished",
          coalesce(p.visibility, 'private') as visibility,
          (select count(*) from public.stars s where s.profile_id = au.id)::int as "starCount",
          au.created_at as "createdAt",
          au.last_sign_in_at as "lastSignInAt"
        from auth.users au
        left join public.profiles p on p.id = au.id
        order by au.created_at desc
        limit 1000
      ) u
    ), '[]'::jsonb),
    'planets', coalesce((
      select jsonb_agg(row_to_json(x) order by x."updatedAt" desc)
      from (
        select
          p.id,
          p.username,
          p.display_name as "displayName",
          p.is_published as "isPublished",
          p.visibility,
          p.planet_color as "planetColor",
          (select count(*) from public.stars s where s.profile_id = p.id)::int as "starCount",
          p.music_enabled as "musicEnabled",
          (select coalesce(sum(v.views), 0) from public.planet_views_daily v where v.profile_id = p.id)::int as views,
          p.created_at as "createdAt",
          p.updated_at as "updatedAt"
        from public.profiles p
        where p.username not like 'user-%'
        limit 1000
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

-- Admin moderation: wipe a planet's stars and take it offline.
create or replace function public.admin_reset_planet(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  delete from public.stars where profile_id = p_profile_id;
  update public.profiles set is_published = false where id = p_profile_id;
end;
$$;

-- Admin moderation: remove a user entirely.
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot delete your own admin account here' using errcode = 'P0001';
  end if;
  delete from auth.users where id = p_user_id;
end;
$$;

-- -------------------------------------------------------------------------
-- GRANTS (explicit, so the Data API works regardless of project defaults)
-- -------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.site_config, public.reserved_usernames, public.profiles,
               public.stars, public.explore_planets
  to anon, authenticated;
grant insert, update on public.site_config to authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.stars to authenticated;
grant select on public.planet_views_daily to authenticated;

revoke all on function public.get_public_stats() from public;
revoke all on function public.is_username_available(text) from public;
revoke all on function public.record_planet_view(text) from public;
revoke all on function public.resonate_star(uuid) from public;
revoke all on function public.delete_my_account() from public;
revoke all on function public.admin_overview() from public;
revoke all on function public.admin_reset_planet(uuid) from public;
revoke all on function public.admin_delete_user(uuid) from public;

grant execute on function public.get_public_stats() to anon, authenticated;
grant execute on function public.is_username_available(text) to anon, authenticated;
grant execute on function public.record_planet_view(text) to anon, authenticated;
grant execute on function public.resonate_star(uuid) to anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_reset_planet(uuid) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- Supabase grants EXECUTE to anon explicitly on new functions, so revoking
-- from PUBLIC is not enough for the signed-in-only ones.
revoke execute on function public.admin_overview() from anon;
revoke execute on function public.admin_reset_planet(uuid) from anon;
revoke execute on function public.admin_delete_user(uuid) from anon;
revoke execute on function public.delete_my_account() from anon;

-- Trigger-only functions must not be callable through the API.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.enforce_max_stars() from public, anon, authenticated;
revoke all on function public.stamp_published_at() from public, anon, authenticated;
revoke all on function public.check_username_not_reserved() from public, anon, authenticated;
revoke all on function public.protect_resonance_count() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- Admins are added by hand, never from the app:
--   insert into private.admins (email) values ('you@example.com');

-- =========================================================================
-- STORAGE — planet music uploads (users write only inside their own folder)
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'planet-music', 'planet-music', true, 8388608,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/x-m4a', 'audio/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists planet_music_insert_own on storage.objects;
create policy planet_music_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'planet-music' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists planet_music_update_own on storage.objects;
create policy planet_music_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'planet-music' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists planet_music_delete_own on storage.objects;
create policy planet_music_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'planet-music' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Public bucket: files are served by URL; no listing policy is needed.

notify pgrst, 'reload schema';
