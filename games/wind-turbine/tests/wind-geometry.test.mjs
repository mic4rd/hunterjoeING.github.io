import assert from 'node:assert/strict';
import test from 'node:test';
import './importmap.mjs';
const T = await import('three');
import { build } from './model-fixture.mjs';
const { createWindParticles } = await import('../wt-wind-particles.js?v=0.2.0');
import { createAirflow, BEAD_RADIUS, initialPose } from '../wt-airflow.js?v=0.2.0';
import { computeTurbineTelemetry } from '../wt-data.js?v=0.2.0';

// Intersect the DRAWN triangles at this span station. Each quad gives two
// edges (a-b to b-d, then b-d to d-c), including the actual mesh diagonal.
function bladeClearance(point, geom) {
  const pos = geom.attributes.position;
  const ring = 25, span = point.y / pos.getY(pos.count - 1) * (pos.count / ring - 1);
  if (span <= 0 || span >= pos.count / ring - 1) return Infinity;
  const row = Math.floor(span), t = span - row;
  let crossings = 0, nearest = Infinity;
  function edge(ax, az, bx, bz) {
    if ((az > point.z) !== (bz > point.z) && ax + (point.z - az) * (bx - ax) / (bz - az) > point.x) crossings++;
    const dx = bx - ax, dz = bz - az;
    const u = Math.max(0, Math.min(1, ((point.x - ax) * dx + (point.z - az) * dz) / (dx * dx + dz * dz || 1)));
    nearest = Math.min(nearest, (point.x - ax - u * dx) ** 2 + (point.z - az - u * dz) ** 2);
  }
  function lerp(get, a, b) { return (1 - t) * get.call(pos, a) + t * get.call(pos, b); }
  for (let j = 0; j < ring - 1; j++) {
    const i = 6 * (row * (ring - 1) + j);
    const [a, b, d, , c] = geom.index.array.subarray(i, i + 6);
    const mx = lerp(pos.getX, d, b), mz = lerp(pos.getZ, d, b);
    edge(lerp(pos.getX, a, b), lerp(pos.getZ, a, b), mx, mz);
    edge(mx, mz, lerp(pos.getX, d, c), lerp(pos.getZ, d, c));
  }
  return (crossings % 2 ? -1 : 1) * Math.sqrt(nearest);
}

