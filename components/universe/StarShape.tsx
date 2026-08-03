'use client';

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
  const s = size;

  switch (type) {
    case 'diamond':
      return (
        <span
          className="star-shape diamond"
          style={{
            width: s,
            height: s,
            background: color,
            transform: 'rotate(45deg)',
            borderRadius: 2,
            boxShadow: `0 0 ${s}px ${color}`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      );
    case 'glow':
      return (
        <span
          className="star-shape glow"
          style={{
            width: s,
            height: s,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 ${s * 2}px ${color}, 0 0 ${s * 4}px ${color}88`,
            }}
          />
        </span>
      );
    case 'comet':
      return (
        <span
          className="star-shape comet"
          style={{
            width: s * 2.5,
            height: s * 0.6,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              position: 'absolute',
              right: 0,
              width: s,
              height: s,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 ${s}px ${color}`,
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '70%',
              height: 2,
              background: `linear-gradient(90deg, transparent, ${color})`,
              opacity: 0.6,
            }}
          />
        </span>
      );
    case 'ring':
      return (
        <span
          className="star-shape ring"
          style={{
            width: s * 1.4,
            height: s * 1.4,
            border: `2px solid ${color}`,
            borderRadius: '50%',
            boxShadow: `0 0 ${s}px ${color}66`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      );
    case 'classic':
      return (
        <span
          className="star-shape classic"
          style={{
            fontSize: s * 1.2,
            color,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon || '★'}
        </span>
      );
    case 'sparkle':
    default:
      return (
        <span
          className="star-shape sparkle"
          style={{
            width: s,
            height: s,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="star-core"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 ${s}px white, 0 0 ${s * 2}px ${color}`,
            }}
          />
          <span
            className="star-glow"
            style={{
              position: 'absolute',
              inset: '-100%',
              borderRadius: '50%',
              background: `${color}22`,
              filter: 'blur(6px)',
            }}
          />
        </span>
      );
  }
}
