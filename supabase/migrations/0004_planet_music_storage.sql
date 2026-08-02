-- Storage bucket for user-uploaded planet background music
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'planet-music',
  'planet-music',
  true,
  8388608,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/x-m4a']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "planet_music_insert_own" on storage.objects;
drop policy if exists "planet_music_update_own" on storage.objects;
drop policy if exists "planet_music_delete_own" on storage.objects;
drop policy if exists "planet_music_public_read" on storage.objects;

create policy "planet_music_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'planet-music'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "planet_music_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'planet-music'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "planet_music_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'planet-music'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "planet_music_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'planet-music');
