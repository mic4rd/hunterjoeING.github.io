import { TURBINE_SPECS } from './wt-data.js?v=0.2.0';
import { ROTOR, RADIUS, spinnerRadius } from './wt-rotor.js?v=0.2.0';
import { contactFrame, orientFrame, slidePastBlades } from './wt-blade-contact.js?v=0.2.0';
import { densityPercent } from './wt-settings.js?v=0.2.0';

import { OUTLET, createVolumeSeeder } from './wt-streams.js?v=0.2.0';

export const BEAD_RADIUS = 0.085;
export const MAX_PARTICLES = 14400;

const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth = x => x * x * (3 - 2 * x);

export function windBudget(hardware, width, reducedMotion) {
  return width <= 768 || hardware.hardwareConcurrency <= 4 || hardware.deviceMemory <= 4 || reducedMotion ? 4600 : MAX_PARTICLES;
}

export function particleCount(speed, density, budget) {
  if (speed <= 0) return 0;
  const fraction = 0.26 + 0.46 * clamp01(speed / TURBINE_SPECS.maxWindSpeed);
  return Math.min(budget, Math.round(budget * fraction * densityPercent(density) / 100));
}

export function setOperatingPoint(out, telemetry) {
  const v = telemetry.windSpeed;
  out.u = v * 0.68;
  out.lambda = v > 0 ? telemetry.tipSpeedMs / v : 0;
  out.a = 0;
  if (telemetry.status === 'partial') out.a = smooth(clamp01((v - TURBINE_SPECS.cutInSpeed) / 2)) / 3;
  if (telemetry.status === 'rated') out.a = (TURBINE_SPECS.ratedSpeed / v) ** 3 / 3;
  return out;
}

// Downstream coordinate s increases along world -Z. R is the tube radius
// AT the disk, so A(s) * U(s) = A(0) * U(0) throughout the core.
export function sampleSection(out, s, a) {
  out.xi = s / RADIUS;
  out.q = Math.sqrt(1 + out.xi * out.xi);
  out.g = 1 - a * (1 + out.xi / out.q);
  out.tube = RADIUS * Math.sqrt((1 - a) / out.g);
  return out;
}

export function sampleField(out, x, y, s, op) {
  // x and y are relative to the rotor axis.
  const { xi, q, g, tube } = sampleSection(out, s, op.a);
  const r = Math.sqrt(x * x + y * y), relative = r / tube;
  const core = smooth(clamp01((1.06 - relative) / 0.12));
  const axial = op.u * (1 - (1 - g) * core);
  // Radial derivative of r(s) inside; smooth displacement decays outside.
  const spread = axial * op.a / (2 * RADIUS * g * q ** 3 * Math.max(1, relative ** 3));
  const lambdaR = op.lambda * relative;
  const prime = Math.min(0.22, op.a * (1 - op.a) / Math.max(0.001, lambdaR * lambdaR));
  const wake = smooth(clamp01(xi / 0.35)) / (1 + Math.max(0, xi) * 0.35);
  const spin = -ROTOR.spinSign * 2 * prime * op.u * op.lambda / tube * wake * core;
  out.x = spread * x - spin * y;
  out.y = spread * y + spin * x;
  out.z = -axial;
}

export function initialPose() {
  return { angle: 0, pitch: 0, bladeZ: ROTOR.z, hubZ: ROTOR.z, towerY: -6.25, nacelleY: 0.25, nacelleZ: -0.3 };
}

function towerRadius(y, towerY) {
  return 1.25 - 0.6 * (y - towerY) / 9.6;
}

function obstacleVelocity(v, p, pose) {
  const x = p.x, y = p.y - ROTOR.y, z = p.z - pose.hubZ;
  if (z > -0.8 && z < 4 && x * x + y * y < 8) {
    // Diverge before the spinner nose, including at zero disk loading.
    const r = Math.sqrt(x * x + y * y);
    const lift = -v.z * 0.5 * smooth(clamp01((4 - z) / 2.5)) * clamp01(1 - r / 2.8);
    v.x += r > 0.001 ? lift * x / r : lift;
    v.y += r > 0.001 ? lift * y / r : 0;
  }
  if (Math.abs(p.y - pose.towerY) > 4.85 || Math.abs(x) > 4.8 || Math.abs(p.z) > 8) return;
  const b = towerRadius(p.y, pose.towerY);
  const r2 = Math.max(b * b, x * x + p.z * p.z);
  const strength = b * b / (r2 * r2);
  const u = -v.z;
  v.x += u * 2 * x * p.z * strength;
  v.z = -u * Math.max(0.12, 1 + (x * x - p.z * p.z) * strength);
  if (p.z < 0) v.z *= 1 - 0.32 * clamp01(1 - Math.abs(x) / (1.5 * b)) * clamp01(1 + p.z / 8);
}

