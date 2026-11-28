import assert from 'node:assert/strict';
import test from 'node:test';
import { computeTurbineTelemetry } from '../wt-data.js?v=0.2.0';
import { RADIUS, ROTOR } from '../wt-rotor.js?v=0.2.0';
import {
  setOperatingPoint, sampleField, sampleSection, windBudget, particleCount,
  createAirflow, initialPose
} from '../wt-airflow.js?v=0.2.0';
import { orientFrame, contactFrame, slidePastBlades } from '../wt-blade-contact.js?v=0.2.0';

import { INLET, OUTLET, STREAM_COUNT, createStreamSeeder } from '../wt-streams.js?v=0.2.0';

const operating = wind => setOperatingPoint({}, computeTurbineTelemetry(wind));
const near = (a, b, tolerance) => assert.ok(Math.abs(a - b) < tolerance, `${a} vs ${b}`);

test('Operating point follows cut-in, rated power and storm braking', () => {
  for (const v of [0, 2, 3, 25.5, 28]) assert.equal(operating(v).a, 0);
  assert.ok(operating(4).a < operating(6).a);
  for (const v of [6, 10.5, 12]) assert.equal(operating(v).a, 1/3);
  assert.ok(operating(13).a > operating(19).a && operating(19).a > operating(25).a);
  near(operating(12).u / operating(6).u, 2, 1e-10);
});

test('Axial velocity and tube area conserve flux throughout the core', () => {
  const op = operating(10);
  const section = s => sampleSection({}, s, op.a);
  let lastRadius = 0, lastSpeed = 10;
  for (const xi of [-100, -3.5, -1, -0.1, 0, 0.1, 1, 3, 100]) {
    const s = RADIUS * xi, tube = section(s).tube, field = {};
    sampleField(field, tube / 2, 0, s, op);
    assert.ok(-field.z < lastSpeed && tube > lastRadius);
    near(tube ** 2 * -field.z, RADIUS ** 2 * op.u * (1 - op.a), 1e-8);
    const dr = (section(s + 0.001).tube - section(s - 0.001).tube) / 0.002;
    near(field.x / -field.z, dr / 2, 1e-8);
    lastRadius = tube; lastSpeed = -field.z;
  }
  near(section(-100 * RADIUS).g, 1, 0.0001);
  near(section(0).g, 1 - op.a, 1e-12);
  near(section(100 * RADIUS).g, 1 - 2 * op.a, 0.0001);
  near(section(0).tube, RADIUS, 1e-10);
  const outside = {};
  sampleField(outside, 1.2 * RADIUS, 0, 0, op);
  assert.equal(-outside.z, op.u);
  assert.ok(outside.x > 0);
});

test('The wake rotates opposite to the negative Z rotor, then decays', () => {
  const field = {}, op = operating(10.5);
  sampleField(field, 4, 0, -2, op);
  assert.equal(field.y, 0);
  sampleField(field, 4, 0, RADIUS, op);
  const swirl = field.y;
  assert.ok(swirl > 0 && swirl * ROTOR.spinSign < 0);
  sampleField(field, 4, 0, 3 * RADIUS, op);
  assert.ok(field.y > 0 && field.y < swirl);
  sampleField(field, RADIUS * 2, 0, RADIUS, op);
  assert.equal(field.y, 0);
  sampleField(field, 4, 0, RADIUS, operating(26));
  assert.equal(field.y, 0);
});

test('Wind, density, device limits and reduced motion govern the active count', () => {
  for (const [cores, memory, width, motion] of [[4, 8, 1200, false], [8, 4, 1200, false],
    [8, 8, 768, false], [8, 8, 1200, true]]) {
    assert.equal(windBudget({ hardwareConcurrency: cores, deviceMemory: memory }, width, motion), 1500);
  }
  assert.equal(windBudget({}, 769, false), 4000);
  for (const cap of [1500, 4000]) {
    assert.equal(particleCount(0, 200, cap), 0);
    const breeze = particleCount(6, 100, cap);
    assert.ok(breeze >= 300 && breeze < particleCount(12, 100, cap));
    near(particleCount(6, 25, cap), breeze / 4, 1);
    near(particleCount(6, 200, cap), breeze * 2, 2);
    assert.equal(particleCount(28, 200, cap), cap);
  }
});

