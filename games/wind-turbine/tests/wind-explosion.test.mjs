import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { html } from './importmap.mjs';
import { build } from './model-fixture.mjs';
import { terrainHeight, highestGround } from '../wt-terrain.js?v=0.2.0';
import { froudePanel, updateFroudePanel } from '../wt-froude-panel.js?v=0.2.0';
import * as data from '../wt-data.js?v=0.2.0';
import { createAccidentControls } from '../wt-accident-controls.js?v=0.2.0';
const T = await import('three');
const { frameTourContent } = await import('../wt-measurements.js?v=0.2.0');

function record(root) {
  const result = new Map();
  root.traverse(n => result.set(n, {
    p: n.position.toArray(), r: n.rotation.toArray(), s: n.scale.toArray(), visible: n.visible,
    parent: n.parent?.uuid, geometry: n.geometry?.uuid, material: n.material?.uuid, alpha: n.material?.opacity,
    transparent: n.material?.transparent, write: n.material?.depthWrite, shadow: n.castShadow
  }));
  return result;
}

test('Overrev and burst use the actual assemblies, land on the hill and repair exactly', () => {
  const model = build(), tel = data.computeTurbineTelemetry(26.5), accident = model.accident;
  const bounds = new T.Box3(), origin = new T.Vector3();
  const blades = [], debris = [];
  model.root.traverse(o => {
    if (o.isMesh && o.userData.partId && !['transformer', 'tower', 'serviceAccess'].includes(o.userData.partId)) debris.push(o);
    if (o.userData.partId === 'blades' && o.geometry?.type === 'BufferGeometry') blades.push(o);
  });
  assert.equal(blades.length, 3);
  for (const mode of ['xray', 'cutaway']) {
    model.setViewMode(mode);
    model.update(0.2, tel);
    const before = record(model.root);
    assert.equal(accident.state.phase, 'idle');
    accident.start(tel.rotorRpm);
    for (let i = 0; i < 55; i++) model.update(1/30, tel);
    assert.equal(accident.state.phase, 'overrev');
    assert.ok(accident.state.rpm > 45 && blades[0].parent.rotation.y < 0.001);
    if (mode === 'xray') {
      accident.repair();
      assert.deepEqual(record(model.root), before);
      accident.start(tel.rotorRpm);
    }
    for (let i = 0; i < 75 && accident.state.phase === 'overrev'; i++) model.update(1/30, tel);
    assert.equal(accident.state.phase, 'blown');
    assert.equal(accident.state.rpm, 88);
    let sawSmoke = false, sawDust = false;
    const fx = model.root.getObjectByName('Rauch und Staub'), matrix = new T.Matrix4();
    for (let i = 0; i < 320; i++) {
      model.update(1/30, tel); model.root.updateMatrixWorld(true);
      for (let j = 0; j < fx.count; j++) {
        fx.getMatrixAt(j, matrix);
        sawSmoke ||= matrix.elements[13] > 0;
        sawDust ||= matrix.elements[13] < -9;
      }
      for (const m of debris) {
        if (!m.visible) continue;
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        bounds.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);
        const floor = highestGround(bounds.min.x, bounds.min.z, bounds.max.x, bounds.max.z);
        if (bounds.min.y < floor - 1e-5) {
          const attr = m.geometry.attributes.position;
          for (let j = 0; j < attr.count; j++) {
            origin.fromBufferAttribute(attr, j).applyMatrix4(m.matrixWorld);
            assert.ok(origin.y >= terrainHeight(origin.x, origin.z) - 1e-5, 'mesh intersects hill');
          }
        }
      }
    }
    assert.ok(sawSmoke && sawDust);
    for (const blade of blades) {
      const attr = blade.geometry.attributes.position;
      let gap = Infinity;
      for (let j = 0; j < attr.count; j++) {
        origin.fromBufferAttribute(attr, j).applyMatrix4(blade.matrixWorld);
        gap = Math.min(gap, origin.y - terrainHeight(origin.x, origin.z));
      }
      assert.ok(gap >= -1e-5 && gap < .18, 'resting blade clearance ' + gap);
    }
    assert.ok(blades[0].getWorldPosition(origin).distanceTo(blades[1].getWorldPosition(new T.Vector3())) > 3);
    assert.ok(accident.repair());
    assert.equal(accident.state.phase, 'idle');
    assert.deepEqual(record(model.root), before);
    assert.equal(accident.repair(), false);
  }
});

