'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type {
  PlanetAtmosphere,
  PlanetSurfaceStyle,
  SpaceBackground,
  UniverseMood,
} from '@/types/database';
import { PlanetRenderer } from '@/components/planet/PlanetRenderer';
import { StarShape } from '@/components/universe/StarShape';
import { STAR_TYPE_COLORS } from '@/lib/universe/constants';
import { layoutOrbit, ORBIT_RINGS, STAGE_SIZE } from '@/lib/universe/orbit-layout';
import { cn } from '@/lib/utils';

export interface OrbitPlanet {
  color: string;
  surfaceStyle: PlanetSurfaceStyle;
  atmosphere: PlanetAtmosphere;
  glow: number;
  hasRing: boolean;
  mood: UniverseMood;
  spaceBackground: SpaceBackground;
}

export interface OrbitStar {
  id: string;
  title: string;
  icon: string;
  visualType: string;
}

interface OrbitStageProps {
  planet: OrbitPlanet;
  stars: OrbitStar[];
  onSelect?: (index: number) => void;
  selectedId?: string | null;
  /** Hide star labels below this scale (they get unreadable) */
  labelMinScale?: number;
  maxScale?: number;
  paused?: boolean;
  className?: string;
  planetSize?: number;
}

/**
 * The orbit itself: a planet with stars circling on up to three rings.
 * Motion is pure CSS (compositor-only transforms) so the page never
 * re-renders per frame. The 600px design stage scales to fit its box.
 */
export function OrbitStage({
  planet,
  stars,
  onSelect,
  selectedId,
  labelMinScale = 0.82,
  maxScale = 1,
  paused = false,
  className,
  planetSize = 150,
}: OrbitStageProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const s = Math.min(maxScale, width / STAGE_SIZE, height / STAGE_SIZE);
      setScale(Number.isFinite(s) && s > 0 ? s : 0.6);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxScale]);

  const slots = useMemo(() => layoutOrbit(stars.length), [stars.length]);
  const usedRings = useMemo(
    () => Array.from(new Set(slots.map((s) => s.ring))).sort(),
    [slots]
  );
  const showLabels = scale >= labelMinScale;

  return (
    <div ref={boxRef} className={cn('relative h-full w-full', className)}>
      <div
        className={cn('orbit-stage', paused && 'orbit-paused', onSelect && 'orbit-interactive')}
        style={{
          width: STAGE_SIZE,
          height: STAGE_SIZE,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {(usedRings.length ? usedRings : [0]).map((ring) => (
          <div
            key={ring}
            className="orbit-ring"
            style={{ width: ORBIT_RINGS[ring]! * 2, height: ORBIT_RINGS[ring]! * 2 }}
            aria-hidden
          />
        ))}

        <div
          className="orbit-planet-glow"
          style={{ boxShadow: `0 0 140px ${planet.color}40, 0 0 60px ${planet.color}30` }}
          aria-hidden
        />

        <div className="orbit-planet">
          <PlanetRenderer
            color={planet.color}
            surfaceStyle={planet.surfaceStyle}
            atmosphere={planet.atmosphere}
            glow={planet.glow}
            hasRing={planet.hasRing}
            mood={planet.mood}
            spaceBackground={planet.spaceBackground}
            size={planetSize}
            animate
            spin
          />
        </div>

        {stars.map((star, index) => {
          const slot = slots[index];
          if (!slot) return null;
          const color = STAR_TYPE_COLORS[star.visualType] ?? '#ffffff';
          const delay = -(slot.angle / 360) * slot.duration;
          const vars = {
            '--angle': `${slot.angle}deg`,
            '--dur': `${slot.duration}s`,
            '--delay': `${delay}s`,
            '--r': `${slot.radius}px`,
          } as CSSProperties;
          const content = (
            <>
              <span className="orbit-star-halo" style={{ background: color }} aria-hidden />
              <StarShape type={star.visualType} size={16} color={color} icon={star.icon} />
              {showLabels ? <span className="orbit-star-label" dir="auto">{star.title}</span> : null}
            </>
          );
          const starClass = cn('orbit-star', selectedId === star.id && 'is-selected');

          return (
            <div key={star.id} className="orbit-arm" style={vars}>
              <div className="orbit-body">
                <div className="orbit-upright">
                  {onSelect ? (
                    <button type="button" onClick={() => onSelect(index)} aria-label={star.title} className={starClass}>
                      {content}
                    </button>
                  ) : (
                    <div className={starClass}>{content}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
