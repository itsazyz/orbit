'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PlanetRenderer,
  UniverseBackground,
} from '@/components/planet/PlanetRenderer';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { CosmicDust } from '@/components/universe/CosmicDust';
import { StarShape } from '@/components/universe/StarShape';
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
  pagePreviewLabel: string;
  tapHint: string;
}

/** Live mirror of the public planet page while editing */
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
  pagePreviewLabel,
  tapHint,
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

  const displayName = name.trim() || emptyName;
  const handle = username.trim() || 'username';

  const orbiting = useMemo(() => {
    const maxShow = Math.min(stars.length, 10);
    return stars.slice(0, maxShow).map((star, index) => {
      const baseAngle = (index / Math.max(maxShow, 1)) * 360;
      const distance = 88 + (index % 3) * 32;
      const speed = 0.65 + (index % 3) * 0.4;
      const angle = reducedMotion ? baseAngle : baseAngle + time * speed * 14;
      const rad = (angle * Math.PI) / 180;
      return {
        ...star,
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance * 0.78,
        size: 10 + (index % 3) * 2,
      };
    });
  }, [stars, time, reducedMotion]);

  return (
    <div className="create-live-preview" aria-label={pagePreviewLabel}>
      <UniverseBackground mood={mood} spaceBackground={spaceBackground} />
      <StarsBackground seed={`preview-${handle}`} count={70} />
      <CosmicDust seed={`dust-${planetColor}`} count={22} color={`${planetColor}66`} />
      <div className="create-live-vignette" aria-hidden />

      <div className="create-live-stage">
        <div className="create-orbit create-orbit-a" />
        <div className="create-orbit create-orbit-b" />
        <div className="create-orbit create-orbit-c" />
        <div
          className="create-orbit-glow"
          style={{ boxShadow: `0 0 90px ${planetColor}40` }}
        />

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
            <StarShape
              type={star.visualType || 'sparkle'}
              size={star.size}
              color="#ffffff"
              icon={star.icon}
            />
            <span className="create-orbit-star-label">{star.title}</span>
          </div>
        ))}

        <div className={`create-live-planet ${reducedMotion ? '' : 'is-spinning'}`}>
          <PlanetRenderer
            color={planetColor}
            surfaceStyle={planetSurface}
            atmosphere={atmosphere}
            glow={glow}
            hasRing={hasRing}
            mood={mood}
            spaceBackground={spaceBackground}
            size={132}
            animate
            spin={!reducedMotion}
          />
        </div>
      </div>

      <div className="create-live-identity">
        <h2>{displayName}</h2>
        <p className="create-live-handle">@{handle}</p>
        <p className="create-live-bio">{bio.trim() || emptyBio}</p>
      </div>

      <div className="create-live-footer">
        {stars.length === 0 ? emptyStarsHint : tapHint.replace('{name}', displayName)}
        <span className="create-live-count">{starsCountLabel}</span>
      </div>
    </div>
  );
}