test('Advection clamps long frames, recycles upstream and diverts wind around the tower', () => {
  const turbine = computeTurbineTelemetry(26), pose = initialPose(), field = createAirflow(4);
  field.update(0, turbine, pose, 4);
  field.positions.set([7, 0, pose.bladeZ + INLET, 6, 0, pose.bladeZ + OUTLET - 1,
    0.75, -5, 2.5, 0.8, -5, -2]);
  field.update(4, turbine, pose, 4);
  near(field.positions[2], pose.bladeZ + INLET - operating(26).u * 0.05, 0.001);
  assert.ok(field.positions[6] > 0.75);
  assert.ok(field.speedRatio[3] < 1);
  assert.equal(field.active[1], 0);
  for (let k = 0; k < 140 && !field.active[1]; k++) field.update(0.05, turbine, pose, 4);
  assert.ok(field.active[1] && field.positions[5] > pose.bladeZ + 3 * RADIUS);
});

test('A segment crossing both blade faces slides on its entry side', () => {
  const a = contactFrame();
  orientFrame(a, 0, 0, ROTOR.z);
  const p = { x: -0.29, y: 4.6, z: ROTOR.z - 0.5 };
  assert.ok(slidePastBlades(p, -0.26, p.y, ROTOR.z + 0.5, a, a, 0.055, 1/60));
  assert.ok(p.z > ROTOR.z + 0.07);
  assert.ok(p.x < -0.29);
});

test('Fourteen core spokes and two bypass spokes launch together within 1.31 R', () => {
  const seed = createStreamSeeder(sampleField), p = {};
  seed.prepare(operating(10.5));
  let bypass = 0;
  for (let i = 0; i < STREAM_COUNT; i++) {
    seed.place(p, i, 0, ROTOR.z);
    near(p.z, ROTOR.z + INLET, 1e-9);
    const r = Math.hypot(p.x, p.y - ROTOR.y);
    if (r > RADIUS) bypass++;
    assert.ok(r <= 1.31 * RADIUS + 1e-9);
    assert.ok(p.y > -8);
  }
  assert.equal(bypass, 2);
  assert.equal(STREAM_COUNT, 16);
});

test('The first frame already resolves compressed spacing, widening and counter-rotation', () => {
  const groups = 80, field = createAirflow(groups * STREAM_COUNT);
  field.update(0, computeTurbineTelemetry(10.5), initialPose(), groups * STREAM_COUNT);
  const samples = [];
  for (let row = 0; row < groups; row++) {
    const k = (row * STREAM_COUNT) * 3;
    const x = field.positions[k], y = field.positions[k + 1] - ROTOR.y, z = field.positions[k + 2];
    samples.push({ z, r: Math.hypot(x, y), theta: Math.atan2(y, x) });
    near(field.positions[k + 5], z, 1e-5);
    assert.ok(y + ROTOR.y > -11.26);
  }
  const nearZ = s => samples.findIndex(p => p.z < ROTOR.z - s * RADIUS);
  const before = nearZ(-1.4), behind = nearZ(1.4), gap = i => samples[i].z - samples[i+1].z;
  assert.ok(gap(behind) < 0.55 * gap(before));
  assert.ok(samples[behind].r > samples[before].r * 1.25);
  assert.ok(samples[behind].theta > samples[before].theta + 0.2);
});

test('Cohorts stay synchronized over two complete trips; blade contact flashes and fades', () => {
  const tel = computeTurbineTelemetry(12), pose = initialPose(), n = 160, field = createAirflow(n);
  field.update(0, tel, pose, n);
  field.positions.set([-0.12, 4.6, pose.bladeZ + 0.22]);
  let flashed = false, faded = false, launches = 0;
  for (let i = 0; i < 620; i++) {
    field.update(0.05, tel, pose, n);
    if (field.contact[0] > 0.9) flashed = true;
    if (flashed && field.contact[0] === 0) faded = true;
    if (field.born[0]) {
      launches++;
      assert.equal(field.born[1], 1);
      near(field.positions[2], field.positions[5], 1e-5);
    }
  }
  assert.ok(flashed && faded);
  assert.ok(launches >= 2);
});
