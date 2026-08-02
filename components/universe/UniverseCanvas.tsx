'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ObjectCategory,
  PlanetAtmosphere,
  PlanetSurfaceStyle,
  SpaceBackground,
  UniverseMood,
  VisualType,
} from '@/types/database';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { UniverseObjectNode } from '@/components/universe/UniverseObjectNode';
import { PlanetRenderer, UniverseBackground } from '@/components/planet/PlanetRenderer';
import { cn } from '@/lib/utils';

export interface UniverseObjectData {
  id: string;
  name: string;
  category: ObjectCategory;
  description: string | null;
  importance: number;
  visual_type: VisualType;
  position_x: number;
  position_y: number;
  object_size: number;
  object_color: string | null;
  orbit_radius: number;
  orbit_speed: number;
}

export interface UniverseProfile {
  display_name: string;
  bio: string | null;
  planet_color: string;
  planet_surface_style: PlanetSurfaceStyle;
  planet_atmosphere: PlanetAtmosphere;
  planet_glow: number;
  planet_has_ring: boolean;
  universe_mood: UniverseMood;
  space_background: SpaceBackground;
}

interface UniverseCanvasProps {
  profile: UniverseProfile;
  objects: UniverseObjectData[];
  seed: string;
  editable?: boolean;
  showIntro?: boolean;
  onObjectClick?: (obj: UniverseObjectData) => void;
  onObjectMove?: (id: string, x: number, y: number) => void;
  selectedObjectId?: string | null;
  className?: string;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;

export function UniverseCanvas({
  profile,
  objects,
  seed,
  editable = false,
  showIntro = false,
  onObjectClick,
  onObjectMove,
  selectedObjectId,
  className,
}: UniverseCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: showIntro ? 0.6 : 1 });
  const [dragging, setDragging] = useState<{ type: 'pan' | 'object'; id?: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [introDone, setIntroDone] = useState(!showIntro);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!showIntro || reducedMotion) {
      setIntroDone(true);
      setTransform((t) => ({ ...t, scale: 1 }));
      return;
    }
    const timer = setTimeout(() => {
      setIntroDone(true);
      setTransform((t) => ({ ...t, scale: 1 }));
    }, 2000);
    return () => clearTimeout(timer);
  }, [showIntro, reducedMotion]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({
      ...t,
      scale: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, t.scale * delta)),
    }));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, objectId?: string, objX?: number, objY?: number) => {
      if (objectId && editable && objX !== undefined && objY !== undefined) {
        setDragging({ type: 'object', id: objectId, startX: e.clientX, startY: e.clientY, origX: objX, origY: objY });
      } else {
        setDragging({ type: 'pan', startX: e.clientX, startY: e.clientY, origX: transform.x, origY: transform.y });
      }
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [editable, transform.x, transform.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;

      if (dragging.type === 'pan') {
        setTransform((t) => ({ ...t, x: dragging.origX + dx, y: dragging.origY + dy }));
      } else if (dragging.type === 'object' && dragging.id && onObjectMove) {
        const svgScale = transform.scale;
        onObjectMove(dragging.id, dragging.origX + dx / svgScale, dragging.origY + dy / svgScale);
      }
    },
    [dragging, onObjectMove, transform.scale]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  const planetSize = 100;

  return (
    <div
      ref={containerRef}
      className={cn('universe-canvas relative h-full w-full overflow-hidden', className)}
      onWheel={handleWheel}
      onPointerDown={(e) => handlePointerDown(e)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      role="img"
      aria-label={`Universe of ${profile.display_name}`}
    >
      <UniverseBackground mood={profile.universe_mood} spaceBackground={profile.space_background} />
      <StarsBackground seed={seed} />

      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-[2000ms] ease-out"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transitionDuration: introDone ? '0ms' : '2000ms',
        }}
      >
        <svg
          viewBox="-400 -400 800 800"
          className="h-full max-h-[80vh] w-full max-w-[80vh]"
          style={{ overflow: 'visible' }}
        >
          {/* Orbit rings */}
          {objects.map((obj) => (
            <circle
              key={`orbit-${obj.id}`}
              cx={0}
              cy={0}
              r={obj.orbit_radius}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={1}
              strokeDasharray="4 8"
            />
          ))}

          {/* Objects */}
          {objects.map((obj) => (
            <g
              key={obj.id}
              onPointerDown={(e) => {
                e.stopPropagation();
                handlePointerDown(e, obj.id, obj.position_x, obj.position_y);
              }}
            >
              <UniverseObjectNode
                visualType={obj.visual_type}
                size={obj.object_size}
                color={obj.object_color}
                name={obj.name}
                x={obj.position_x}
                y={obj.position_y}
                selected={selectedObjectId === obj.id}
                onClick={() => onObjectClick?.(obj)}
                onMouseEnter={() => setHoveredId(obj.id)}
                onMouseLeave={() => setHoveredId(null)}
                interactive
                showLabel={hoveredId === obj.id}
                reducedMotion={reducedMotion}
              />
            </g>
          ))}

          {/* Central planet */}
          <foreignObject x={-planetSize / 2} y={-planetSize / 2} width={planetSize} height={planetSize}>
            <div className="flex h-full w-full items-center justify-center">
              <PlanetRenderer
                color={profile.planet_color}
                surfaceStyle={profile.planet_surface_style}
                atmosphere={profile.planet_atmosphere}
                glow={profile.planet_glow}
                hasRing={profile.planet_has_ring}
                mood={profile.universe_mood}
                spaceBackground={profile.space_background}
                size={planetSize}
                animate={!reducedMotion}
              />
            </div>
          </foreignObject>
        </svg>
      </div>

      {/* Name overlay */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-8 text-center transition-opacity duration-1000',
          introDone ? 'opacity-100' : 'opacity-0'
        )}
      >
        <h1 className="text-2xl font-light text-star md:text-3xl">{profile.display_name}</h1>
        {profile.bio ? (
          <p className="mx-auto mt-2 max-w-md px-4 text-sm text-star-dim">{profile.bio}</p>
        ) : null}
      </div>
    </div>
  );
}
