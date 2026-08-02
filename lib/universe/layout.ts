/**
 * Deterministic pseudo-random number generator seeded by a string (profile id).
 * Ensures the same user always gets the same initial layout.
 */
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LayoutInput {
  id: string;
  importance: number;
  sortOrder: number;
}

export interface LayoutOutput {
  position_x: number;
  position_y: number;
  orbit_radius: number;
  orbit_speed: number;
  object_size: number;
}

const IMPORTANCE_SIZE: Record<number, number> = {
  1: 0.6,
  2: 0.75,
  3: 1.0,
  4: 1.25,
  5: 1.5,
};

const IMPORTANCE_RADIUS: Record<number, number> = {
  1: 220,
  2: 185,
  3: 150,
  4: 120,
  5: 95,
};

/**
 * Compute stable positions for all objects in a universe.
 * Uses profile id as seed + sort_order for deterministic angle assignment.
 */
export function computeDeterministicLayout(
  profileId: string,
  objects: LayoutInput[]
): LayoutOutput[] {
  const rng = mulberry32(hashSeed(profileId));
  const baseAngleOffset = rng() * Math.PI * 2;

  return objects.map((obj, index) => {
    const objRng = mulberry32(hashSeed(`${profileId}-${obj.id}-${obj.sortOrder}`));
    const angle =
      baseAngleOffset +
      (index / Math.max(objects.length, 1)) * Math.PI * 2 +
      (objRng() - 0.5) * 0.4;

    const radius = IMPORTANCE_RADIUS[obj.importance] ?? 150;
    const size = IMPORTANCE_SIZE[obj.importance] ?? 1.0;

    return {
      position_x: Math.cos(angle) * radius,
      position_y: Math.sin(angle) * radius,
      orbit_radius: radius,
      orbit_speed: 0.3 + objRng() * 0.7,
      object_size: size,
    };
  });
}

export function applyLayoutToObjects<T extends LayoutInput>(
  profileId: string,
  objects: T[]
): Array<T & LayoutOutput> {
  const sorted = [...objects].sort((a, b) => a.sortOrder - b.sortOrder);
  const layouts = computeDeterministicLayout(profileId, sorted);
  return sorted.map((obj, i) => ({
    ...obj,
    ...layouts[i]!,
  }));
}
