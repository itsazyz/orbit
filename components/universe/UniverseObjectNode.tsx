'use client';

import type { VisualType } from '@/types/database';
import { cn } from '@/lib/utils';

interface UniverseObjectNodeProps {
  visualType: VisualType;
  size: number;
  color?: string | null;
  name: string;
  x: number;
  y: number;
  selected?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  interactive?: boolean;
  showLabel?: boolean;
  reducedMotion?: boolean;
}

const DEFAULT_COLOR = '#f5f3ff';

export function UniverseObjectNode({
  visualType,
  size,
  color,
  name,
  x,
  y,
  selected,
  onClick,
  onMouseEnter,
  onMouseLeave,
  interactive = true,
  showLabel = false,
  reducedMotion = false,
}: UniverseObjectNodeProps) {
  const fill = color ?? DEFAULT_COLOR;
  const baseSize = 12 * size;

  function renderShape() {
    switch (visualType) {
      case 'moon':
        return (
          <circle
            cx={0}
            cy={0}
            r={baseSize}
            fill={fill}
            opacity={0.85}
          />
        );
      case 'planet':
        return (
          <circle cx={0} cy={0} r={baseSize} fill={fill} />
        );
      case 'comet':
        return (
          <g>
            <ellipse cx={-baseSize} cy={0} rx={baseSize * 2} ry={baseSize * 0.4} fill={fill} opacity={0.3} />
            <circle cx={0} cy={0} r={baseSize * 0.7} fill={fill} />
          </g>
        );
      case 'satellite':
        return (
          <g>
            <rect x={-baseSize * 0.3} y={-baseSize * 0.15} width={baseSize * 0.6} height={baseSize * 0.3} fill={fill} rx={2} />
            <rect x={-baseSize * 0.8} y={-baseSize * 0.05} width={baseSize * 0.4} height={baseSize * 0.1} fill={fill} opacity={0.7} />
            <rect x={baseSize * 0.4} y={-baseSize * 0.05} width={baseSize * 0.4} height={baseSize * 0.1} fill={fill} opacity={0.7} />
          </g>
        );
      case 'star':
      default:
        return (
          <polygon
            points={starPoints(baseSize)}
            fill={fill}
          />
        );
    }
  }

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className={cn(interactive && 'cursor-pointer')}
      onClick={interactive ? onClick : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role={interactive ? 'button' : undefined}
      aria-label={name}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {selected ? (
        <circle cx={0} cy={0} r={baseSize + 8} fill="none" stroke="#7c8cff" strokeWidth={2} opacity={0.8} />
      ) : null}
      <g className={!reducedMotion ? 'motion-safe:animate-pulse' : undefined} style={{ animationDuration: '3s' }}>
        {renderShape()}
      </g>
      {showLabel ? (
        <text
          y={baseSize + 14}
          textAnchor="middle"
          fill="#9aa0c3"
          fontSize={11}
          className="pointer-events-none select-none"
        >
          {name}
        </text>
      ) : null}
    </g>
  );
}

function starPoints(size: number): string {
  const points: string[] = [];
  const outer = size;
  const inner = size * 0.4;
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    points.push(`${Math.cos(angle) * r},${Math.sin(angle) * r}`);
  }
  return points.join(' ');
}
