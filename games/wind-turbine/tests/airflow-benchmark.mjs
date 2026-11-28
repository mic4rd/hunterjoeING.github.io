// Run directly with Node. Measures warm CPU integration and filling instance buffers.
import './importmap.mjs';
import { computeTurbineTelemetry } from '../wt-data.js?v=0.2.0';
import { initialPose, particleCount, windBudget } from '../wt-airflow.js?v=0.2.0';
const { createWindParticles } = await import('../wt-wind-particles.js?v=0.2.0');
const { PerspectiveCamera } = await import('three');
const camera = new PerspectiveCamera();
camera.position.set(28, 7, 28);
for (const [width, speed, density] of [[1280, 12, 100], [1280, 20, 100], [390, 12, 100], [1280, 28, 200]]) {
  const view = createWindParticles({ innerWidth: width, navigator: {}, matchMedia: () => ({ matches: false, addEventListener() { } }) });
  view.setDensity(density);
  const tel = computeTurbineTelemetry(speed), pose = initialPose(), samples = [];
  const n = particleCount(speed, density, windBudget({}, width, false));
  for (let i = 0; i < 480; i++) {
    pose.angle -= tel.rotorRpm * Math.PI / 1800;
    pose.pitch = tel.pitchDeg * Math.PI / 180;
    const start = performance.now();
    view.update(1 / 60, tel, pose, camera, true);
    if (i >= 120) samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  console.log(width, speed, density, n, 'Median', samples[180].toFixed(2), 'ms, P95', samples[342].toFixed(2), 'ms');
}
