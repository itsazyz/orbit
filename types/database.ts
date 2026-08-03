// Hand-maintained types mirroring supabase/migrations/0001_init.sql.
// If you have the Supabase CLI, prefer generating these with:
//   supabase gen types typescript --project-id <id> > types/database.ts
// and then re-exporting the domain aliases below on top of it.

export type Language = 'en' | 'ar';
export type Visibility = 'public' | 'private';
export type UniverseMood =
  | 'calm'
  | 'mysterious'
  | 'creative'
  | 'warm'
  | 'futuristic'
  | 'minimal';
/** Planet surface look — see PLANET_SURFACE_CATALOG for the full set */
export type PlanetSurfaceStyle = string;
export type PlanetAtmosphere = 'none' | 'thin' | 'thick' | 'stormy';
export type SpaceBackground = 'deep_space' | 'nebula' | 'aurora' | 'void';

export type ObjectCategory =
  | 'interest'
  | 'idea'
  | 'value'
  | 'skill'
  | 'goal'
  | 'passion'
  | 'current_exploration';

export type VisualType = 'star' | 'moon' | 'planet' | 'comet' | 'satellite';

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  language: Language;
  visibility: Visibility;
  planet_color: string;
  planet_surface_style: PlanetSurfaceStyle;
  planet_atmosphere: PlanetAtmosphere;
  planet_glow: number;
  planet_has_ring: boolean;
  universe_mood: UniverseMood;
  space_background: SpaceBackground;
  is_published: boolean;
  music_url: string | null;
  music_enabled: boolean;
  music_volume: number;
  created_at: string;
  updated_at: string;
}

export interface UniverseObjectRow {
  id: string;
  profile_id: string;
  name: string;
  category: ObjectCategory;
  description: string | null;
  importance: number; // 1-5
  visual_type: VisualType;
  position_x: number;
  position_y: number;
  object_size: number;
  object_color: string | null;
  orbit_radius: number;
  orbit_speed: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StarRow {
  id: string;
  profile_id: string;
  title: string;
  content: string | null;
  icon: string;
  angle: number;
  distance: number;
  size: number;
  visual_type: string;
  orbit_speed: number;
  star_color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PublicUniverseRow {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  language: Language;
  planet_color: string;
  planet_surface_style: PlanetSurfaceStyle;
  planet_atmosphere: PlanetAtmosphere;
  planet_glow: number;
  planet_has_ring: boolean;
  universe_mood: UniverseMood;
  space_background: SpaceBackground;
  objects: Array<
    Pick<
      UniverseObjectRow,
      | 'id'
      | 'name'
      | 'category'
      | 'description'
      | 'importance'
      | 'visual_type'
      | 'position_x'
      | 'position_y'
      | 'object_size'
      | 'object_color'
      | 'orbit_radius'
      | 'orbit_speed'
      | 'sort_order'
    >
  >;
}

// Minimal Database interface shape consumed by @supabase/supabase-js's
// generic client typing. Extend as new tables/views are added.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, 'id' | 'username' | 'display_name'>;
        Update: Partial<ProfileRow>;
      };
      universe_objects: {
        Row: UniverseObjectRow;
        Insert: Partial<UniverseObjectRow> &
          Pick<UniverseObjectRow, 'profile_id' | 'name' | 'category'>;
        Update: Partial<UniverseObjectRow>;
      };
      reserved_usernames: {
        Row: { username: string };
        Insert: { username: string };
        Update: { username: string };
      };
      stars: {
        Row: StarRow;
        Insert: Partial<StarRow> &
          Pick<StarRow, 'profile_id' | 'title'>;
        Update: Partial<StarRow>;
      };
      site_config: {
        Row: { key: string; value: Record<string, unknown>; updated_at: string };
        Insert: { key: string; value: Record<string, unknown> };
        Update: Partial<{ key: string; value: Record<string, unknown> }>;
      };
    };
    Views: {
      public_universes: {
        Row: PublicUniverseRow;
      };
    };
  };
}