test('The eight tour stations end at the transformer in cutaway and never trigger the accident', () => {
  const steps = data.TURBINE_TOUR_STEPS;
  assert.equal(steps.length, 8);
  assert.equal(steps[1].lesson, 'froude');
  assert.deepEqual(steps.map(s => s.step), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.ok(steps.every(s => ['normal','cutaway','xray'].includes(s.viewMode)));
  assert.equal(data.TURBINE_PARTS.length, 13);
  assert.equal(steps.at(-2).focusPart, 'serviceAccess');
  assert.equal(steps.at(-2).viewMode, 'cutaway');
  assert.equal(steps.at(-1).focusPart, 'transformer');
  assert.equal(steps.at(-1).viewMode, 'cutaway');
});

// Drive the real page handlers with a small event fixture and a manual clock.
test('Banner, picking lock, repair button and automatic repair share one state across controls', () => {
  const model = build(), items = new Map(), modes = [];
  function element(id, dataset = {}) {
    const events = new Map(), classes = new Set();
    const node = {
      id, dataset, style: {}, children: [], clientWidth: 912, clientHeight: 740, offsetHeight: 40, offsetTop: id === 'wt-tour-card' ? 420 : 12,
      classList: { toggle(k,on) { if (on) classes.add(k); else classes.delete(k); }, add(k) { classes.add(k); },
        remove(k) { classes.delete(k); }, contains(k) { return classes.has(k); } },
      setAttribute(k,v) { this[k] = v; }, appendChild(e) { this.children.push(e); }, querySelectorAll() { return []; },
      addEventListener(k,fn) { events.set(k,fn); }, emit(k) { events.get(k)?.({target:this}); } };
    if (id === 'wt-tour-card') Object.defineProperty(node, 'innerHTML', {
      set(markup) {
        for (const [, dynamicId] of markup.matchAll(/ id="([^"]+)"/g)) element(dynamicId);
      }
    });
    items.set(id,node); return node;
  }
  for (const [,id] of html.matchAll(/ id="([^"]+)"/g)) element(id);
  for (const [,mode] of html.matchAll(/data-view-mode="([^"]+)"/g)) modes.push(element(mode,{ viewMode:mode }));
  const doc = { getElementById: id => items.get(id), createElement: () => element('pin'),
    querySelectorAll: sel => sel === '[data-view-mode]' ? modes : [] };
  let frame, now = 0, picks = 0, measuring = false;
  class Controls { target = new T.Vector3(); update() {} addEventListener() {} }
  class Ray extends T.Raycaster { setFromCamera() { picks++; } }
  const source = readFileSync(new URL('../wt-main.js',import.meta.url),'utf8').replace(/^import [\s\S]*?;\n/gm,'');
  runInNewContext(source, { document:doc, window:element('window'), THREE:{...T, Raycaster:Ray}, ...data,
    froudePanel, updateFroudePanel, frameTourContent, createAccidentControls, OrbitControls: Controls, ResizeObserver: class { observe() { } },
    createWindTurbineModel:() => model, createWindParticles:() => ({resize(){},update(){}}),
    createStudio: () => ({ resize() { }, resizeLabels() { }, render() { }, updateWeather() { }, setMeasurements(active) { measuring = active; } }), createGraphicsSettings: () => ({ frame() { }, close() { } }),
    performance:{ now:() => now }, requestAnimationFrame:cb => { frame = cb; } });
  const by = id => items.get(id), click = id => by(id).emit('click');
  function start() {
    click('exploded');
    assert.equal(model.accident.state.phase,'overrev');
    assert.equal(by('wt-label-layer').hidden,true);
    by('wt-canvas').emit('pointerup');
    assert.equal(picks,0);
  }
  start();
  for (let i = 0; i < 85; i++) frame(now += 33);
  assert.equal(by('wt-repair').hidden,false);
  assert.match(by('wt-accident-title').textContent,/88 U\/min/);
  for (const repair of [() => click('wt-repair'), () => click('wt-btn-reset'), () => click('xray'),
    () => { by('wt-wind-slider').value = '19'; by('wt-wind-slider').emit('input'); }, () => click('wt-btn-tour')]) {
    if (model.accident.state.phase === 'idle') start();
    repair();
    assert.equal(model.accident.state.phase,'idle');
    assert.ok(by('wt-accident').hidden);
    assert.equal(by('wt-btn-labels').disabled,false);
  }
  assert.equal(measuring, false);
  click('wt-tour-next'); assert.equal(measuring, true);
  by('wt-wind-slider').value = '20'; by('wt-wind-slider').emit('input');
  assert.equal(by('wt-fr-slider').value, '20');
  assert.match(by('wt-fr-values').innerHTML, /3,60 MW/);
  by('wt-fr-slider').value = '26'; by('wt-fr-slider').emit('input');
  assert.match(by('wt-fr-values').innerHTML, /Sturmabschaltung/);
  click('wt-tour-next'); assert.equal(measuring, false);
  click('wt-tour-prev'); assert.equal(measuring, true);
  click('wt-tour-end'); assert.equal(measuring, false);
});

test('Mute suppresses the whine and bang, including muting or repairing during overrev', () => {
  let muted = true, starts = 0, bursts = 0, disconnects = 0, contexts = 0;
  const param = { setValueAtTime(){}, exponentialRampToValueAtTime(){} };
  const win = { ArcadeAudio: { isMuted:() => muted, explosion() { bursts++; } },
    AudioContext:class {
      constructor() { contexts++; }
      currentTime = 0;
      createOscillator() { return {frequency:param, connect(){}, start(){starts++;},stop(){},disconnect(){disconnects++;}}; }
      createGain() { return { gain:param,connect(){},disconnect(){} }; }
    } };
  const old = globalThis.window;
  globalThis.window = win;
  let model;
  try { model = build(); }
  finally { if (old === undefined) delete globalThis.window; else globalThis.window = old; }
  const t = data.computeTurbineTelemetry(12), fx = model.accident;
  function finish() { for (let j = 0; j < 75; j++) model.update(1/30,t); fx.repair(); }
  fx.start(12); finish(); assert.equal(starts,0); assert.equal(bursts,0);
  muted = false; fx.start(12); muted = true; finish();
  assert.equal(starts,1); assert.equal(disconnects,1); assert.equal(bursts,0);
  muted = false; fx.start(12); fx.repair(); assert.equal(disconnects,2);
  fx.start(12); finish(); assert.equal(contexts,1); assert.equal(bursts,1); assert.equal(disconnects,3);
});
