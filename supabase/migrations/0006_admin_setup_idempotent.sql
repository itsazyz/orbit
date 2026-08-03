-- =========================================================================
-- ORBIT — Complete admin setup (safe to re-run)
-- Use this if 0003 failed with "policy already exists"
-- =========================================================================

-- Policy (idempotent)
drop policy if exists "site_config_select_all" on public.site_config;
create policy "site_config_select_all"
  on public.site_config
  for select
  to anon, authenticated
  using (true);

-- Admin user count function
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

-- Admin stats view
create or replace view public.admin_stats as
select
  (select count(*) from auth.users) as total_users,
  (select count(*) from public.profiles) as total_profiles,
  (select count(*) from public.profiles where is_published = true) as published_profiles,
  (select count(*) from public.stars) as total_stars;

notify pgrst, 'reload schema';
