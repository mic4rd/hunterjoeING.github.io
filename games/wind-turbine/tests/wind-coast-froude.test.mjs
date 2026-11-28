import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from './model-fixture.mjs';
import { TURBINE_TOUR_STEPS, computeTurbineTelemetry } from '../wt-data.js?v=0.2.0';
import { BETZ, betzCp, froudeValues } from '../wt-froude.js?v=0.2.0';
import { sampleSection, setOperatingPoint, initialPose } from '../wt-airflow.js?v=0.2.0';
import { ROTOR, RADIUS } from '../wt-rotor.js?v=0.2.0';
import { INLET_RADIUS } from '../wt-streams.js?v=0.2.0';
import { terrainHeight, BASE_Y, SEA_Y } from '../wt-terrain.js?v=0.2.0';
import { weatherAt, settle } from '../wt-weather.js?v=0.2.0';

const T = await import('three');
const { createMeasurements, frameTourContent } = await import('../wt-measurements.js?v=0.2.0');
const { createLandscape, createTerrainGeometry } = await import('../wt-landscape.js?v=0.2.0');
const { createWindParticles } = await import('../wt-wind-particles.js?v=0.2.0');
const near = (x, y, eps = 1e-8) => assert.ok(Math.abs(x - y) < eps, `${x} vs ${y}`);
const doc = { createElement: () => ({ getContext: () => ({ fillRect() { }, fillText() { } }) }) };

test('Disk speed is the mean, Betz peaks at one third and the lesson uses the live field and electric telemetry', () => {
  let peak = 0;
  for (let i = 1; i <= 3000; i++) if (betzCp(i / 3000) > betzCp(peak)) peak = i / 3000;
  near(peak, 1 / 3); near(betzCp(peak), 16 / 27); near(BETZ, 16 / 27);
  for (const speed of [0, 2, 8, 12, 20, 26]) {
    const t = computeTurbineTelemetry(speed), f = froudeValues(t);
    near(f.a, setOperatingPoint({}, t).a); near(f.vR, (f.v1 + f.v3) / 2);
    near(f.vR, f.v1 * sampleSection({}, 0, f.a).g); near(f.idealWake, speed / 3);
    near(f.idealRotor, 2 * speed / 3); near(f.area, Math.PI * 63 ** 2); near(f.rho, 1.225);
    near(f.windMW, .5 * 1.225 * Math.PI * 63 ** 2 * speed ** 3 / 1e6);
    near(f.betzMW, BETZ * f.windMW); near(f.electricMW, t.powerMW); near(f.cp, t.cp);
    assert.ok(f.electricMW <= f.betzMW);
    if (speed) { near(f.share, f.electricMW / f.betzMW); near(f.cp, f.electricMW / f.windMW); }
    else assert.equal(f.share, null);
    if (speed === 8 || speed === 12) { near(f.vR, f.idealRotor); near(f.v3, f.idealWake); }
    if (speed === 20) { near(f.electricMW, 3.6); assert.ok(f.a < .10 && f.share < .12); }
    if (speed === 26) { near(f.v3, speed); near(f.electricMW, 0); }
  }
});

test('Measurement rings follow the same sections on activation and remain in the tour camera frame', () => {
  const m = createMeasurements(doc), step = TURBINE_TOUR_STEPS[1];
  assert.equal(m.group.visible, false); assert.equal(step.lesson, 'froude');
  const original = [...m.group.children];
  for (const v of [8, 20, 26]) {
    const tel = computeTurbineTelemetry(v), a = froudeValues(tel).a;
    m.set(true, tel);
    for (const [j, xi] of [-1.70, 0, 1.85].entries()) {
      const ring = m.group.children[j * 2], badge = m.group.children[j * 2 + 1];
      near(ring.position.z, ROTOR.z - xi * RADIUS);
      near(ring.scale.x, sampleSection({}, xi * RADIUS, a).tube);
      assert.ok(badge.isSprite && m.group.visible && ring.material.transparent);
      for (const [w, h, top, bottom] of [[912, 740, 60, 363], [390, 778, 94, 350]]) {
        const camera = new T.PerspectiveCamera(42, w / h, .1, 320), target = new T.Vector3(...step.cameraTarget);
        camera.position.set(...step.cameraPos);
        frameTourContent(camera, w, h, top, bottom);
        camera.position.sub(target).multiplyScalar(Math.max(1, 1.12 * camera.zoom / camera.aspect)).add(target);
        camera.lookAt(target); camera.updateMatrixWorld(); ring.updateMatrixWorld();
        for (let i = 0; i < ring.geometry.attributes.position.count; i++) {
          const p = new T.Vector3().fromBufferAttribute(ring.geometry.attributes.position, i).applyMatrix4(ring.matrixWorld).project(camera);
          assert.ok(Math.abs(p.x) < 1 && (1 - p.y) * h / 2 > top && (1 - p.y) * h / 2 < bottom);
        }
        m.resizeLabels(h, camera);
        near(badge.scale.y * h * camera.projectionMatrix.elements[5] / 2, 20);
      }
    }
  }
  m.set(false, computeTurbineTelemetry(0));
  assert.equal(m.group.visible, false); assert.deepEqual(m.group.children, original);
});

