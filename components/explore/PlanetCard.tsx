'use client';

import Link from 'next/link';
import { PlanetRenderer } from '@/components/planet/PlanetRenderer';
import { useLanguage } from '@/lib/i18n/context';
import { normalizePlanetSurface } from '@/lib/universe/planet-surfaces';
import type { ExplorePlanetRow } from '@/types/database';

export function PlanetCard({ planet }: { planet: ExplorePlanetRow }) {
  const { t } = useLanguage();
  return (
    <Link
      href={`/${planet.username}`}
      className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] px-5 pb-6 pt-8 text-center transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div
        className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-40 blur-3xl transition group-hover:opacity-70"
        style={{ background: planet.planet_color }}
        aria-hidden
      />
      <div className="relative flex h-28 items-center justify-center">
        <PlanetRenderer
          color={planet.planet_color}
          surfaceStyle={normalizePlanetSurface(planet.planet_surface_style)}
          atmosphere={planet.planet_atmosphere}
          glow={Math.min(planet.planet_glow, 3)}
          hasRing={planet.planet_has_ring}
          mood={planet.universe_mood}
          spaceBackground={planet.space_background}
          size={72}
          animate={false}
        />
      </div>
      <p dir="auto" className="relative mt-4 line-clamp-1 font-medium text-star">{planet.display_name}</p>
      <p className="relative text-xs text-star-dim" dir="ltr">
        @{planet.username}
      </p>
      {planet.bio ? (
        <p dir="auto" className="relative mt-3 line-clamp-2 text-sm leading-relaxed text-star-dim">{planet.bio}</p>
      ) : null}
      <p className="relative mt-4 text-[11px] uppercase tracking-[0.18em] text-star-dim/70">
        ✦ {t('explore.stars', { count: planet.star_count })}
      </p>
    </Link>
  );
}
