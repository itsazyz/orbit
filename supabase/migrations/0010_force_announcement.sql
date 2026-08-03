-- Manually set a visible announcement (safe to re-run).
-- Use this in Supabase SQL Editor if admin save does not persist.

insert into public.site_config (key, value, updated_at)
values (
  'site_settings',
  '{
    "maintenanceMode": false,
    "maintenanceMessageEn": "We are performing maintenance. Please check back soon.",
    "maintenanceMessageAr": "نجري صيانة على الموقع. عد لاحقاً.",
    "allowSignups": true,
    "showAnnouncement": true,
    "announcementEn": "Buying a domain — stay tuned",
    "announcementAr": "بشتري دومين انتظرو"
  }'::jsonb,
  now()
)
on conflict (key) do update
set
  value = excluded.value,
  updated_at = now();

select key, value from public.site_config where key = 'site_settings';
