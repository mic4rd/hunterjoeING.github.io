import * as THREE from 'three';
import { MAX_PARTICLES, createAirflow, particleCount, windBudget } from './wt-airflow.js?v=0.2.0';
import { ROTOR, RADIUS } from './wt-rotor.js?v=0.2.0';

const clamp = value => Math.max(0, Math.min(1, value));

export function createWindParticles(win) {
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  const budgetForDevice = () => windBudget(win.navigator, win.innerWidth, motion.matches);
  let budget = budgetForDevice(), density = 100;
  const field = createAirflow(MAX_PARTICLES);
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4),
    new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0, emissive: 0x071a36 }), MAX_PARTICLES);
  mesh.name = 'Wind';
  mesh.userData.windParticle = true;
  mesh.frustumCulled = false;
  mesh.count = 0;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const slow = new THREE.Color(0x073fbe), fast = new THREE.Color(0x37cfee), flash = new THREE.Color(0xe0ffff);
  mesh.setColorAt(0, fast);
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  const head = new THREE.Color();
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
  }
  function resize() { budget = budgetForDevice(); }
  motion.addEventListener('change', resize);

  function update(dt, telemetry, pose, camera, visible) {
    const heads = visible ? particleCount(telemetry.windSpeed, density, budget) : 0;
    field.update(dt, telemetry, pose, heads);
    let count = 0;
    for (let i = 0; i < heads; i++) {
      point.fromArray(field.positions, 3 * i);
      // Give the rotor neighbourhood prominence. Distant ends and near-ground
      // tracks taper out rather than filling the foreground or forming a floor.
      const downstream = (pose.bladeZ - point.z) / RADIUS;
      const end = clamp((downstream < 0 ? 2.15 + downstream : 2.35 - downstream) / 0.75);
      const floor = clamp((point.y - pose.towerY + 4.9) / 2.4);
      if (end * floor === 0) continue;
      const dy = point.y - ROTOR.y;
      const rim = clamp((point.x * point.x + dy * dy) / (RADIUS * RADIUS) - 0.9);
      const radius = Math.min(0.073, 0.0022 * camera.position.distanceTo(point)) * end * floor * (1 - 0.55 * rim);
      head.lerpColors(slow, fast, clamp((field.speedRatio[i] - 0.39) / 0.59));
      head.lerp(flash, field.contact[i] * 0.88);
      write(count++, radius, head);
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