for (const speed of [7, 12, 20, 26.5]) {
  test(`Five seconds at ${speed} m/s clear the moving mesh, spinner and tapered tower`, () => {
    const turbine = build(), tel = computeTurbineTelemetry(speed);
    const dt = 1 / 30, count = 720, field = createAirflow(count);
    const blades = [], inv = [], local = new T.Vector3(), world = new T.Vector3();
    let spinner, tower;
    turbine.root.traverse(m => {
      if (m.userData.partId === 'blades' && m.geometry?.type === 'BufferGeometry') {
        blades.push(m); inv.push(new T.Matrix4());
      }
      if (m.geometry?.type === 'LatheGeometry') spinner = m;
      if (m.userData.partId === 'tower' && m.geometry?.parameters.height === 9.6) tower = m;
    });
    assert.equal(blades.length, 3);
    const pose = turbine.update(0, tel);
    field.update(0, tel, pose, count);
    // Targeted approaches along the leading shell, tower and all blade spans,
    // in addition to the regularly spaced stream pulses.
    for (let i = 0; i < 100; i++) {
      const phi = i % 3 * 2 * Math.PI / 3, r = 1.25 + (i / 100) * 7.9;
      field.positions.set([-r * Math.sin(phi), 0.25 + r * Math.cos(phi), pose.bladeZ + 0.27], i * 3);
    }
    for (let i = 100; i < 160; i++) field.positions.set([(i % 9 - 4) * 0.13, -9.8 + (i % 11) * 0.66, 2.3], 3 * i);
    for (let i = 160; i < 195; i++) field.positions.set([(i % 7 - 3) * 0.08, 0.28, pose.hubZ + 1.8], 3 * i);
    let closeBlade = 0, closeTower = 0, closeHub = 0;
    for (let frame = 0; frame < 150; frame++) {
      if (frame === 65) turbine.setViewMode('cutaway');
      if (frame === 90) turbine.setViewMode('xray');
      if (frame === 110) turbine.setViewMode('normal');
      const live = turbine.update(dt, tel);
      field.update(dt, tel, live, count);
      turbine.root.updateMatrixWorld(true);
      for (let k = 0; k < 3; k++) inv[k].copy(blades[k].matrixWorld).invert();
      const towerY = tower.getWorldPosition(world).y;
      const hub = spinner.getWorldPosition(world);
      const points = spinner.geometry.parameters.points;
      for (let i = 0; i < count; i++) {
        const x = field.positions[i * 3], y = field.positions[i * 3 + 1], z = field.positions[i * 3 + 2];
        const tz = y - towerY, sz = z - hub.z;
        if (Math.abs(tz) < 4.8) {
          const { radiusTop, radiusBottom, height } = tower.geometry.parameters;
          const gap = Math.hypot(x, z) - (radiusTop + (0.5 - tz / height) * (radiusBottom - radiusTop));
          if (gap < 0.5) closeTower++;
          assert.ok(gap >= -1e-5, `tower: ${gap} frame ${frame}`);
        }
        if (sz >= points[0].y && sz < points.at(-1).y) {
          const k = points.findIndex(pt => pt.y > sz);
          const low = points[k - 1], high = points[k];
          const rad = low.x + (sz - low.y) / (high.y - low.y) * (high.x - low.x);
          const gap = Math.hypot(x, y - hub.y) - rad;
          if (gap < 0.5) closeHub++;
          assert.ok(gap >= -1e-5, `spinner: ${gap} frame ${frame}`);
        }
        if (Math.abs(z - live.bladeZ) > 0.9) continue;
        for (let k = 0; k < 3; k++) {
          local.set(x, y, z).applyMatrix4(inv[k]);
          if (Math.abs(local.x) > 0.85 || Math.abs(local.z) > 0.85) continue;
          const gap = bladeClearance(local, blades[k].geometry);
          if (gap < 0.30) closeBlade++;
          assert.ok(gap >= BEAD_RADIUS - 1e-5, `blade ${k}: ${gap} frame ${frame} particle ${i} at ${local.toArray()}`);
        }
      }
    }
    assert.ok(closeBlade > 50 && closeHub > 20 && closeTower > 20, `encounters ${closeBlade}/${closeHub}/${closeTower}`);
    if (speed < 25) assert.ok(blades[0].parent.parent.parent.rotation.z < 0);
  });
}

test('Smoke-grey shells, selection, shadows and cable impulses follow the view', () => {
  const turbine = build(), tel = computeTurbineTelemetry(12), anchors = new T.Vector3();
  let spinner, pulses;
  turbine.root.traverse(m => {
    if (m.geometry?.type === 'LatheGeometry') spinner = m;
    if (m.geometry?.parameters?.radius === 0.11 && m.material.isMeshBasicMaterial) pulses = m.parent;
  });
  turbine.update(0.1, tel);
  const normal = spinner.material;
  for (const theme of ['dark', 'light']) {
    turbine.applyTheme(theme);
    turbine.setViewMode('xray');
    turbine.update(0.2, tel);
    assert.ok(spinner.material.transparent && !spinner.castShadow && spinner.children[0].visible);
    for (const mat of [spinner.material, spinner.children[0].material]) {
      assert.equal(mat.color.r, mat.color.g); assert.equal(mat.color.g, mat.color.b);
    }
    const plain = spinner.material;
    turbine.setSelectedPart('hub');
    turbine.update(0.01, tel);
    assert.ok(spinner.material.color.r > plain.color.r);
    assert.ok(pulses.visible);
    turbine.setFlowVisible(false);
    assert.ok(!pulses.visible);
    turbine.setFlowVisible(true);
    turbine.setSelectedPart(null);
    turbine.setViewMode('normal');
    turbine.update(0.2, tel);
    assert.equal(spinner.material, normal);
    assert.ok(spinner.castShadow && !spinner.children[0].visible);
  }
  turbine.setViewMode('cutaway');
  turbine.update(0.2, tel);
  assert.ok(turbine.getPartWorldAnchor('tower', anchors).y === -5.8);
});

