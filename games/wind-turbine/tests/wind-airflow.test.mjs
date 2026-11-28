import assert from 'node:assert/strict';
import test from 'node:test';
import { computeTurbineTelemetry } from '../wt-data.js?v=0.2.0';
import { RADIUS, ROTOR } from '../wt-rotor.js?v=0.2.0';
import {
  setOperatingPoint, sampleField, sampleSection, windBudget, particleCount,
  createAirflow, initialPose
} from '../wt-airflow.js?v=0.2.0';
import { orientFrame, contactFrame, slidePastBlades } from '../wt-blade-contact.js?v=0.2.0';

import { INLET, OUTLET, INLET_RADIUS, createVolumeSeeder } from '../wt-streams.js?v=0.2.0';

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
    assert.equal(windBudget({ hardwareConcurrency: cores, deviceMemory: memory }, width, motion), 4600);
  }
  assert.equal(windBudget({}, 769, false), 14400);
  for (const cap of [4600, 14400]) {
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
  assert.ok(field.positions[5] > pose.bladeZ + 3 * RADIUS);

});

test('A segment crossing both blade faces slides on its entry side', () => {
  const a = contactFrame();
  orientFrame(a, 0, 0, ROTOR.z);
  const p = { x: -0.29, y: 4.6, z: ROTOR.z - 0.5 };
  assert.ok(slidePastBlades(p, -0.26, p.y, ROTOR.z + 0.5, a, a, 0.055, 1/60));
  assert.ok(p.z > ROTOR.z + 0.07);
  assert.ok(p.x < -0.29);
});

test('Continuous disk samples cover equal-area annuli, sectors, hub and bypass', () => {
  const seed = createVolumeSeeder(sampleField), p = {}, bins = Array(8*12).fill(0);
  seed.prepare(operating(10.5));
  for (let i=0;i<9600;i++) {
    seed.place(p,i,ROTOR.z,-20,false);
    near(p.z, ROTOR.z+INLET,1e-8);
    const dy = p.y-ROTOR.y, area = (p.x*p.x+dy*dy)/INLET_RADIUS**2;
    assert.ok(area<1);
    const azimuth = (Math.atan2(dy,p.x)/(2*Math.PI)+1)%1;
    bins[12*Math.floor(area*8)+Math.floor(azimuth*12)]++;
  }
  assert.ok(bins.every(n => n >= 85 && n <= 115), JSON.stringify(bins));
  for (let i=0;i<10000;i++) {
    seed.place(p,i,ROTOR.z,-11.165,false);
    assert.ok(p.y >= -11.165 && Math.hypot(p.x,p.y-ROTOR.y)<=INLET_RADIUS+1e-6);
  }
});

test('The filled first frame has more slow core beads per axial slice, a wider wake and free bypass', () => {
  const n=12000, field=createAirflow(n), tel=computeTurbineTelemetry(10.5);
  field.update(0,tel,initialPose(),n);
  const slices=[[],[]];
  let bypass=0;
  for (let i=0;i<n;i++) {
    const x=field.positions[i*3], y=field.positions[i*3+1]-ROTOR.y;
    const xi=(ROTOR.z-field.positions[i*3+2])/RADIUS;
    const r=Math.hypot(x,y)/RADIUS;
    if (Math.abs(xi+1.5)<0.35 && r<0.78) slices[0].push(r);
    if (Math.abs(xi-1.5)<0.35 && field.speedRatio[i]<0.49) slices[1].push(r);
    if (r>1.24 && field.speedRatio[i]>0.98) bypass++;
  }
  assert.ok(slices[0].length>200 && slices[1].length>slices[0].length*1.6);
  assert.ok(Math.max(...slices[1])>Math.max(...slices[0])*1.4);
  assert.ok(bypass>300);
});

test('Independent recycling and contact light reuse all simulation buffers', () => {
  const tel=computeTurbineTelemetry(12), pose=initialPose(), n=380, field=createAirflow(n);
  const buffers=[field.positions,field.speedRatio,field.contact];
  field.update(0,tel,pose,n);
  field.positions.set([-0.12,4.6,pose.bladeZ+0.22]);
  let flashed=false, faded=false, launches=0, lastZ=field.positions[5];
  for (let i=0;i<620;i++) {
    field.update(0.05,tel,pose,n);
    if (field.contact[0]>0.9) flashed=true;
    if (flashed && !field.contact[0]) faded=true;
    if (field.positions[5]-lastZ>INLET) {
      launches++;
      assert.ok(Math.abs(field.positions[2]-field.positions[5])>0.1);
    }
    lastZ=field.positions[5];
  }
  assert.ok(flashed && faded && launches>=2);
  [field.positions,field.speedRatio,field.contact].forEach((b,i)=>assert.equal(b,buffers[i]));
});
