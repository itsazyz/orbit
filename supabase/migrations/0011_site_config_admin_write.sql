-- Allow the signed-in admin account to write site_config when
-- SUPABASE_SERVICE_ROLE_KEY is misconfigured (anon/publishable).
-- Still prefer a real service_role key in Vercel.

drop policy if exists "site_config_authenticated_insert" on public.site_config;
create policy "site_config_authenticated_insert"
  on public.site_config
  for insert
  to authenticated
  with check (true);

drop policy if exists "site_config_authenticated_update" on public.site_config;
create policy "site_config_authenticated_update"
  on public.site_config
  for update
  to authenticated
  using (true)
  with check (true);
