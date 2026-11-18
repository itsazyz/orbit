'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { PlanetLook } from '@/lib/planet/design';
import { PlanetVisual } from '@/components/planet/Planet3D';
import { StarShape } from '@/components/universe/StarShape';
import { STAR_TYPE_COLORS } from '@/lib/universe/constants';
import { layoutOrbit, ORBIT_RINGS, STAGE_SIZE } from '@/lib/universe/orbit-layout';
import { cn } from '@/lib/utils';

export type OrbitPlanet = PlanetLook;

export interface OrbitStar {
  id: string;
  title: string;
  icon: string;
  visualType: string;
  /** Stars sharing a category are joined into a constellation */
  category?: string | null;
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
  /** WebGL planet (falls back to CSS automatically) */
  render3d?: boolean;
  /** Draw constellation lines between stars of the same category */
  constellations?: boolean;
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
  render3d = false,
  constellations = true,
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

  // ---- constellation edges: chain stars that share a category ----
  const edges = useMemo(() => {
    if (!constellations) return [] as Array<{ a: number; b: number; category: string }>;
    const byCat = new Map<string, number[]>();
    stars.forEach((s, i) => {
      if (!s.category) return;
      const list = byCat.get(s.category) ?? [];
      list.push(i);
      byCat.set(s.category, list);
    });
    const out: Array<{ a: number; b: number; category: string }> = [];
    byCat.forEach((idx, category) => {
      for (let k = 0; k + 1 < idx.length; k += 1) out.push({ a: idx[k]!, b: idx[k + 1]!, category });
    });
    return out;
  }, [stars, constellations]);

  const armRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lineRefs = useRef<Array<SVGLineElement | null>>([]);

  useEffect(() => {
    if (!edges.length) return;
    let raf = 0;
    const cache = new Map<number, Animation | null>();
    const angleOf = (i: number): number => {
      const slot = slots[i];
      if (!slot) return 0;
      let anim = cache.get(i);
      if (anim === undefined) {
        const el = armRefs.current[i];
        const found: Animation | null =
          el && typeof el.getAnimations === 'function' ? el.getAnimations()[0] ?? null : null;
        anim = found;
        cache.set(i, found);
      }
      const progress = anim?.effect?.getComputedTiming().progress;
      return typeof progress === 'number' ? progress * 360 : slot.angle;
    };
    const center = STAGE_SIZE / 2;
    const tick = () => {
      edges.forEach((edge, k) => {
        const line = lineRefs.current[k];
        const sa = slots[edge.a];
        const sb = slots[edge.b];
        if (!line || !sa || !sb) return;
        const aa = (angleOf(edge.a) * Math.PI) / 180;
        const ab = (angleOf(edge.b) * Math.PI) / 180;
        line.setAttribute('x1', String(center + Math.cos(aa) * sa.radius));
        line.setAttribute('y1', String(center + Math.sin(aa) * sa.radius));
        line.setAttribute('x2', String(center + Math.cos(ab) * sb.radius));
        line.setAttribute('y2', String(center + Math.sin(ab) * sb.radius));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [edges, slots]);

  const selectedCategory = stars.find((s) => s.id === selectedId)?.category ?? null;

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
          style={{
            width: 420,
            height: 420,
            background: `radial-gradient(circle, ${planet.color}26 0%, ${planet.color}12 32%, transparent 68%)`,
          }}
          aria-hidden
        />

        {edges.length ? (
          <svg className="orbit-lines" width={STAGE_SIZE} height={STAGE_SIZE} aria-hidden>
            {edges.map((edge, k) => (
              <line
                key={`${edge.a}-${edge.b}`}
                ref={(el) => {
                  lineRefs.current[k] = el;
                }}
                stroke={planet.color}
                strokeWidth={selectedCategory === edge.category ? 1.6 : 1}
                strokeOpacity={selectedCategory === edge.category ? 0.75 : 0.28}
                strokeDasharray="2 5"
                strokeLinecap="round"
              />
            ))}
          </svg>
        ) : null}

        <div className="orbit-planet">
          <PlanetVisual look={planet} size={planetSize} render3d={render3d} />
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
            <div
              key={star.id}
              className="orbit-arm"
              style={vars}
              ref={(el) => {
                armRefs.current[index] = el;
              }}
            >
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