function excludeSolids(p, pose, b = BEAD_RADIUS) {
  const hubZ = p.z - pose.hubZ;
  if (hubZ >= -0.65 - b && hubZ <= 1.6 + b) {
    const y = p.y - ROTOR.y;
    const r = Math.sqrt(p.x * p.x + y * y);
    const limit = spinnerRadius(hubZ - b) + b;
    if (r < limit) {
      if (r < 1e-9) p.x = limit;
      else { p.x *= limit / r; p.y = ROTOR.y + y * limit / r; }
    }
  }
  const towerH = p.y - pose.towerY;
  if (towerH >= -5.31 - b && towerH <= 4.8 + b && Math.abs(p.z) < 3) {
    const r = Math.sqrt(p.x * p.x + p.z * p.z);
    const limit = (towerH < -4.59 + b ? 2.75 : towerRadius(p.y, pose.towerY) + 0.10) + b;
    if (r < limit) {
      if (r < 1e-9) p.x = limit;
      else { p.x *= limit / r; p.z *= limit / r; }
    }
  }
  // A closed envelope keeps outside air clear of the cutaway drivetrain.
  const dy = p.y - pose.nacelleY;
  if (Math.abs(p.z - pose.nacelleZ + 0.2) < 3.55 + b && Math.abs(dy) < 1.42 + b && Math.abs(p.x) < 1.39 + b) {
    if (1.39 - Math.abs(p.x) < 1.42 - Math.abs(dy)) p.x = (p.x < 0 ? -1 : 1) * (1.39 + b);
    else p.y = pose.nacelleY + (dy < 0 ? -1 : 1) * (1.42 + b);
  }
  p.y = Math.max(p.y, pose.towerY - 5 + b);
}

export function createAirflow(capacity) {
  const positions = new Float32Array(capacity * 3), speedRatio = new Float32Array(capacity);
  const p = { x: 0, y: 0, z: 0 }, velocity = { x: 0, y: 0, z: 0 };
  const op = { a: 0, lambda: 0, u: 0 };
  const previous = initialPose(), pose = initialPose(), keys = Object.keys(pose);
  let from = contactFrame(), to = contactFrame(), count = 0;

  const seeds = createVolumeSeeder(sampleField);
  const contact = new Float32Array(capacity);
  let lastWind = -1;

  function update(dt, telemetry, target, requested) {
    const next = Math.min(requested, capacity);
    if (!next) { count = 0; return; }
    const elapsed = Math.max(0, Math.min(0.05, dt));
    const steps = Math.max(1, Math.ceil(elapsed * 60)), h = elapsed / steps;
    setOperatingPoint(op, telemetry);
    seeds.prepare(op);
    const refill = count !== next || lastWind !== telemetry.windSpeed;
    lastWind = telemetry.windSpeed;
    if (refill) Object.assign(previous, target);
    orientFrame(from, previous.angle, previous.pitch, previous.bladeZ);
    for (let j = 1; j <= steps; j++) {
      const t = j / steps;
      for (const key of keys) pose[key] = previous[key] + t * (target[key] - previous[key]);
      orientFrame(to, pose.angle, pose.pitch, pose.bladeZ);
      for (let i = 0; i < next; i++) {
        const offset = 3 * i;
        const fresh = refill && j === 1;
        if (fresh || positions[offset+2] < pose.bladeZ + OUTLET) {
          seeds.place(p, i, pose.bladeZ, pose.towerY - 5 + BEAD_RADIUS, fresh);
          contact[i] = 0;
        } else {
          p.x = positions[offset]; p.y = positions[offset+1]; p.z = positions[offset+2];
        }
        const x = p.x, y = p.y, z = p.z;
        sampleField(velocity, x, y - ROTOR.y, pose.bladeZ - z, op);
        obstacleVelocity(velocity, p, pose);
        if (velocity.y < 0) velocity.y *= clamp01(y - (pose.towerY - 5 + BEAD_RADIUS));
        p.x += velocity.x * h;
        p.y += velocity.y * h;
        p.z += velocity.z * h;
        excludeSolids(p, pose);
        const hit = slidePastBlades(p, x, y, z, from, to, BEAD_RADIUS, h);
        contact[i] = hit ? 1 : Math.max(0, contact[i] - h / 0.20);
        positions[offset] = p.x;
        positions[offset + 1] = p.y;
        positions[offset + 2] = p.z;
        speedRatio[i] = op.u ? Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2) / op.u : 0;
      }
      count = next;
      const swap = from; from = to; to = swap;
    }
    Object.assign(previous, target);
    count = next;
  }
  return { positions, speedRatio, contact, update };
}
