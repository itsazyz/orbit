'use client';

import { STAR_TYPE_COLORS } from '@/lib/universe/constants';

export function StarShape({
  type,
  size,
  color,
  icon,
}: {
  type: string;
  size: number;
  color: string;
  icon: string;
}) {
  const s = Math.max(size, 10);
  const accent = STAR_TYPE_COLORS[type] ?? color;

  switch (type) {
    case 'diamond':
      return (
        <span
          style={{
            width: s * 1.15,
            height: s * 1.15,
            background: `linear-gradient(135deg, #ffffff, ${accent})`,
            transform: 'rotate(45deg)',
            borderRadius: 3,
            boxShadow: `0 0 ${s * 1.5}px ${accent}, 0 0 ${s * 3}px ${accent}88`,
            border: '1px solid rgba(255,255,255,0.7)',
            position: 'relative',
            display: 'block',
          }}
        />
      );

    case 'glow':
      return (
        <span
          style={{
            width: s * 1.6,
            height: s * 1.6,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: accent,
              filter: 'blur(8px)',
              opacity: 0.85,
            }}
          />
          <span
            style={{
              width: '45%',
              height: '45%',
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: `0 0 ${s * 2}px ${accent}`,
              position: 'relative',
              zIndex: 1,
            }}
          />
        </span>
      );

    case 'comet':
      return (
        <span
          style={{
            width: s * 3.2,
            height: s * 0.85,
            position: 'relative',
            display: 'block',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '78%',
              height: '55%',
              background: `linear-gradient(90deg, transparent, ${accent}cc, ${accent})`,
              borderRadius: 999,
              filter: 'blur(1px)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: s,
              height: s,
              borderRadius: '50%',
              background: `radial-gradient(circle, #fff 0%, ${accent} 70%)`,
              boxShadow: `0 0 ${s * 1.5}px ${accent}`,
            }}
          />
        </span>
      );

    case 'ring':
      return (
        <span
          style={{
            width: s * 1.7,
            height: s * 1.7,
            border: `2.5px solid ${accent}`,
            borderRadius: '50%',
            boxShadow: `0 0 ${s * 1.4}px ${accent}, inset 0 0 ${s}px ${accent}55`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
          }}
        >
          <span
            style={{
              width: '28%',
              height: '28%',
              borderRadius: '50%',
              background: accent,
              boxShadow: `0 0 ${s}px ${accent}`,
            }}
          />
        </span>
      );

    case 'classic':
      return (
        <span
          style={{
            fontSize: s * 1.55,
            lineHeight: 1,
            color: accent,
            textShadow: `0 0 ${s}px ${accent}, 0 0 ${s * 2}px ${accent}88`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.5))',
          }}
        >
          {icon || '★'}
        </span>
      );

    case 'sparkle':
    default:
      return (
        <span
          style={{
            width: s * 1.3,
            height: s * 1.3,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              position: 'absolute',
              width: '18%',
              height: '100%',
              background: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
              boxShadow: `0 0 ${s}px ${accent}`,
            }}
          />
          <span
            style={{
              position: 'absolute',
              width: '100%',
              height: '18%',
              background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
              boxShadow: `0 0 ${s}px ${accent}`,
            }}
          />
          <span
            style={{
              width: '34%',
              height: '34%',
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: `0 0 ${s * 1.5}px #fff, 0 0 ${s * 2.5}px ${accent}`,
              position: 'relative',
              zIndex: 1,
            }}
          />
        </span>
      );
  }
}