test('Both drawn hill resolutions support foundation, transformer and entrance and agree with the shore height field', () => {
  const model = build(), get = n => model.root.getObjectByName(n), bounds = n => new T.Box3().setFromObject(get(n), true);
  model.root.updateMatrixWorld(true);
  const base = bounds('Turmfundament'), plinth = bounds('Trafosockel'), body = bounds('Trafogehäuse');
  near(plinth.max.y, body.min.y, 1e-5);
  near(base.min.y, BASE_Y, 1e-5);
  const steps = model.root.getObjectsByProperty('name', 'Eingangsstufe').map(o => new T.Box3().setFromObject(o, true));
  near(steps.at(-1).max.y, base.max.y, 1e-5);
  assert.ok(Math.abs(bounds('Türzarge').min.y - base.max.y) < .12);
  for (const low of [false, true]) {
    const hill = new T.Mesh(createTerrainGeometry(low)); hill.updateMatrixWorld();
    const ray = new T.Raycaster(); ray.ray.direction.set(0, -1, 0);
    function surface(x, z) {
      ray.ray.origin.set(x, 10, z);
      const hit = ray.intersectObject(hill)[0];
      near(hit.point.y, terrainHeight(x, z), 2e-5);
      return hit.point.y;
    }
    for (const box of [plinth, ...steps])
      for (const x of [box.min.x, box.max.x]) for (const z of [box.min.z, box.max.z]) near(surface(x, z), box.min.y, .002);
    for (let i = 0; i < 16; i++) near(surface(2.75 * Math.cos(i), 2.75 * Math.sin(i)), base.min.y, 1e-5);
    assert.ok(surface(-42.7, -10.4) < SEA_Y && surface(21.2, 8.6) > SEA_Y);
  }
});

test('Weather builds continuously, responds at the same rate across frame times and softens during inspection', () => {
  let previous = weatherAt(0);
  for (let v = .1; v <= 28; v += .1) {
    const w = weatherAt(v);
    for (const k of ['wave', 'foam', 'storm', 'cloud']) assert.ok(w[k] >= previous[k]);
    assert.ok(w.light <= previous.light); previous = w;
  }
  near(weatherAt(5).foam, 0); assert.ok(weatherAt(13).cloud > .9 && weatherAt(13).storm === 0);
  assert.ok(weatherAt(23).storm > .95 && weatherAt(23).foam > .8);
  near(settle(settle(5, 28, .1), 28, .1), settle(5, 28, .2)); assert.ok(settle(5, 28, .016) < 6);
  const scene = new T.Scene(), lights = { key: new T.DirectionalLight(), fill: new T.HemisphereLight() };
  const coast = createLandscape(scene, lights, false), [land, water, sky] = coast.group.children;
  const u = water.material.uniforms;
  assert.ok(land.receiveShadow && water.userData.aoOverlay && !sky.material.depthWrite);
  const beach = land.geometry, waves = water.geometry, haze = u.uHaze.value;
  for (let i = 0; i < 180; i++) coast.update(1 / 30, 25, false);
  const stormWave = u.uWave.value, strength = lights.key.intensity, horizon = scene.background.clone();
  coast.setTheme(true);
  for (let i = 0; i < 150; i++) coast.update(1 / 30, 25, true);
  assert.ok(u.uWave.value < stormWave * .4 && lights.key.intensity > strength && u.uDark.value === 1);
  assert.ok(u.uInspect.value > .99 && scene.background.r < horizon.r);
  assert.equal(u.uHaze.value, haze); assert.equal(land.geometry, beach);
  coast.setReduced(true);
  assert.ok(land.geometry.attributes.position.count < beach.attributes.position.count &&
    water.geometry.attributes.position.count < waves.attributes.position.count && water.material.defines.COARSE_SEA);
  const reduced = land.geometry; coast.setReduced(true); assert.equal(land.geometry, reduced);
});

