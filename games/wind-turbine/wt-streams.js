import { ROTOR, RADIUS } from './wt-rotor.js?v=0.2.0';

export const INLET = 3.5 * RADIUS, OUTLET = -3 * RADIUS, INLET_RADIUS = 1.30 * RADIUS;
const SLICES = 96, BANDS = 40, STRIDE = SLICES + 1;
const ds = (INLET - OUTLET) / SLICES;
function interval(table, start, count, value) {
  let low = 0, high = count;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (value < table[start + mid]) high = mid;
    else low = mid;
  }
  return low;
}

function halton(index, base) {
  let value = 0, weight = 1 / base;
  while (index > 0) {
    value += (index % base) * weight;
    index = Math.floor(index / base);
    weight /= base;
  }
  return value;
}

// Low-discrepancy volume and inlet samples. Equal-area annuli cover the disk.
// Initial occupancy is weighted by residence time: a slower path contains
// more beads for the same inlet flux. Subsequent motion uses the live field.
export function createVolumeSeeder(sample) {
  const times = new Float64Array(BANDS * STRIDE), rx = times.slice(), ry = times.slice();
  const cdf = new Float64Array(BANDS + 1);
  const unit = { a: NaN, lambda: NaN, u: 1 }, v = {};
  let serial = 0;
  function prepare(op) {
    if (unit.a === op.a && unit.lambda === op.lambda) return;
    unit.a = op.a; unit.lambda = op.lambda;
    for (let b = 0; b < BANDS; b++) {
      const start = b * STRIDE;
      rx[start] = INLET_RADIUS * Math.sqrt((b + 0.5) / BANDS);
      for (let i = 0; i < SLICES; i++) {
        const k = start + i, s = -INLET + i * ds;
        sample(v, rx[k], ry[k], s, unit);
        const half = ds / (-2 * v.z);
        sample(v, rx[k] + half * v.x, ry[k] + half * v.y, s + ds / 2, unit);
        const dt = ds / -v.z;
        times[k + 1] = times[k] + dt;
        rx[k + 1] = rx[k] + dt * v.x; ry[k + 1] = ry[k] + dt * v.y;
      }
      cdf[b + 1] = cdf[b] + times[start + SLICES];
    }
  }
  function place(p, index, z, ground, initial) {
    const id = initial ? index + 1 : ++serial;
    const area = halton(id, 2), az = halton(id, 3);
    let x = INLET_RADIUS * Math.sqrt(area), y = 0, distance = INLET;
    p.travel = 0;
    if (initial) {
      const weight = area * cdf[BANDS];
      const band = interval(cdf, 0, BANDS, weight);
      const start = band * STRIDE, duration = cdf[band + 1] - cdf[band];
      const scale = Math.sqrt((band + (weight - cdf[band]) / duration) / (band + 0.5));
      const age = halton(id, 5) * duration;
      p.travel = age;
      const slice = interval(times, start, SLICES, age);
      const k = start + slice, f = (age - times[k]) / (times[k + 1] - times[k]);
      x = (rx[k] + f * (rx[k + 1] - rx[k])) * scale;
      y = (ry[k] + f * (ry[k + 1] - ry[k])) * scale;
      distance -= (slice + f) * ds;
    }
    // Sample just the air above the ground, including the small clipped
    // circular segment at the bottom of the bypass stream.
    const r = Math.sqrt(x * x + y * y);
    let angle = 2 * Math.PI * az;
    if (r > ROTOR.y - ground) {
      const limit = Math.asin((ROTOR.y - ground) / r);
      angle = -limit + az * (Math.PI + 2 * limit) - Math.atan2(y, x);
    }
    const c = Math.cos(angle), s = Math.sin(angle);
    p.x = x * c - y * s; p.y = ROTOR.y + x * s + y * c; p.z = z + distance;
  }
  return { prepare, place };
}
