import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from './model-fixture.mjs';
import { computeTurbineTelemetry } from '../wt-data.js?v=0.2.0';
const T = await import('three');
const eps = 1e-5;
const near = (a, b, tol = eps) => assert.ok(Math.abs(a - b) < tol, a + ' vs ' + b);
const world = o => o.getWorldPosition(new T.Vector3());
const box = o => new T.Box3().setFromObject(o, true);
const all = (root, name) => root.getObjectsByProperty('name', name);

// Read a face contour from the actual indexed gear mesh, in its local XY plane.
function contour(wheel, inner = false) {
  const attr = wheel.geometry.attributes.position, points = [];
  for (let i = inner ? 0 : 1; i < attr.count; i += 4) points.push(new T.Vector3().fromBufferAttribute(attr, i));
  return points;
}
function radii(wheel, inner = false) {
  const r = contour(wheel, inner).map(p => Math.hypot(p.x, p.y));
  return { min: Math.min(...r), max: Math.max(...r) };
}
function crossings(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

test('Four coaxial azimuth drives flank the ring, tangent at pitch and clear of the flange and carrier', () => {
  const { root } = build(); root.updateMatrixWorld(true);
  const ring = root.getObjectByName('Azimutkranz'), motors = all(root, 'Azimutmotor'), pins = all(root, 'Azimutritzel');
  const upper = all(root, 'Azimutgetriebe'), bed = root.getObjectByName('Maschinenträger');
  const rc = world(ring), profile = contour(ring), ringRoot = radii(ring).min;
  const table = box(bed), rb = box(ring), inv = ring.matrixWorld.clone().invert();
  assert.equal(pins.length, 4); assert.equal(motors.length, 4);
  const tower = root.getObjectsByProperty('isMesh', true).find(o => o.userData.partId === 'tower' && o.geometry.parameters?.height === 9.6);
  assert.ok(rb.min.y >= box(tower).max.y - eps);
  near(rb.min.y, box(root.getObjectByName('Turmkopfflansch')).max.y);
  for (let i = 0; i < 4; i++) {
    const p = pins[i], pc = world(p), mc = world(motors[i]);
    near(pc.x, mc.x); near(pc.z, mc.z); near(pc.y, rc.y);
    const distance = Math.hypot(pc.x - rc.x, pc.z - rc.z);
    near(distance, 0.98 + 0.21);
    assert.ok(ringRoot + radii(p).min < distance);
    assert.ok(radii(ring).max + radii(p).max > distance);
    near(box(upper[i]).min.y, table.max.y);
    assert.ok(box(motors[i]).min.y > rb.max.y && box(p).max.y < table.min.y);
    assert.ok(box(p).min.y > box(root.getObjectByName('Turmkopfflansch')).max.y);
    // The teeth may enter the opposing gaps. Their actual flanks must stay outside solid material.
    const teeth = contour(p).map(v => v.applyMatrix4(p.matrixWorld).applyMatrix4(inv));
    for (let j = 0; j < teeth.length; j++) {
      for (const t of [0, 0.25, 0.5, 0.75]) {
        const q = teeth[j].clone().lerp(teeth[(j + 1) % teeth.length], t);
        assert.ok(!crossings(profile, q.x, q.y), 'yaw flank clips the ring');
      }
    }
    const ray = new T.Raycaster(new T.Vector3(mc.x, mc.y, mc.z), new T.Vector3(0, -1, 0));
    assert.equal(ray.intersectObject(bed, false).length, 0, 'shaft opening through bedplate');
  }
});

test('Carrier, four orbiting planets, sun, both counter-rotating meshes and output follow telemetry', () => {
  const m = build(), o = n => m.root.getObjectByName(n);
  const c = o('Planetenträger'), sun = o('Sonne'), ring = o('Hohlrad'), planets = all(m.root, 'Planet');
  const a = o('Stirnrad 1'), b = o('Ritzel 1'), d = o('Stirnrad 2'), e = o('Ritzel 2');
  assert.equal(planets.length, 4);
  const tel = computeTurbineTelemetry(12), dt = 1 / 60, step = -tel.rotorRpm * Math.PI / 30 * dt;
  const w = [c, sun, ring, planets[0], a, b, d, e, o('Schnelle Welle'), o('Bremsscheibe'), o('Kupplung'), o('Generatorläufer')];
  for (let t = 0; t < 65; t++) {
    const previous = w.map(o => o.rotation.z);
    m.update(dt, tel); m.root.updateMatrixWorld(true);
    const speeds = w.map((o, i) => (o.rotation.z - previous[i]) / step);
    [1, 5.75, 0, -76 / 30, 5.75, -23, -23, 92, 92, 92, 92, tel.generatorRpm / tel.rotorRpm].forEach((v, i) => near(v, speeds[i]));
    const centre = world(sun), offset = 0.009 * (16 + 30);
    for (let i = 0; i < 4; i++) {
      const p = world(planets[i]), angle = c.rotation.z + i * Math.PI / 2;
      near(p.x - centre.x, offset * Math.cos(angle)); near(p.y - centre.y, offset * Math.sin(angle));
      near(offset, 0.009 * (76 - 30)); near(p.z, centre.z);
    }
  }
  const count = wheel => contour(wheel).length / 5;
  assert.deepEqual([sun, planets[0], ring, a, b, d, e].map(count), [16, 30, 76, 68, 17, 68, 17]);
  for (const [large, pin] of [[a, b], [d, e]]) {
    near(world(large).distanceTo(world(pin)), 0.007 * (count(large) + count(pin)));
    near(world(large).z, world(pin).z);
    assert.ok(radii(large).min + radii(pin).min < 0.595);
  }
  near(world(a).x, world(sun).x); near(world(a).y, world(sun).y);
  near(world(b).x, world(d).x); near(world(b).y, world(d).y);
  const parked = e.rotation.z; m.update(dt, computeTurbineTelemetry(26)); near(e.rotation.z, parked);
});

test('Gear envelopes clear housing, bedplate, neighbors and brake, shaft passages meet end to end', () => {
  const m = build(), o = n => m.root.getObjectByName(n);
  m.setViewMode('cutaway'); m.update(0.2, computeTurbineTelemetry(12)); m.root.updateMatrixWorld(true);
  const shell = o('Getriebedeckel'), h = world(shell);
  assert.equal(shell.visible, false);
  const rs = shell.geometry.parameters.radiusTop * Math.cos(Math.PI / shell.geometry.parameters.radialSegments);
  const stages = [o('Hohlrad'), o('Stirnrad 1'), o('Ritzel 1'), o('Stirnrad 2'), o('Ritzel 2')];
  for (const gear of stages) {
    const p = world(gear);
    assert.ok(Math.hypot(p.x - h.x, p.y - h.y) + radii(gear).max < rs);
  }
  assert.ok(box(stages[0]).min.z > box(stages[1]).max.z);
  assert.ok(box(stages[1]).min.z > box(stages[3]).max.z);
  assert.ok(box(shell).min.y > box(o('Maschinenträger')).max.y);
  assert.ok(h.x + shell.geometry.parameters.radiusTop < 1.18);
  const bedTop = box(o('Maschinenträger')).max.y;
  for (const foot of all(m.root, 'Getriebefuß')) near(box(foot).min.y, bedTop);
  for (const name of ['Azimutmotor', 'Azimutgetriebe']) for (const motor of all(m.root, name)) {
    const bounds = box(motor);
    if (bounds.min.z > box(shell).max.z || bounds.max.z < box(shell).min.z) continue;
    const dx = Math.max(bounds.min.x - h.x, h.x - bounds.max.x, 0);
    assert.ok(Math.hypot(dx, h.y - bounds.max.y) > shell.geometry.parameters.radiusTop);
  }
  assert.ok(box(shell).min.z > box(o('Bremsscheibe')).max.z);
  near(box(o('Hauptwelle')).min.z, box(o('Trägernabe')).max.z);
  near(box(o('Abtriebszapfen')).min.z, box(o('Schnelle Welle')).max.z);
  near(box(o('Schnelle Welle')).min.z, world(o('Generatorläufer')).z + 0.78);
  assert.ok(box(o('Kupplung')).max.z < box(o('Bremsscheibe')).min.z);
  assert.ok(box(o('Kupplung')).min.z > world(o('Generatorläufer')).z + 0.925);
  for (const n of ['Bremsscheibe', 'Kupplung']) {
    const obj = o(n), c = world(obj), ray = new T.Raycaster(new T.Vector3(c.x + 0.109, c.y, c.z + 1), new T.Vector3(0, 0, -1));
    assert.equal(ray.intersectObject(obj, false).length, 0);
  }
  m.setViewMode('xray'); m.update(0.2, computeTurbineTelemetry(12));
  assert.ok(shell.visible && shell.material.transparent);
});

test('Lift and ladder clear the platform openings over the full tower height', () => {
  const m = build(), o = n => m.root.getObjectByName(n), tel = computeTurbineTelemetry(9);
  m.setViewMode('cutaway'); m.update(0.2, tel); m.root.updateMatrixWorld(true);
  assert.equal(o('Turmtür').visible, false);
  const decks = all(m.root, 'Ruhepodest'), lift = o('Service-Lift'), rails = all(m.root, 'Leiterholm');
  assert.equal(decks.length, 3); assert.equal(rails.length, 2); assert.equal(o('Leitersprossen').count, 45);
  assert.ok(box(rails[0]).max.y > -1.47 && box(rails[0]).min.y < -10.7);
  const cab = box(lift), ladder = box(rails[0]).union(box(rails[1]));
  for (const deck of decks) {
    near(world(deck).y, world(o('Eingangspodest')).y + 4.54 + deck.position.y);
    for (const b of [cab, ladder]) for (const x of [b.min.x, b.max.x]) for (const z of [b.min.z, b.max.z]) {
      const ray = new T.Raycaster(new T.Vector3(x, world(deck).y + 1, z), new T.Vector3(0, -1, 0));
      assert.equal(ray.intersectObject(deck, false).length, 0);
    }
  }
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < 790; i++) { m.update(0.05, tel); min = Math.min(min, lift.position.y); max = Math.max(max, lift.position.y); }
  assert.ok(min < -4.45 && max > 4.60 && lift.position.y < -3.9);
  m.setViewMode('xray'); m.update(0.2, tel); assert.ok(o('Turmtür').material.transparent && lift.visible);
});

test('Three tangential open cups turn with wind and the mast vane points upstream', () => {
  const m = build(), star = m.root.getObjectByName('Schalenstern'), vane = m.root.getObjectByName('Windfahne');
  const cups = all(m.root, 'Halbkugelschale');
  assert.equal(cups.length, 3);
  for (const cup of cups) { near(cup.geometry.parameters.thetaLength, Math.PI / 2); near(cup.geometry.parameters.phiLength, 2 * Math.PI); }
  const angle = star.rotation.y;
  m.update(0.05, computeTurbineTelemetry(0)); near(star.rotation.y, angle);
  m.update(0.05, computeTurbineTelemetry(5)); const delta = star.rotation.y - angle;
  assert.ok(delta < 0, 'closed cup surfaces lead in the direction of rotation');
  m.update(0.05, computeTurbineTelemetry(10)); near(star.rotation.y - angle, 3 * delta);
  assert.ok(vane.rotation.y !== 0 && Math.abs(vane.rotation.y) < 0.07);
  assert.ok(world(m.root.getObjectByName('Pfeilspitze')).z > world(vane).z);
});
