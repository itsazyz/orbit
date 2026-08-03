'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PlanetRenderer,
  UniverseBackground,
} from '@/components/planet/PlanetRenderer';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { CosmicDust } from '@/components/universe/CosmicDust';
import type {
  PlanetAtmosphere,
  PlanetSurfaceStyle,
  SpaceBackground,
  UniverseMood,
} from '@/types/database';

export interface PreviewStar {
  id: string;
  title: string;
  icon: string;
  visualType: string;
}

interface CreateLivePreviewProps {
  name: string;
  username: string;
  bio: string;
  planetColor: string;
  planetSurface: PlanetSurfaceStyle;
  atmosphere: PlanetAtmosphere;
  glow: number;
  hasRing: boolean;
  mood: UniverseMood;
  spaceBackground: SpaceBackground;
  stars: PreviewStar[];
  emptyName: string;
  emptyBio: string;
  emptyStarsHint: string;
  starsCountLabel: string;
}

export function CreateLivePreview({
  name,
  username,
  bio,
  planetColor,
  planetSurface,
  atmosphere,
  glow,
  hasRing,
  mood,
  spaceBackground,
  stars,
  emptyName,
  emptyBio,
  emptyStarsHint,
  starsCountLabel,
}: CreateLivePreviewProps) {
  const [time, setTime] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    let raf = 0;
    const tick = (t: number) => {
      setTime(t / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const orbiting = useMemo(() => {
    const maxShow = Math.min(stars.length, 8);
    return stars.slice(0, maxShow).map((star, index) => {
      const baseAngle = (index / Math.max(maxShow, 1)) * 360;
      const distance = 95 + (index % 3) * 28;
      const speed = 0.7 + (index % 3) * 0.35;
      const angle = reducedMotion ? baseAngle : baseAngle + time * speed * 18;
      const rad = (angle * Math.PI) / 180;
      return {
        ...star,
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance * 0.72,
      };
    });
  }, [stars, time, reducedMotion]);

  return (
    <div className="create-live-preview">
      <UniverseBackground mood={mood} spaceBackground={spaceBackground} />
      <StarsBackground seed={`preview-${username || 'new'}`} count={48} />
      <CosmicDust seed={`dust-${planetColor}`} count={18} color={`${planetColor}55`} />

      <div className="create-live-stage">
        <div className="create-orbit create-orbit-a" />
        <div className="create-orbit create-orbit-b" />

        {orbiting.map((star) => (
          <div
            key={star.id}
            className="create-orbit-star"
            style={{
              left: `calc(50% + ${star.x}px)`,
              top: `calc(50% + ${star.y}px)`,
            }}
            title={star.title}
          >
            <span className="create-orbit-star-icon">{star.icon || '✦'}</span>
            <span className="create-orbit-star-label">{star.title}</span>
          </div>
        ))}

        <div className="create-live-planet">
          <PlanetRenderer
            color={planetColor}
            surfaceStyle={planetSurface}
            atmosphere={atmosphere}
            glow={glow}
            hasRing={hasRing}
            mood={mood}
            spaceBackground={spaceBackground}
            size={148}
            animate
            spin={!reducedMotion}
          />
        </div>
      </div>

      <div className="create-live-identity">
        <h2>{name.trim() || emptyName}</h2>
        <p className="create-live-bio">{bio.trim() || emptyBio}</p>
        {username ? <span className="create-live-user">orbit/{username}</span> : null}
        <p className="create-live-hint">
          {stars.length === 0 ? emptyStarsHint : starsCountLabel}
        </p>
      </div>
    </div>
  );
}
