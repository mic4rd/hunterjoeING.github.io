import { ROTOR, RADIUS } from './wt-rotor.js?v=0.2.0';

export const INLET = 3.5 * RADIUS, OUTLET = -3 * RADIUS;
const SLICES = 128;
const rings = [
  { radius: 0.23, spokes: 4, angle: Math.PI / 4 },
  { radius: 0.53, spokes: 6, angle: Math.PI / 6 },
  { radius: 0.76, spokes: 4, angle: Math.PI / 4 },
  { radius: 1.31, spokes: 2, angle: Math.PI / 12 }
];
export const STREAM_COUNT = rings.reduce((sum, ring) => sum + ring.spokes, 0);
const sparseLanes = [0, 4, 10, 14];
export function lanesFor(count) {
  return count < 64 ? 4 : count < 160 ? 8 : STREAM_COUNT;
}
export function streamIndex(column, lanes) {
  return lanes === 4 ? sparseLanes[column] : column * (STREAM_COUNT / lanes);
}

// Equal travel-time samples already show the compressed spacing and twist
// in a still frame. After seeding, actual particles interact with the model.
export function createStreamSeeder(sampleField) {
  const streams = [], tables = [];
  for (const ring of rings) {
    const table = { radius: RADIUS * ring.radius, x: new Float64Array(SLICES + 1),
      y: new Float64Array(SLICES + 1), time: new Float64Array(SLICES + 1) };
    tables.push(table);
    for (let j = 0; j < ring.spokes; j++) {
      const angle = ring.angle + 2 * Math.PI * j / ring.spokes;
      streams.push({ table, cos: Math.cos(angle), sin: Math.sin(angle) });
    }
  }
  const unit = { a: NaN, lambda: NaN, u: 1 }, v = {};
  const ds = (INLET - OUTLET) / SLICES;
  function prepare(op) {
    if (unit.a === op.a && unit.lambda === op.lambda) return;
    unit.a = op.a;
    unit.lambda = op.lambda;
    for (const table of tables) {
      const { x, y, time } = table;
      x[0] = table.radius;
      for (let i = 0; i < SLICES; i++) {
        const s = -INLET + i * ds;
        sampleField(v, x[i], y[i], s, unit);
        const half = ds / (-2 * v.z);
        sampleField(v, x[i] + half * v.x, y[i] + half * v.y, s + ds / 2, unit);
        const dt = ds / -v.z;
        time[i + 1] = time[i] + dt;
        x[i + 1] = x[i] + v.x * dt;
        y[i + 1] = y[i] + v.y * dt;
      }
    }
  }
  function period(lane) { return streams[lane].table.time[SLICES]; }
  function place(out, lane, age, bladeZ) {
    const { table, cos, sin } = streams[lane];
    let lo = 0, hi = SLICES;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (age < table.time[mid]) hi = mid;
      else lo = mid;
    }
    const f = (age - table.time[lo]) / (table.time[hi] - table.time[lo]);
    const x = table.x[lo] + (table.x[hi] - table.x[lo]) * f;
    const y = table.y[lo] + (table.y[hi] - table.y[lo]) * f;
    out.x = x * cos - y * sin;
    out.y = ROTOR.y + x * sin + y * cos;
    out.z = bladeZ + INLET - ds * (lo + f);
  }
  return { prepare, period, place };
}
