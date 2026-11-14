-- =========================================================================
-- ORBIT — v2.1 features
--   * rich star media (image / gallery / YouTube / Spotify)
--   * guestbook (owner-moderated)
--   * moderation: reports, bans, blocked-word filter
--   * detailed analytics (sources, countries, devices, star opens, link clicks)
-- Run after 0001_orbit_baseline.sql. Idempotent.
-- =========================================================================

-- -------------------------------------------------------------------------
-- COLUMNS
-- -------------------------------------------------------------------------
alter table public.stars
  add column if not exists media jsonb
  check (media is null or (jsonb_typeof(media) = 'object' and pg_column_size(media) < 6000));

alter table public.profiles
  add column if not exists guestbook_enabled boolean not null default true,
  add column if not exists is_banned boolean not null default false;

-- Only admins may change is_banned.
create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.is_banned = false;
  elsif new.is_banned is distinct from old.is_banned and not public.is_admin() then
    new.is_banned = old.is_banned;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_admin_fields on public.profiles;
create trigger trg_profiles_admin_fields
  before insert or update on public.profiles
  for each row execute function public.protect_profile_admin_fields();

-- -------------------------------------------------------------------------
-- BLOCKED WORDS (admin-editable list in site_config.moderation)
-- -------------------------------------------------------------------------
insert into public.site_config (key, value)
values ('moderation', '{"blockedWords": []}'::jsonb)
on conflict (key) do nothing;

-- Returns the first blocked word found in the text, or null.
create or replace function public.find_blocked_word(p_text text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  w text;
  haystack text := lower(coalesce(p_text, ''));
begin
  if haystack = '' then
    return null;
  end if;
  for w in
    select lower(trim(x))
      from public.site_config c,
           jsonb_array_elements_text(coalesce(c.value -> 'blockedWords', '[]'::jsonb)) as x
     where c.key = 'moderation' and length(trim(x)) > 1
  loop
    if haystack ~ ('(^|[^[:alnum:]])' || regexp_replace(w, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g') || '([^[:alnum:]]|$)') then
      return w;
    end if;
  end loop;
  return null;
end;
$$;

create or replace function public.reject_blocked_star()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.find_blocked_word(new.title || ' ' || coalesce(new.content, '')) is not null then
    raise exception 'CONTENT_BLOCKED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stars_blocked_words on public.stars;
create trigger trg_stars_blocked_words
  before insert or update of title, content on public.stars
  for each row execute function public.reject_blocked_star();

create or replace function public.reject_blocked_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.find_blocked_word(new.username || ' ' || new.display_name || ' ' || coalesce(new.bio, '')) is not null then
    raise exception 'CONTENT_BLOCKED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_blocked_words on public.profiles;
create trigger trg_profiles_blocked_words
  before update of username, display_name, bio on public.profiles
  for each row execute function public.reject_blocked_profile();

-- -------------------------------------------------------------------------
-- BANNED PLANETS DISAPPEAR FROM PUBLIC READS
-- -------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to anon, authenticated
  using (
    (is_published and visibility = 'public' and not is_banned)
    or id = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists stars_select on public.stars;
create policy stars_select on public.stars
  for select to anon, authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.profiles p
      where p.id = stars.profile_id and p.is_published and p.visibility = 'public' and not p.is_banned
    )
  );

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
where p.is_published and p.visibility = 'public' and p.show_in_explore and not p.is_banned;

create or replace function public.get_public_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'planets', (select count(*) from public.profiles p
                 where p.is_published and p.visibility = 'public' and not p.is_banned),
    'stars', (select count(*) from public.stars s
               join public.profiles p on p.id = s.profile_id
              where p.is_published and p.visibility = 'public' and not p.is_banned)
  );
$$;

-- Helper: id of a live (published, public, not banned) planet.
create or replace function public.live_planet_id(p_username text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.profiles p
   where p.username = lower(p_username)
     and p.is_published and p.visibility = 'public' and not p.is_banned;
$$;

-- Anonymous, non-reversible fingerprint for rate limiting (rotates daily).
create or replace function public.sender_fingerprint()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(
    extensions.digest(
      coalesce(split_part(coalesce(current_setting('request.headers', true), '{}')::json ->> 'x-forwarded-for', ',', 1), '')
        || '|' || coalesce(auth.uid()::text, '')
        || '|' || to_char(now() at time zone 'utc', 'YYYY-MM-DD'),
      'sha256'
    ),
    'hex'
  );
$$;

-- -------------------------------------------------------------------------
-- GUESTBOOK
-- -------------------------------------------------------------------------
create table if not exists public.planet_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 280),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  author_id uuid references auth.users(id) on delete set null,
  sender_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_planet_messages_profile
  on public.planet_messages (profile_id, status, created_at desc);

alter table public.planet_messages enable row level security;

drop policy if exists planet_messages_select on public.planet_messages;
create policy planet_messages_select on public.planet_messages
  for select to anon, authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.is_admin())
    or (
      status = 'approved'
      and exists (
        select 1 from public.profiles p
        where p.id = planet_messages.profile_id
          and p.is_published and p.visibility = 'public' and not p.is_banned and p.guestbook_enabled
      )
    )
  );

