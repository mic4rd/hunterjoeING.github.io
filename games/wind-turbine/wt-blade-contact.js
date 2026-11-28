import { ROTOR, RADIUS, bladeRings } from './wt-rotor.js?v=0.2.0';

// Konvexe Hülle aus 24 Tangentialebenen je Profilring.
// Die lineare Interpolation der Stützwerte umschließt auch beide Dreiecke
// zwischen Nachbarringen. Alle Tabellen werden einmalig aufgebaut.
const SIDES = 24;
const nx = new Float64Array(SIDES), nz = new Float64Array(SIDES);
const support = new Float64Array((ROTOR.spans + 1) * SIDES);
function buildSections() {
  const vertices = bladeRings();
  for (let k = 0; k < SIDES; k++) {
    nx[k] = Math.cos(k * 2 * Math.PI / SIDES);
    nz[k] = Math.sin(k * 2 * Math.PI / SIDES);
    for (let i = 0; i <= ROTOR.spans; i++) {
      // Include the circular pitch collar across the first span.
      let h = i <= 1 ? 0.29 : -Infinity;
      for (let j = 0; j <= ROTOR.profileSegments; j++) {
        const offset = 3 * (i * (ROTOR.profileSegments + 1) + j);
        h = Math.max(h, vertices[offset] * nx[k] + vertices[offset + 2] * nz[k]);
      }
      support[i * SIDES + k] = h;
    }
  }
}
buildSections();

export function contactFrame() {
  return { cos: new Float64Array(3), sin: new Float64Array(3), cp: 1, sp: 0, z: ROTOR.z };
}

export function orientFrame(frame, angle, pitch, z) {
  frame.z = z;
  frame.cp = Math.cos(pitch);
  frame.sp = Math.sin(pitch);
  for (let i = 0; i < 3; i++) {
    const theta = angle + i * Math.PI * 2 / 3;
    frame.cos[i] = Math.cos(theta);
    frame.sin[i] = Math.sin(theta);
  }
}

function ringAt(r) {
  return Math.min(ROTOR.spans, Math.max(0, (r - ROTOR.root) * ROTOR.spans / ROTOR.length));
}

// Sweep in the moving blade frame, including motion of the blade itself.
// Clip the segment against the expanded section, then keep the tangential
// part of the remaining relative displacement on the entry face.
export function slidePastBlades(p, x0, y0, z0, from, to, radius, dt) {
  const dz0 = z0 - from.z, dz1 = p.z - to.z;
  if (Math.min(dz0, dz1) > 0.85 || Math.max(dz0, dz1) < -0.85) return false;
  for (let i = 0; i < 3; i++) {
    const dy0 = y0 - ROTOR.y, dy1 = p.y - ROTOR.y;
    const u0 = from.cos[i] * x0 + from.sin[i] * dy0;
    const u1 = to.cos[i] * p.x + to.sin[i] * dy1;
    if (Math.min(u0, u1) > 0.85 || Math.max(u0, u1) < -0.85) continue;
    const r0 = -from.sin[i] * x0 + from.cos[i] * dy0;
    const r1 = -to.sin[i] * p.x + to.cos[i] * dy1;
    if (Math.max(r0, r1) < ROTOR.root - 0.08 - radius || Math.min(r0, r1) > RADIUS + radius) continue;
    const bx0 = from.cp * u0 - from.sp * dz0, bz0 = from.sp * u0 + from.cp * dz0;
    let bx1 = to.cp * u1 - to.sp * dz1, bz1 = to.sp * u1 + to.cp * dz1;
    const a = ringAt(r0), b = ringAt(r1);
    const ia = Math.min(ROTOR.spans - 1, Math.floor(a)), ib = Math.min(ROTOR.spans - 1, Math.floor(b));
    let enter = 0, exit = 1, entryFace = -1, nearest = 0, nearestGap = -Infinity;
    const margin = radius * 1.1 + 0.002; // Also covers radial slope and substep curvature.
    for (let k = 0; k < SIDES; k++) {
      const i0 = ia * SIDES + k, i1 = ib * SIDES + k;
      const h0 = support[i0] + (a - ia) * (support[i0 + SIDES] - support[i0]);
      const h1 = support[i1] + (b - ib) * (support[i1 + SIDES] - support[i1]);
      const g0 = bx0 * nx[k] + bz0 * nz[k] - h0 - margin;
      const g1 = bx1 * nx[k] + bz1 * nz[k] - h1 - margin;
      if (g1 > nearestGap) { nearestGap = g1; nearest = k; }
      if (g0 > 0 && g1 > 0) { exit = -1; break; }
      if (g0 > 0) {
        const t = g0 / (g0 - g1);
        if (t > enter) { enter = t; entryFace = k; }
      } else if (g1 > 0) {
        exit = Math.min(exit, g0 / (g0 - g1));
      }
      if (enter > exit) break;
    }
    if (enter > exit || (entryFace < 0 && nearestGap > 0)) continue;
    const k = entryFace < 0 ? nearest : entryFace;
    const index = ib * SIDES + k;
    const plane = support[index] + (b - ib) * (support[index + SIDES] - support[index]);
    const push = Math.max(0, plane + margin + 0.0001 - bx1 * nx[k] - bz1 * nz[k]);
    // Small tangential bias towards the trailing edge (-local X).
    const glide = dt * (1 - enter) * 0.8;
    bx1 += push * nx[k] - glide * nz[k] * nz[k];
    bz1 += push * nz[k] + glide * nx[k] * nz[k];
    const u = to.cp * bx1 + to.sp * bz1;
    p.x = to.cos[i] * u - to.sin[i] * r1;
    p.y = ROTOR.y + to.sin[i] * u + to.cos[i] * r1;
    p.z = to.z - to.sp * bx1 + to.cp * bz1;
    return true;
  }
  return false;
}
