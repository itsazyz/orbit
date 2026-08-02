/**
 * Compute stable polar coordinates for stars orbiting a planet.
 * Distributes stars evenly around the planet with varied orbit distances.
 */
export interface StarLayout {
  angle: number;
  distance: number;
  size: number;
}

const ORBIT_DISTANCES = [130, 165, 200, 145, 185, 220];

export function computeStarLayout(
  index: number,
  total: number
): StarLayout {
  const angle = total > 0 ? (index / total) * 360 : 0;
  const distance = ORBIT_DISTANCES[index % ORBIT_DISTANCES.length]!;
  const size = 10 + (index % 3) * 2;

  return { angle, distance, size };
}

export function computeAllStarLayouts(total: number): StarLayout[] {
  return Array.from({ length: total }, (_, index) =>
    computeStarLayout(index, total)
  );
}
