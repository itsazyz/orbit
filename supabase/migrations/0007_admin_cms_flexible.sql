-- Allow admin-defined star visual types (drop rigid CHECK)
alter table public.stars drop constraint if exists stars_visual_type_check;

-- Ensure site_config exists for homepage + settings keys (table from 0003)
insert into public.site_config (key, value)
values ('homepage_content', '{}'::jsonb)
on conflict (key) do nothing;

insert into public.site_config (key, value)
values ('site_settings', '{"maintenanceMode":false,"allowSignups":true,"showAnnouncement":false}'::jsonb)
on conflict (key) do nothing;

notify pgrst, 'reload schema';
