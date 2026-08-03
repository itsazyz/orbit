-- Allow many personality planet surface styles (drop rigid CHECK)
alter table public.profiles drop constraint if exists profiles_planet_surface_style_check;

notify pgrst, 'reload schema';
