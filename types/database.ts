// Types mirroring supabase/migrations/0001_orbit_baseline.sql.
// Regenerate with `supabase gen types typescript` if the schema changes,
// then keep the domain aliases below on top of it.

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

export type LinkType =
  | 'instagram'
  | 'x'
  | 'tiktok'
  | 'snapchat'
  | 'youtube'
  | 'linkedin'
  | 'github'
  | 'behance'
  | 'dribbble'
  | 'whatsapp'
  | 'telegram'
  | 'email'
  | 'website';

export interface ProfileLink {
  type: LinkType;
  url: string;
}

export type StarMedia =
  | { type: 'image'; url: string; alt?: string }
  | { type: 'gallery'; urls: string[] }
  | { type: 'youtube'; id: string }
  | { type: 'spotify'; kind: 'track' | 'album' | 'playlist' | 'episode' | 'show'; id: string };

export type MessageStatus = 'pending' | 'approved' | 'hidden';

export interface PlanetMessageRow {
  id: string;
  profile_id: string;
  author_name: string;
  body: string;
  status: MessageStatus;
  author_id: string | null;
  sender_hash: string | null;
  created_at: string;
}

export interface PlanetStatRow {
  profile_id: string;
  day: string;
  metric: 'source' | 'country' | 'device' | 'star_open' | 'link_click' | 'share';
  dim: string;
  count: number;
}

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
  music_url: string | null;
  music_enabled: boolean;
  music_volume: number;
  links: ProfileLink[];
  guestbook_enabled: boolean;
  is_banned: boolean;
  is_published: boolean;
  show_in_explore: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StarRow {
  id: string;
  profile_id: string;
  title: string;
  content: string | null;
  icon: string;
  category: string | null;
  link_url: string | null;
  angle: number;
  distance: number;
  size: number;
  visual_type: string;
  orbit_speed: number;
  star_color: string | null;
  media: StarMedia | null;
  resonance_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanetViewsRow {
  profile_id: string;
  day: string;
  views: number;
}

export interface ExplorePlanetRow {
  username: string;
  display_name: string;
  bio: string | null;
  planet_color: string;
  planet_surface_style: PlanetSurfaceStyle;
  planet_atmosphere: PlanetAtmosphere;
  planet_glow: number;
  planet_has_ring: boolean;
  universe_mood: UniverseMood;
  space_background: SpaceBackground;
  published_at: string | null;
  star_count: number;
}

type Insertable<Row, Required extends keyof Row> = Partial<Row> & Pick<Row, Required>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insertable<ProfileRow, 'id' | 'username' | 'display_name'>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      stars: {
        Row: StarRow;
        Insert: Insertable<StarRow, 'profile_id' | 'title'>;
        Update: Partial<StarRow>;
        Relationships: [];
      };
      reserved_usernames: {
        Row: { username: string };
        Insert: { username: string };
        Update: { username: string };
        Relationships: [];
      };
      site_config: {
        Row: { key: string; value: Record<string, unknown>; updated_at: string };
        Insert: { key: string; value: Record<string, unknown>; updated_at?: string };
        Update: Partial<{ key: string; value: Record<string, unknown>; updated_at: string }>;
        Relationships: [];
      };
      planet_messages: {
        Row: PlanetMessageRow;
        Insert: Partial<PlanetMessageRow>;
        Update: Partial<PlanetMessageRow>;
        Relationships: [];
      };
      planet_stats_daily: {
        Row: PlanetStatRow;
        Insert: PlanetStatRow;
        Update: Partial<PlanetStatRow>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          profile_id: string;
          message_id: string | null;
          reason: string;
          details: string | null;
          status: 'open' | 'resolved' | 'dismissed';
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: { status?: 'open' | 'resolved' | 'dismissed' };
        Relationships: [];
      };
      planet_views_daily: {
        Row: PlanetViewsRow;
        Insert: PlanetViewsRow;
        Update: Partial<PlanetViewsRow>;
        Relationships: [];
      };
    };
    Views: {
      explore_planets: {
        Row: ExplorePlanetRow;
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      get_public_stats: {
        Args: Record<string, never>;
        Returns: { planets: number; stars: number };
      };
      is_username_available: { Args: { p_username: string }; Returns: boolean };
      record_planet_view: { Args: { p_username: string }; Returns: undefined };
      resonate_star: { Args: { p_star_id: string }; Returns: number };
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
      admin_overview: { Args: Record<string, never>; Returns: unknown };
      submit_planet_message: { Args: { p_username: string; p_name: string; p_body: string }; Returns: string };
      submit_report: {
        Args: { p_username: string; p_reason: string; p_details?: string | null; p_message_id?: string | null };
        Returns: undefined;
      };
      track_planet_event: {
        Args: {
          p_username: string;
          p_event: string;
          p_dim?: string | null;
          p_source?: string | null;
          p_country?: string | null;
          p_device?: string | null;
        };
        Returns: undefined;
      };
      admin_reports: { Args: Record<string, never>; Returns: unknown };
      admin_reset_planet: { Args: { p_profile_id: string }; Returns: undefined };
      admin_delete_user: { Args: { p_user_id: string }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