drop policy if exists planet_messages_update on public.planet_messages;
create policy planet_messages_update on public.planet_messages
  for update to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()))
  with check (profile_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists planet_messages_delete on public.planet_messages;
create policy planet_messages_delete on public.planet_messages
  for delete to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

-- Owners may only change status; everything else is immutable.
create or replace function public.guard_message_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.profile_id = old.profile_id;
  new.author_name = old.author_name;
  new.body = old.body;
  new.author_id = old.author_id;
  new.sender_hash = old.sender_hash;
  new.created_at = old.created_at;
  return new;
end;
$$;

drop trigger if exists trg_guard_message_update on public.planet_messages;
create trigger trg_guard_message_update
  before update on public.planet_messages
  for each row execute function public.guard_message_update();

create or replace function public.submit_planet_message(p_username text, p_name text, p_body text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
  fp text := public.sender_fingerprint();
  clean_name text := left(trim(coalesce(p_name, '')), 40);
  clean_body text := left(trim(coalesce(p_body, '')), 280);
  initial_status text := 'pending';
begin
  if clean_name = '' or clean_body = '' then
    raise exception 'EMPTY_MESSAGE' using errcode = 'P0001';
  end if;

  select p.id into target
    from public.profiles p
   where p.username = lower(p_username)
     and p.is_published and p.visibility = 'public' and not p.is_banned and p.guestbook_enabled;
  if target is null then
    raise exception 'GUESTBOOK_CLOSED' using errcode = 'P0001';
  end if;

  if (select count(*) from public.planet_messages m
       where m.sender_hash = fp and m.profile_id = target
         and m.created_at > now() - interval '1 day') >= 3
     or (select count(*) from public.planet_messages m
          where m.sender_hash = fp and m.created_at > now() - interval '1 day') >= 20 then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;

  if (select count(*) from public.planet_messages m
       where m.profile_id = target and m.status = 'pending') >= 200 then
    raise exception 'INBOX_FULL' using errcode = 'P0001';
  end if;

  if public.find_blocked_word(clean_name || ' ' || clean_body) is not null then
    initial_status = 'hidden';
  end if;

  insert into public.planet_messages (profile_id, author_name, body, status, author_id, sender_hash)
  values (target, clean_name, clean_body, initial_status, auth.uid(), fp);

  -- Never reveal that a message was auto-hidden.
  return 'pending';
end;
$$;

-- -------------------------------------------------------------------------
-- REPORTS
-- -------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid references public.planet_messages(id) on delete cascade,
  reason text not null check (reason in ('spam', 'offensive', 'impersonation', 'other')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  sender_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_open on public.reports (status, created_at desc);

alter table public.reports enable row level security;

drop policy if exists reports_admin_select on public.reports;
create policy reports_admin_select on public.reports
  for select to authenticated using ((select public.is_admin()));

drop policy if exists reports_admin_update on public.reports;
create policy reports_admin_update on public.reports
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists reports_admin_delete on public.reports;
create policy reports_admin_delete on public.reports
  for delete to authenticated using ((select public.is_admin()));

create or replace function public.submit_report(
  p_username text,
  p_reason text,
  p_details text default null,
  p_message_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
  fp text := public.sender_fingerprint();
begin
  if p_reason not in ('spam', 'offensive', 'impersonation', 'other') then
    raise exception 'BAD_REASON' using errcode = 'P0001';
  end if;

  select p.id into target from public.profiles p where p.username = lower(p_username);
  if target is null then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if p_message_id is not null
     and not exists (select 1 from public.planet_messages m where m.id = p_message_id and m.profile_id = target) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if (select count(*) from public.reports r
       where r.sender_hash = fp and r.created_at > now() - interval '1 day') >= 10 then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;

  insert into public.reports (profile_id, message_id, reason, details, sender_hash)
  values (target, p_message_id, p_reason, nullif(left(trim(coalesce(p_details, '')), 500), ''), fp);
end;
$$;

-- Admin view of open reports with context.
create or replace function public.admin_reports()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(x) order by x."createdAt" desc)
    from (
      select
        r.id,
        r.reason,
        r.details,
        r.status,
        r.created_at as "createdAt",
        r.profile_id as "profileId",
        p.username,
        p.display_name as "displayName",
        p.is_banned as "isBanned",
        r.message_id as "messageId",
        m.author_name as "messageAuthor",
        m.body as "messageBody",
        m.status as "messageStatus"
      from public.reports r
      join public.profiles p on p.id = r.profile_id
      left join public.planet_messages m on m.id = r.message_id
      where r.status = 'open'
      order by r.created_at desc
      limit 300
    ) x
  ), '[]'::jsonb);
end;
$$;

-- -------------------------------------------------------------------------
-- ANALYTICS — daily aggregates only, no visitor-level data
-- -------------------------------------------------------------------------
create table if not exists public.planet_stats_daily (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  metric text not null check (metric in ('source', 'country', 'device', 'star_open', 'link_click', 'share')),
  dim text not null check (char_length(dim) <= 600),
  count integer not null default 0 check (count >= 0),
  primary key (profile_id, day, metric, dim)
);

alter table public.planet_stats_daily enable row level security;

drop policy if exists planet_stats_select on public.planet_stats_daily;
create policy planet_stats_select on public.planet_stats_daily
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

create or replace function public.bump_stat(p_profile uuid, p_metric text, p_dim text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.planet_stats_daily (profile_id, day, metric, dim, count)
  values (p_profile, (now() at time zone 'utc')::date, p_metric, left(p_dim, 600), 1)
  on conflict (profile_id, day, metric, dim)
  do update set count = public.planet_stats_daily.count + 1;
$$;

create or replace function public.track_planet_event(
  p_username text,
  p_event text,
  p_dim text default null,
  p_source text default null,
  p_country text default null,
  p_device text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := public.live_planet_id(p_username);
  src text := lower(coalesce(p_source, 'direct'));
  dev text := lower(coalesce(p_device, 'desktop'));
  ctry text := upper(left(coalesce(p_country, ''), 2));
begin
  if target is null or target = auth.uid() then
    return;
  end if;

  if p_event = 'view' then
    if src not in ('instagram', 'whatsapp', 'x', 'tiktok', 'snapchat', 'telegram', 'linkedin',
                   'facebook', 'google', 'youtube', 'qr', 'story', 'explore', 'orbit', 'direct', 'other') then
      src = 'other';
    end if;
    if dev not in ('mobile', 'tablet', 'desktop') then
      dev = 'desktop';
    end if;
    if ctry !~ '^[A-Z]{2}$' then
      ctry = '??';
    end if;

    insert into public.planet_views_daily (profile_id, day, views)
    values (target, (now() at time zone 'utc')::date, 1)
    on conflict (profile_id, day) do update set views = public.planet_views_daily.views + 1;

    perform public.bump_stat(target, 'source', src);
    perform public.bump_stat(target, 'device', dev);
    perform public.bump_stat(target, 'country', ctry);

  elsif p_event = 'star_open' then
    if exists (select 1 from public.stars s where s.id::text = p_dim and s.profile_id = target) then
      perform public.bump_stat(target, 'star_open', p_dim);
    end if;

  elsif p_event = 'link_click' then
    if exists (
      select 1 from public.profiles p, jsonb_array_elements(p.links) l
       where p.id = target and l ->> 'url' = p_dim
    ) then
      perform public.bump_stat(target, 'link_click', p_dim);
    end if;

  elsif p_event = 'share' then
    if p_dim in ('copy', 'native', 'whatsapp', 'x', 'story', 'qr') then
      perform public.bump_stat(target, 'share', p_dim);
    end if;
  end if;
end;
$$;

-- -------------------------------------------------------------------------
-- ADMIN OVERVIEW — add moderation counters and ban state
-- -------------------------------------------------------------------------
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
      'totalResonance',    (select coalesce(sum(resonance_count), 0) from public.stars),
      'openReports',       (select count(*) from public.reports where status = 'open'),
      'bannedUsers',       (select count(*) from public.profiles where is_banned),
      'totalMessages',     (select count(*) from public.planet_messages)
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
          coalesce(p.is_banned, false) as "isBanned",
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
          p.is_banned as "isBanned",
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

-- -------------------------------------------------------------------------
-- STORAGE — star images (owners write inside their own folder)
-- -------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('star-media', 'star-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists star_media_insert_own on storage.objects;
create policy star_media_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'star-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists star_media_update_own on storage.objects;
create policy star_media_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'star-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists star_media_delete_own on storage.objects;
create policy star_media_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'star-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- -------------------------------------------------------------------------
-- GRANTS
-- -------------------------------------------------------------------------
grant select on public.planet_messages to anon, authenticated;
grant update, delete on public.planet_messages to authenticated;
grant select, update, delete on public.reports to authenticated;
grant select on public.planet_stats_daily to authenticated;
grant select on public.explore_planets to anon, authenticated;

revoke all on function public.submit_planet_message(text, text, text) from public;
revoke all on function public.submit_report(text, text, text, uuid) from public;
revoke all on function public.track_planet_event(text, text, text, text, text, text) from public;
revoke all on function public.admin_reports() from public, anon;
revoke all on function public.admin_overview() from public, anon;

grant execute on function public.submit_planet_message(text, text, text) to anon, authenticated;
grant execute on function public.submit_report(text, text, text, uuid) to anon, authenticated;
grant execute on function public.track_planet_event(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.admin_reports() to authenticated;
grant execute on function public.admin_overview() to authenticated;

-- Internal helpers are never callable through the API.
revoke all on function public.find_blocked_word(text) from public, anon, authenticated;
revoke all on function public.live_planet_id(text) from public, anon, authenticated;
revoke all on function public.sender_fingerprint() from public, anon, authenticated;
revoke all on function public.bump_stat(uuid, text, text) from public, anon, authenticated;
revoke all on function public.protect_profile_admin_fields() from public, anon, authenticated;
revoke all on function public.reject_blocked_star() from public, anon, authenticated;
revoke all on function public.reject_blocked_profile() from public, anon, authenticated;
revoke all on function public.guard_message_update() from public, anon, authenticated;

notify pgrst, 'reload schema';
