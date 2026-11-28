import * as THREE from 'three';
import { BEAD_RADIUS, MAX_PARTICLES, createAirflow, particleCount, windBudget } from './wt-airflow.js?v=0.2.0';
import { RADIUS } from './wt-rotor.js?v=0.2.0';

const SAMPLE = 0.045;
const clamp = value => Math.max(0, Math.min(1, value));

// Three equally timed snapshots suffice for two interpolated trailing beads.
export function createWindTrail(capacity) {
  const history = Array.from({ length: 3 }, () => new Float32Array(3 * capacity));
  const previous = new Float32Array(3 * capacity);
  let latest = 0, remainder = 0;
  function update(dt, field, count) {
    const xyz = field.positions;
    const elapsed = Math.max(0, Math.min(dt, 0.05));
    for (let t = SAMPLE - remainder; t <= elapsed; t += SAMPLE) {
      latest = (latest + 1) % 3;
      const dest = history[latest], f = t / elapsed;
      for (let k = 0; k < count * 3; k++) dest[k] = previous[k] + (xyz[k] - previous[k]) * f;
    }
    remainder = (remainder + elapsed) % SAMPLE;
    for (let i = 0; i < count; i++) {
      for (let k = i * 3; k < i * 3 + 3; k++) {
        previous[k] = xyz[k];
        if (field.born[i]) history[0][k] = history[1][k] = history[2][k] = xyz[k];
      }
    }
  }
  function read(out, i, depth) {
    const a = history[(latest + 3 - depth) % 3], b = history[(latest + 4 - depth) % 3];
    const k = 3 * i, f = remainder / SAMPLE;
    return out.set(a[k] + f * (b[k] - a[k]), a[k+1] + f * (b[k+1] - a[k+1]), a[k+2] + f * (b[k+2] - a[k+2]));
  }
  return { update, read };
}

export function createWindParticles(win) {
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  const budgetForDevice = () => windBudget(win.navigator, win.innerWidth, motion.matches);
  let budget = budgetForDevice(), density = 100;
  const capacity = Math.ceil(MAX_PARTICLES / 3);
  const field = createAirflow(capacity), trail = createWindTrail(capacity);
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 5),
    new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0, emissive: 0x071a36 }), MAX_PARTICLES);
  mesh.name = 'Wind';
  mesh.userData.windParticle = true;
  mesh.frustumCulled = false;
  mesh.count = 0;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const slow = new THREE.Color(0x073fbe), fast = new THREE.Color(0x37cfee), flash = new THREE.Color(0xe0ffff);
  mesh.setColorAt(0, fast);
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  const head = new THREE.Color(), ghost = new THREE.Color(), trailTint = new THREE.Color(0x7892ad);
  const point = new THREE.Vector3();
  const matrices = mesh.instanceMatrix.array;
  const matrixRange = { start: 0, count: 0 }, colorRange = { start: 0, count: 0 };
  function write(i, radius, color) {
    const m = i * 16;
    matrices[m] = matrices[m + 5] = matrices[m + 10] = radius;
    matrices[m + 12] = point.x;
    matrices[m + 13] = point.y;
    matrices[m + 14] = point.z;
    mesh.setColorAt(i, color);
  }
  function applyTheme(dark) {
    slow.setHex(dark ? 0x2767e9 : 0x073fbe);
    fast.setHex(dark ? 0x56dbff : 0x11a5d8);
    trailTint.setHex(dark ? 0x7892ad : 0xa4bfce);
  }
  function resize() { budget = budgetForDevice(); }
  motion.addEventListener('change', resize);

  function update(dt, telemetry, pose, camera, visible) {
    const copies = budget === MAX_PARTICLES ? 3 : 2;
    const heads = visible ? Math.floor(particleCount(telemetry.windSpeed, density, budget) / copies) : 0;
    field.update(dt, telemetry, pose, heads);
    trail.update(dt, field, heads);
    let count = 0;
    for (let i = 0; i < heads; i++) {
      if (!field.active[i]) continue;
      point.fromArray(field.positions, 3 * i);
      // Give the rotor neighbourhood prominence. Distant ends and near-ground
      // tracks taper out rather than filling the foreground or forming a floor.
      const end = clamp((2.65 - Math.abs(pose.bladeZ - point.z) / RADIUS) / 0.85);
      const floor = clamp((point.y - pose.towerY + 4.9) / 2.4);
      if (end * floor === 0) continue;
      const radius = Math.min(BEAD_RADIUS, 0.0026 * camera.position.distanceTo(point)) * end * floor;
      head.lerpColors(slow, fast, clamp((field.speedRatio[i] - 0.39) / 0.59));
      head.lerp(flash, field.contact[i] * 0.88);
      write(count++, radius, head);
      ghost.copy(head).lerp(trailTint, 0.52);
      for (let n = 1; n < copies; n++) {
        trail.read(point, i, n);
        const tailRadius = radius * (n === 1 ? 0.55 : 0.30);
        if (!field.trailClear(point, pose, tailRadius)) break;
        write(count++, tailRadius, ghost);
      }
    }
    mesh.count = count;
    mesh.visible = count > 0;
    if (!count) return;
    matrixRange.count = count * 16;
    colorRange.count = count * 3;
    mesh.instanceMatrix.updateRanges[0] = matrixRange;
    mesh.instanceColor.updateRanges[0] = colorRange;
    mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true;
  }
  return { mesh, update, resize, applyTheme, setDensity(value) { density = value; } };
}