test('One instanced batch reuses its buffers across density, calm, visibility and budget changes', () => {
  const motion = { matches: false, addEventListener() {} };
  const win = { innerWidth: 1280, navigator: {}, matchMedia: () => motion };
  const view = createWindParticles(win), camera = new T.PerspectiveCamera(), tel = computeTurbineTelemetry(28);
  camera.position.set(21, 5, 23);
  const pose = initialPose(), mesh = view.mesh, matrices = mesh.instanceMatrix, colors = mesh.instanceColor;
  view.setDensity(200); view.update(1/60, tel, pose, camera, true);
  assert.ok(mesh.isInstancedMesh && mesh.userData.windParticle && !mesh.castShadow);
  assert.ok(mesh.count > 1000 && mesh.count <= 4000);
  assert.equal(matrices.array[15], 1);
  assert.ok(matrices.array[0] > 0 && matrices.array[0] <= BEAD_RADIUS + 1e-7);
  win.innerWidth = 390; view.resize(); view.update(1/60, tel, pose, camera, true);
  assert.ok(mesh.count > 400 && mesh.count <= 1500);
  view.update(1/60, tel, pose, camera, false);
  assert.equal(mesh.count, 0);
  view.update(1/60, computeTurbineTelemetry(0), pose, camera, true);
  assert.equal(mesh.visible, false);
  assert.equal(mesh.instanceMatrix, matrices);
  assert.equal(mesh.instanceColor, colors);
});

test('Fixed ghost snapshots follow the travelled path across variable frame times and clear on respawn', async () => {
  const { createWindTrail } = await import('../wt-wind-particles.js?v=0.2.0');
  const trail = createWindTrail(1), out = new T.Vector3();
  const field = { positions: new Float32Array(3), born: new Uint8Array([1]) };
  trail.update(0, field, 1); field.born[0] = 0;
  let time = 0;
  for (const dt of [0.03, 0.05, 0.016, 0.05, 0.04, 0.015]) {
    time += dt;
    field.positions[2] = time * -8;
    trail.update(dt, field, 1);
    if (time < 0.12) continue;
    for (const depth of [1, 2]) {
      assert.equal(trail.read(out, 0, depth), out);
      assert.ok(Math.abs(out.z + (time - 0.045 * depth) * 8) < 1e-6);
    }
  }
  field.born[0] = 1; field.positions[2] = 34;
  trail.update(0.016, field, 1);
  assert.equal(trail.read(out, 0, 2).z, 34);
});

test('Visible trail beads and heads clear the current rendered blade sections and floor', () => {
  const model = build(), tel = computeTurbineTelemetry(12), camera = new T.PerspectiveCamera();
  camera.position.set(21, 5, 23);
  const view = createWindParticles({ innerWidth: 1280, navigator: {}, matchMedia: () => ({ matches:false, addEventListener(){} }) });
  view.setDensity(200);
  const blades = [];
  model.root.traverse(m => {
    if (m.userData.partId === 'blades' && m.geometry?.type === 'BufferGeometry') blades.push(m);
  });
  const local = new T.Vector3(), mat = new T.Matrix4();
  let encounters = 0;
  for (let t = 0; t < 150; t++) {
    const pose = model.update(1/30,tel);
    model.root.updateMatrixWorld(true);
    view.update(1/30,tel,pose,camera,true);
    const transforms = blades.map(b => b.matrixWorld.clone().invert());
    for (let i = 0; i < view.mesh.count; i++) {
      view.mesh.getMatrixAt(i,mat);
      const e = mat.elements, r = e[0];
      assert.ok(e[13] - r > -11.26);
      if (Math.abs(e[14] - pose.bladeZ) > 0.8) continue;
      for (let k = 0; k < blades.length; k++) {
        local.set(e[12],e[13],e[14]).applyMatrix4(transforms[k]);
        if (Math.abs(local.x) > 0.8 || Math.abs(local.z) > 0.8) continue;
        const gap = bladeClearance(local,blades[k].geometry);
        if (gap < 0.2) encounters++;
        assert.ok(gap >= r - 1e-5, `drawn instance ${i} at frame ${t}, gap ${gap}, radius ${r}`);
      }
    }
  }
  assert.ok(encounters > 100);
});
