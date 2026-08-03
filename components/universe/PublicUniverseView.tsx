'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  PlanetAtmosphere,
  PlanetSurfaceStyle,
  SpaceBackground,
  UniverseMood,
} from '@/types/database';
import type { StarVisualType } from '@/lib/universe/visual-styles';
import { PlanetRenderer, UniverseBackground } from '@/components/planet/PlanetRenderer';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { CosmicDust } from '@/components/universe/CosmicDust';
import { StarShape } from '@/components/universe/StarShape';
import { STAR_TYPE_COLORS } from '@/lib/universe/constants';
import { Volume2, VolumeX } from 'lucide-react';

export interface PublicStar {
  id: string;
  title: string;
  content: string | null;
  icon: string;
  angle: number;
  distance: number;
  size: number;
  visual_type?: StarVisualType | string;
  orbit_speed?: number;
  star_color?: string | null;
}

export interface PublicProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  planet_color: string | null;
  planet_surface_style?: PlanetSurfaceStyle;
  planet_atmosphere?: PlanetAtmosphere;
  planet_glow?: number;
  planet_has_ring?: boolean;
  universe_mood?: UniverseMood;
  space_background?: SpaceBackground;
  music_url?: string | null;
  music_enabled?: boolean;
  music_volume?: number;
}

interface PublicUniverseViewProps {
  profile: PublicProfile;
  stars: PublicStar[];
}