test('Drawn bead volume has a bounded soft edge and a wider, bluer downstream section', () => {
  const view = createWindParticles({ navigator: {}, innerWidth: 1280, matchMedia: () => ({ matches: false, addEventListener() { } }) });
  view.applyTheme(true);
  const pose = initialPose(), camera = new T.PerspectiveCamera(); camera.position.set(47, 10, 22);
  view.update(1 / 60, computeTurbineTelemetry(9), pose, camera, true);
  const m = view.mesh.instanceMatrix.array, c = view.mesh.instanceColor.array;
  const sections = [[], []], shade = [[], []], sizes = [[], []];
  for (let i = 0; i < view.mesh.count; i++) {
    const k = i * 16, r = Math.hypot(m[k + 12], m[k + 13] - ROTOR.y), s = (pose.bladeZ - m[k + 14]) / RADIUS;
    assert.ok(r + m[k] <= INLET_RADIUS + 1e-6);
    if (Math.abs(s) < .25 && m[k + 13] > 0) {
      if (r < .7 * RADIUS) sizes[0].push(m[k]);
      if (r > 1.17 * RADIUS) sizes[1].push(m[k]);
    }
    if (Math.abs(s) < 1 || Math.abs(s) > 1.65 || m[k + 13] < 0) continue;
    const j = Number(s > 0);
    if (m[k] > .033) sections[j].push(r);
    if (r < .65 * RADIUS) shade[j].push(c[3 * i + 1] / c[3 * i + 2]);
  }
  const mean = arr => arr.reduce((sum, v) => sum + v, 0) / arr.length;
  assert.ok(sizes.every(arr => arr.length > 5) && mean(sizes[0]) > 4 * mean(sizes[1]));
  const outer = arr => arr.sort((a, b) => a - b)[Math.floor(arr.length * .9)];
  assert.ok(outer(sections[1]) > 1.25 * outer(sections[0]));
  assert.ok(mean(shade[0]) > 2 * mean(shade[1]));
});

test('The access tour frames the lower demonstration trip, door and ladder and reveals the yellow cage through the cut', () => {
  const model = build(), tel = computeTurbineTelemetry(9), tour = TURBINE_TOUR_STEPS.find(s => s.focusPart === 'serviceAccess');
  const eye = new T.Vector3(...tour.cameraPos), camera = new T.PerspectiveCamera(42);
  camera.position.copy(eye); camera.lookAt(...tour.cameraTarget); camera.updateMatrixWorld();
  frameTourContent(camera, 390, 778, 92, 461);
  model.setViewMode('cutaway'); model.setAccessTour(true);
  const find = n => model.root.getObjectByName(n);
  const cabin = find('Service-Lift'), ray = new T.Raycaster();
  const parts = [find('Türsturz'), find('Leiterholm'), find('Kabinentür')], p = new T.Vector3();
  for (let i = 0; i < 200; i++) {
    model.update(.05, tel);
    if (i % 20 !== 19) continue;
    model.root.updateMatrixWorld(true);
    for (const obj of parts) {
      obj.getWorldPosition(p);
      if (obj.name === 'Leiterholm') p.y = -9.8;
      p.project(camera);
      assert.ok(Math.abs(p.x) < .96 && (1 - p.y) * 389 > 92 && (1 - p.y) * 389 < 461, obj.name);
    }
    const visible = [];
    model.root.traverseVisible(o => { if (o.isMesh && o.material.opacity > .8) visible.push(o); });
    let hits = 0;
    cabin.traverse(o => {
      if (!o.isMesh) return;
      o.getWorldPosition(p);
      ray.set(eye, p.sub(eye).normalize());
      if (ray.intersectObjects(visible, false)[0]?.object.parent === cabin) hits++;
    });
    assert.ok(hits >= 5, 'visible structural members ' + hits);
  }
  assert.ok(find('Türgitter') && find('Dachkühler').children[0].count === 11);
});
