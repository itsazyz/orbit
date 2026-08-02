"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PublicUniverseView } from "@/components/universe/PublicUniverseView";
import type { PublicProfile, PublicStar } from "@/components/universe/PublicUniverseView";

export default function UserPlanetPage() {
  const params = useParams();
  const username = String(params.username);

  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stars, setStars] = useState<PublicStar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadPlanet() {
      setLoading(true);
      setError(false);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, username, display_name, bio, planet_color, planet_surface_style, planet_atmosphere, planet_glow, planet_has_ring, universe_mood, space_background, music_url, music_enabled, music_volume"
          )
          .eq("username", username)
          .eq("is_published", true)
          .eq("visibility", "public")
          .maybeSingle();

        if (profileError || !profileData) {
          setError(true);
          setLoading(false);
          return;
        }

        setProfile(profileData as PublicProfile);

        const { data: starsData, error: starsError } = await supabase
          .from("stars")
          .select(
            "id, title, content, icon, angle, distance, size, visual_type, orbit_speed, star_color"
          )
          .eq("profile_id", profileData.id)
          .order("sort_order", { ascending: true });

        if (starsError) {
          setStars([]);
        } else {
          setStars((starsData as PublicStar[]) || []);
        }
      } catch {
        setError(true);
      }

      setLoading(false);
    }

    loadPlanet();
  }, [supabase, username]);

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#020308] text-[#9da6c2]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border border-white/15 border-t-violet-500" />
          <p>Entering orbit...</p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#020308] px-6 text-center text-white">
        <div>
          <div className="mb-4 text-5xl opacity-80">✦</div>
          <h1 className="text-4xl font-semibold">Planet not found</h1>
          <p className="mx-auto mt-3 max-w-sm text-[#929bb6]">
            This orbit doesn&apos;t exist, or the planet hasn&apos;t been created yet.
          </p>
        </div>
      </main>
    );
  }

  return <PublicUniverseView profile={profile} stars={stars} />;
}
