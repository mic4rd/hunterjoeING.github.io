// Both landscape resolutions and debris sample the very same triangles.
export const LAND_SIZE = 192, GRID = 4, BASE_Y = -11.56, SEA_Y = -15.6;
const cells = LAND_SIZE / GRID, stride = cells + 1;
const heights = new Float64Array(stride * stride);
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

for (let j = 0; j <= cells; j++) {
  for (let i = 0; i <= cells; i++) {
    const x = GRID * i - LAND_SIZE / 2, z = GRID * j - LAND_SIZE / 2;
    const hill = smooth((Math.hypot(x, z) - 9) / 26);
    const shore = smooth((-0.83 * x - 0.56 * z + 3 * Math.sin(z / 16) - 9) / 24);
    const meadow = 1.65 + 0.72 * Math.sin(x / 14) * Math.cos(z / 13);
    heights[j * stride + i] = BASE_Y - hill * meadow - 7.5 * shore;
  }
}

export function terrainHeight(x, z) {
  const u = Math.max(0, Math.min(cells, x / GRID + cells / 2));
  const v = Math.max(0, Math.min(cells, z / GRID + cells / 2));
  const i = Math.min(cells - 1, Math.floor(u)), j = Math.min(cells - 1, Math.floor(v));
  const fx = u - i, fz = v - j, k = j * stride + i;
  const b = heights[k + 1], c = heights[k + stride];
  if (fx + fz <= 1) return heights[k] * (1 - fx - fz) + b * fx + c * fz;
  return heights[k + stride + 1] * (fx + fz - 1) + b * (1 - fz) + c * (1 - fx);
}

// Conservative terrain support for a tumbling assembly. The extrema of a
// clipped height-field triangle occur at corners or intersections of its edges.
export function highestGround(x0, z0, x1, z1) {
  let top = Math.max(terrainHeight(x0, z0), terrainHeight(x0, z1), terrainHeight(x1, z0), terrainHeight(x1, z1));
  for (let x = Math.ceil(x0 / GRID) * GRID; x <= x1; x += GRID) {
    top = Math.max(top, terrainHeight(x, z0), terrainHeight(x, z1));
    for (let z = Math.ceil(z0 / GRID) * GRID; z <= z1; z += GRID) top = Math.max(top, terrainHeight(x, z));
  }
  for (let z = Math.ceil(z0 / GRID) * GRID; z <= z1; z += GRID)
    top = Math.max(top, terrainHeight(x0, z), terrainHeight(x1, z));
  for (let d = Math.ceil((x0 + z0) / GRID) * GRID; d <= x1 + z1; d += GRID) {
    if (d - z0 >= x0 && d - z0 <= x1) top = Math.max(top, terrainHeight(d - z0, z0));
    if (d - z1 >= x0 && d - z1 <= x1) top = Math.max(top, terrainHeight(d - z1, z1));
    if (d - x0 >= z0 && d - x0 <= z1) top = Math.max(top, terrainHeight(x0, d - x0));
    if (d - x1 >= z0 && d - x1 <= z1) top = Math.max(top, terrainHeight(x1, d - x1));
  }
  return top;
}
