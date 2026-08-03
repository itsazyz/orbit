-- Idempotent: ensure site_config exists and has CMS keys (safe to re-run)

create table if not exists public.site_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_config enable row level security;

drop policy if exists "site_config_select_all" on public.site_config;
create policy "site_config_select_all"
  on public.site_config
  for select
  to anon, authenticated
  using (true);

insert into public.site_config (key, value)
values ('homepage_content', '{}'::jsonb)
on conflict (key) do nothing;

insert into public.site_config (key, value)
values (
  'site_settings',
  '{
    "maintenanceMode": false,
    "maintenanceMessageEn": "We are performing maintenance. Please check back soon.",
    "maintenanceMessageAr": "نجري صيانة على الموقع. عد لاحقاً.",
    "allowSignups": true,
    "showAnnouncement": false,
    "announcementEn": "",
    "announcementAr": ""
  }'::jsonb
)
on conflict (key) do nothing;

insert into public.site_config (key, value)
values ('visual_presets', '{}'::jsonb)
on conflict (key) do nothing;

alter table public.stars drop constraint if exists stars_visual_type_check;

notify pgrst, 'reload schema';
