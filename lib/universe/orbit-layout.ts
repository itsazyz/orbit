/**
 * Layout for stars orbiting a planet, computed at render time so every
 * page (public, preview, landing demo) agrees. Stage coordinates are in a
 * fixed 600×600 design space; OrbitStage scales the whole stage to fit.
 */
export const STAGE_SIZE = 600;
export const ORBIT_RINGS = [150, 205, 262] as const;
const RING_DURATIONS = [80, 110, 150]; // seconds per revolution (outer = slower)
const RING_OFFSETS = [0, 38, 74]; // degrees, so rings don't line up

export interface OrbitSlot {
  ring: number;
  radius: number;
  angle: number;
  /** Seconds per revolution */
  duration: number;
}

function ringsFor(count: number): number {
  if (count <= 4) return 1;
  if (count <= 9) return 2;
  return 3;
}

export function layoutOrbit(count: number): OrbitSlot[] {
  if (count <= 0) return [];
  const rings = ringsFor(count);

  // Outer rings are longer, so give them proportionally more stars.
  const weights = ORBIT_RINGS.slice(0, rings).map((r) => r);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const perRing = weights.map((w) => Math.floor((w / totalWeight) * count));
  let remaining = count - perRing.reduce((a, b) => a + b, 0);
  for (let i = rings - 1; remaining > 0; i = (i - 1 + rings) % rings) {
    perRing[i]! += 1;
    remaining -= 1;
  }

  const slots: OrbitSlot[] = [];
  perRing.forEach((n, ring) => {
    for (let k = 0; k < n; k += 1) {
      slots.push({
        ring,
        radius: ORBIT_RINGS[ring]!,
        angle: (RING_OFFSETS[ring]! + (360 / n) * k) % 360,
        duration: RING_DURATIONS[ring]!,
      });
    }
  });

  // Interleave rings so star order (sort_order) spreads across the stage.
  return slots
    .map((slot, i) => ({ slot, key: (i % Math.max(1, perRing[slot.ring]!)) * rings + slot.ring }))
    .sort((a, b) => a.key - b.key)
    .map(({ slot }) => slot);
}

/** Legacy polar columns kept in the DB for compatibility with v1 readers. */
export function legacyStarColumns(index: number, total: number) {
  const slot = layoutOrbit(total)[index];
  return {
    angle: slot?.angle ?? 0,
    distance: slot?.radius ?? 150,
    size: 12,
  };
}
