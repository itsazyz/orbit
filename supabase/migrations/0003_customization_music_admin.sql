-- =========================================================================
-- ORBIT — Customization, music, and admin config
-- =========================================================================

-- Music & extra profile settings
alter table public.profiles
  add column if not exists music_url text,
  add column if not exists music_enabled boolean not null default false,
  add column if not exists music_volume numeric not null default 0.3
    check (music_volume >= 0 and music_volume <= 1);

comment on column public.profiles.music_url is 'Optional background music URL (mp3/ogg) for the public planet page.';
comment on column public.profiles.music_enabled is 'When true, visitors hear background music at music_volume.';
comment on column public.profiles.music_volume is '0–1 volume for background music (default 0.3 = 30%).';

-- Star visual customization
alter table public.stars
  add column if not exists visual_type text not null default 'sparkle'
    check (visual_type in ('sparkle', 'diamond', 'glow', 'comet', 'ring', 'classic')),
  add column if not exists orbit_speed numeric not null default 1
    check (orbit_speed >= 0),
  add column if not exists star_color text;

-- Site-wide visual presets (editable from admin panel)
create table if not exists public.site_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.site_config is 'Key-value store for admin-managed site settings (visual presets, etc.).';

drop trigger if exists trg_site_config_updated_at on public.site_config;
create trigger trg_site_config_updated_at
  before update on public.site_config
  for each row execute function public.set_updated_at();

alter table public.site_config enable row level security;

-- Anyone can read site config (public presets for create flow)
create policy "site_config_select_all"
  on public.site_config
  for select
  to anon, authenticated
  using (true);

-- Inserts/updates/deletes only via service role (admin server actions)

-- Admin stats view (service role only — not exposed via RLS to anon)
create or replace function public.get_registered_user_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint from auth.users;
$$;

revoke all on function public.get_registered_user_count() from public;
grant execute on function public.get_registered_user_count() to service_role;

create or replace view public.admin_stats as
select
  (select count(*) from auth.users) as total_users,
  (select count(*) from public.profiles) as total_profiles,
  (select count(*) from public.profiles where is_published = true) as published_profiles,
  (select count(*) from public.stars) as total_stars;