export function PublicUniverseView({ profile, stars }: PublicUniverseViewProps) {
  const [selectedStar, setSelectedStar] = useState<PublicStar | null>(null);
  const [time, setTime] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const planetColor = profile.planet_color || '#7c3aed';
  const mood = profile.universe_mood ?? 'calm';
  const spaceBg = profile.space_background ?? 'deep_space';

  const musicEnabled = profile.music_enabled && !!profile.music_url;
  const musicVolume = profile.music_volume ?? 0.3;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
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

  useEffect(() => {
    if (!musicEnabled || !audioRef.current) return;
    const audio = audioRef.current;
    audio.volume = muted ? 0 : musicVolume;
    const play = () => {
      audio.play().catch(() => {
        /* autoplay blocked until user interaction — mute button works as unlock */
      });
    };
    play();
  }, [musicEnabled, musicVolume, muted]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (audioRef.current) {
        audioRef.current.volume = next ? 0 : musicVolume;
        if (!next) audioRef.current.play().catch(() => undefined);
      }
      return next;
    });
  }, [musicVolume]);

  const orbitingStars = useMemo(
    () =>
      stars.map((star) => {
        const speed = star.orbit_speed ?? 1;
        const angleDeg = reducedMotion
          ? star.angle
          : star.angle + time * speed * 12;
        const rad = (angleDeg * Math.PI) / 180;
        return {
          ...star,
          x: Math.cos(rad) * star.distance,
          y: Math.sin(rad) * star.distance,
        };
      }),
    [stars, time, reducedMotion]
  );

  return (
    <main className="universe-root">
      <UniverseBackground mood={mood} spaceBackground={spaceBg} />
      <StarsBackground seed={profile.username} count={90} />
      <CosmicDust
        seed={`${profile.username}-dust`}
        count={32}
        color={`${planetColor}66`}
      />
      <div className="universe-vignette" aria-hidden />

      {musicEnabled ? (
        <>
          <audio ref={audioRef} src={profile.music_url!} loop preload="metadata" />
          <button
            type="button"
            className="music-toggle"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute music' : 'Mute music'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </>
      ) : null}

      <div className="universe-center">
        <div className="universe-stage">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="orbit-glow" style={{ boxShadow: `0 0 120px ${planetColor}33` }} />

          {orbitingStars.map((star) => (
            <button
              key={star.id}
              type="button"
              className="user-star"
              style={{
                left: `calc(50% + ${star.x}px)`,
                top: `calc(50% + ${star.y}px)`,
              }}
              onClick={() => setSelectedStar(star)}
              aria-label={star.title}
            >
            <span
              className="star-pulse"
              style={{
                background:
                  STAR_TYPE_COLORS[star.visual_type ?? 'sparkle'] ||
                  star.star_color ||
                  planetColor,
              }}
            />
            <StarShape
              type={star.visual_type ?? 'sparkle'}
              size={Math.max(star.size || 12, 14)}
              color={
                STAR_TYPE_COLORS[star.visual_type ?? 'sparkle'] ||
                star.star_color ||
                '#ffffff'
              }
              icon={star.icon}
            />
              <span className="star-label">{star.title}</span>
            </button>
          ))}

          <div className={`planet-wrap ${reducedMotion ? '' : 'planet-spin'}`}>
            <PlanetRenderer
              color={planetColor}
              surfaceStyle={profile.planet_surface_style ?? 'smooth'}
              atmosphere={profile.planet_atmosphere ?? 'thin'}
              glow={profile.planet_glow ?? 4}
              hasRing={profile.planet_has_ring ?? false}
              mood={mood}
              spaceBackground={spaceBg}
              size={190}
              animate
              spin={!reducedMotion}
            />
          </div>
        </div>

        <div className="identity">
          <h1>{profile.display_name || profile.username}</h1>
          <p className="username">@{profile.username}</p>
          {profile.bio ? <p className="bio">{profile.bio}</p> : null}
        </div>
      </div>

      {selectedStar ? (
        <div
          className="star-overlay"
          onClick={() => setSelectedStar(null)}
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            /* Keep universe clearly visible — almost no dim / no heavy blur */
            background: 'rgba(0, 0, 0, 0.08)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          }}
        >
          <div
            className="star-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="star-modal-title"
            style={{
              position: 'relative',
              width: 'min(100%, 470px)',
              maxHeight: '85svh',
              overflowY: 'auto',
              padding: '42px 28px 28px',
              borderRadius: 28,
              textAlign: 'center',
              /* Nearly transparent panel so the world shows through */
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.18)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          >
            <button
              type="button"
              className="close-button"
              onClick={() => setSelectedStar(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-star" style={{ boxShadow: `0 0 50px ${planetColor}99` }}>
              {selectedStar.icon || '✦'}
            </div>

            <p className="modal-eyebrow">A part of this universe</p>
            <h2 id="star-modal-title">{selectedStar.title}</h2>

            {selectedStar.content ? (
              <p
                className="modal-content"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                {selectedStar.content}
              </p>
            ) : (
              <p
                className="modal-content empty"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                No content has been added to this star yet.
              </p>
            )}

            <button type="button" className="back-button" onClick={() => setSelectedStar(null)}>
              ← Back to orbit
            </button>
          </div>
        </div>
      ) : null}

      {stars.length > 0 && !selectedStar ? (
        <div className="hint">
          Tap a star to discover something about {profile.display_name || 'this person'}
        </div>
      ) : null}

      {stars.length === 0 ? (
        <div className="no-stars">
          <span>✦</span>
          <p>This universe is still being created.</p>
        </div>
      ) : null}

      <style jsx>{`
        .universe-root {
          position: relative;
          min-height: 100svh;
          width: 100%;
          overflow: hidden;
          color: white;
          isolation: isolate;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: universeEnter 1.1s ease-out both;
        }

        .universe-center {
          position: relative;
          z-index: 2;
          width: min(100vw, 1100px);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        @keyframes universeEnter {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .universe-vignette {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            transparent 35%,
            rgba(0, 0, 0, 0.45) 100%
          );
        }

        .music-toggle {
          position: fixed;
          top: 64px;
          right: 20px;
          z-index: 50;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.08);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(12px);
        }

        .universe-stage {
          position: relative;
          width: 100%;
          height: min(72svh, 720px);
          min-height: 480px;
        }

        .orbit {
          position: absolute;
          left: 50%;
          top: 50%;
          border: 1px dashed rgba(255, 255, 255, 0.09);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .orbit-glow {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 3;
        }

        .orbit-one {
          width: 330px;
          height: 330px;
          animation: orbitRotate 25s linear infinite, orbitBreath 7s ease-in-out infinite;
        }

        .orbit-two {
          width: 520px;
          height: 520px;
          animation: orbitRotate 38s linear infinite reverse, orbitBreath 9s ease-in-out infinite;
        }

        .orbit-three {
          width: 730px;
          height: 730px;
          opacity: 0.7;
          animation: orbitRotate 55s linear infinite, orbitBreath 12s ease-in-out infinite;
        }

        @keyframes orbitBreath {
          0%,
          100% {
            border-color: rgba(255, 255, 255, 0.06);
          }
          50% {
            border-color: rgba(255, 255, 255, 0.16);
          }
        }

        @keyframes orbitRotate {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        .planet-wrap {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 5;
        }

        .planet-spin {
          animation: planetSelfRotate 48s linear infinite;
        }

        @keyframes planetSelfRotate {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        .user-star {
          position: absolute;
          transform: translate(-50%, -50%);
          border: none;
          background: transparent;
          cursor: pointer;
          z-index: 8;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.25s ease;
        }

        .user-star:hover,
        .user-star:focus-visible {
          transform: translate(-50%, -50%) scale(1.15);
        }

        .star-pulse {
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          opacity: 0.22;
          filter: blur(6px);
          animation: starPulse 3.2s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes starPulse {
          0%,
          100% {
            transform: scale(0.85);
            opacity: 0.15;
          }
          50% {
            transform: scale(1.35);
            opacity: 0.35;
          }
        }

        .star-shape {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .star-label {
          position: absolute;
          top: calc(100% + 9px);
          white-space: nowrap;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.65);
          opacity: 0;
          transform: translateY(-4px);
          transition: all 0.25s ease;
          pointer-events: none;
        }

        .user-star:hover .star-label,
        .user-star:focus .star-label {
          opacity: 1;
          transform: translateY(0);
        }

        .identity {
          position: relative;
          z-index: 10;
          width: min(90%, 420px);
          margin: -72px auto 0;
          padding: 0 16px 24px;
          text-align: center;
          pointer-events: none;
        }

        .identity h1 {
          margin: 0;
          font-size: clamp(25px, 5vw, 38px);
          font-weight: 700;
          text-shadow: 0 8px 40px rgba(0, 0, 0, 0.55);
          letter-spacing: -0.02em;
        }

        .username {
          margin: 7px 0 0;
          color: #a78bfa;
          font-size: 14px;
        }

        .bio {
          margin: 13px auto 0;
          color: #9da6c2;
          line-height: 1.6;
          font-size: 14px;
          max-width: 350px;
        }

        .hint {
          position: fixed;
          left: 50%;
          bottom: 25px;
          transform: translateX(-50%);
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px);
          color: #aeb6cf;
          font-size: 12px;
          z-index: 20;
        }

        .no-stars {
          position: fixed;
          left: 50%;
          bottom: 30px;
          transform: translateX(-50%);
          text-align: center;
          color: #7d86a2;
          font-size: 12px;
          z-index: 20;
        }

        .star-overlay {
          animation: overlayIn 0.25s ease-out;
        }

        @keyframes overlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .star-modal {
          animation: modalRise 0.35s ease-out;
        }

        @keyframes modalRise {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .close-button {
          position: absolute;
          right: 16px;
          top: 14px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          color: white;
          font-size: 24px;
          cursor: pointer;
        }

        .modal-star {
          width: 58px;
          height: 58px;
          margin: 0 auto 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: white;
          background: radial-gradient(circle, white 0%, #a78bfa 30%, #7c3aed 70%, transparent 72%);
        }

        .modal-eyebrow {
          margin: 0 0 9px;
          color: #a78bfa;
          font-size: 12px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          text-shadow: 0 1px 10px rgba(0, 0, 0, 0.55);
        }

        .star-modal h2 {
          margin: 0;
          font-size: clamp(27px, 7vw, 38px);
          text-shadow: 0 2px 18px rgba(0, 0, 0, 0.65);
        }

        .modal-content {
          margin: 20px auto 0;
          color: #f8fafc;
          line-height: 1.8;
          font-size: 15px;
          white-space: pre-wrap;
          padding: 16px 18px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-shadow: 0 1px 12px rgba(0, 0, 0, 0.55);
        }

        .modal-content.empty {
          color: #cbd5e1;
        }

        .back-button {
          margin-top: 28px;
          padding: 13px 20px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          cursor: pointer;
          font-size: 14px;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.45);
        }

        @media (max-width: 600px) {
          .orbit-one {
            width: 230px;
            height: 230px;
          }
          .orbit-two {
            width: 360px;
            height: 360px;
          }
          .orbit-three {
            width: 500px;
            height: 500px;
          }
          .identity {
            margin-top: -48px;
          }
          .star-label {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orbit-one,
          .orbit-two,
          .orbit-three,
          .planet-spin,
          .star-pulse,
          .universe-root,
          .star-overlay,
          .star-modal {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}
