// Both landscape resolutions and debris sample the very same triangles.
export const LAND_SIZE = 192, GRID = 4, BASE_Y = -11.56, SEA_Y = -15.6;
const cells = LAND_SIZE / GRID, stride = cells + 1;
const heights = new Float64Array(stride * stride);
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

for (let j = 0; j <= cells; j++) {
  for (let i = 0; i <= cells; i++) {
    const x = GRID * i - LAND_SIZE / 2, z = GRID * j - LAND_SIZE / 2;
    // A low, asymmetric headland extends inland behind the camera. Its outer
    // mesh boundary lies below sea level, including when orbiting the coast.
    const inland = .82 * x + .57 * z;
    const lateral = -.57 * x + .82 * z;
    const apron = Math.hypot(Math.max(-4 - x, 0, x - 8), Math.max(0, Math.abs(z) - 4));
    const hill = smooth(apron / 21);
    const cove = 3.7 * Math.sin(inland / 9) + 2.3 * Math.sin(lateral / 8);
    const crossShore = Math.hypot(Math.max(-inland * 1.22, inland * .44), lateral - cove);
    const shore = smooth((crossShore - 17) / 18);
    const meadow = 3.25 + .78 * Math.sin(lateral / 9 + .3) * Math.cos(inland / 14);
    // A low spur curves out of the left flank. Its sandy, seaward edge can
    // be seen beyond the crest even from the low exterior camera.
    const ridge = 25 + 7 * Math.sin(inland / 13);
    const spur = Math.hypot((inland + 25) / 40, (lateral - ridge) / 18);
    const dune = SEA_Y + 1.95 - 5.8 * smooth(spur);
    heights[j * stride + i] = Math.max(BASE_Y - hill * meadow - 6.2 * shore, dune);
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
function abovePlane(x, z, slopeX, slopeZ) {
  return terrainHeight(x, z) - slopeX * x - slopeZ * z;
}

export function highestGround(x0, z0, x1, z1, slopeX = 0, slopeZ = 0) {
  let top = Math.max(abovePlane(x0, z0, slopeX, slopeZ), abovePlane(x0, z1, slopeX, slopeZ), abovePlane(x1, z0, slopeX, slopeZ), abovePlane(x1, z1, slopeX, slopeZ));
  for (let x = Math.ceil(x0 / GRID) * GRID; x <= x1; x += GRID) {
    top = Math.max(top, abovePlane(x, z0, slopeX, slopeZ), abovePlane(x, z1, slopeX, slopeZ));
    for (let z = Math.ceil(z0 / GRID) * GRID; z <= z1; z += GRID) top = Math.max(top, abovePlane(x, z, slopeX, slopeZ));
  }
  for (let z = Math.ceil(z0 / GRID) * GRID; z <= z1; z += GRID)
    top = Math.max(top, abovePlane(x0, z, slopeX, slopeZ), abovePlane(x1, z, slopeX, slopeZ));
  for (let d = Math.ceil((x0 + z0) / GRID) * GRID; d <= x1 + z1; d += GRID) {
    if (d - z0 >= x0 && d - z0 <= x1) top = Math.max(top, abovePlane(d - z0, z0, slopeX, slopeZ));
    if (d - z1 >= x0 && d - z1 <= x1) top = Math.max(top, abovePlane(d - z1, z1, slopeX, slopeZ));
    if (d - x0 >= z0 && d - x0 <= z1) top = Math.max(top, abovePlane(x0, d - x0, slopeX, slopeZ));
    if (d - x1 >= z0 && d - x1 <= z1) top = Math.max(top, abovePlane(x1, d - x1, slopeX, slopeZ));
  }
  return top;
}
