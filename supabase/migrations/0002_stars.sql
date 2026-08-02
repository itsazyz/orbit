-- =========================================================================
-- ORBIT — Stars table for the simplified creation flow
-- Each star represents a personal detail orbiting the user's planet.
-- =========================================================================

create table if not exists public.stars (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  content text,
  icon text not null default '✦',

  -- Polar coordinates for rendering on the user planet page
  angle numeric not null default 0,
  distance numeric not null default 150
    check (distance > 0),
  size numeric not null default 12
    check (size > 0),

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint star_title_length check (char_length(title) between 1 and 60),
  constraint star_content_length check (content is null or char_length(content) <= 280)
);

comment on table public.stars is 'Personal stars orbiting a profile planet (simplified creation flow).';

create index if not exists idx_stars_profile_id
  on public.stars(profile_id);

create index if not exists idx_stars_profile_sort
  on public.stars(profile_id, sort_order);

-- Max 20 stars per profile
create or replace function public.enforce_max_stars()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  star_count integer;
begin
  select count(*) into star_count
  from public.stars
  where profile_id = new.profile_id;

  if tg_op = 'INSERT' and star_count >= 20 then
    raise exception 'A universe can contain at most 20 stars';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_max_stars on public.stars;
create trigger trg_enforce_max_stars
  before insert on public.stars
  for each row execute function public.enforce_max_stars();

drop trigger if exists trg_stars_updated_at on public.stars;
create trigger trg_stars_updated_at
  before update on public.stars
  for each row execute function public.set_updated_at();

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================

alter table public.stars enable row level security;

-- Owner can read all of their own stars regardless of publish state.
create policy "stars_select_own"
  on public.stars
  for select
  to authenticated
  using (profile_id = auth.uid());

-- Public visitors can read stars belonging to a published, public profile.
create policy "stars_select_public_published"
  on public.stars
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = stars.profile_id
        and p.is_published = true
        and p.visibility = 'public'
    )
  );

-- Owner can insert stars only into their own universe.
create policy "stars_insert_own"
  on public.stars
  for insert
  to authenticated
  with check (profile_id = auth.uid());

-- Owner can update only their own stars.
create policy "stars_update_own"
  on public.stars
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Owner can delete only their own stars.
create policy "stars_delete_own"
  on public.stars
  for delete
  to authenticated
  using (profile_id = auth.uid());
