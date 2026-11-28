import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { html, imports } from './importmap.mjs';
import { createGraphicsSettings, loadSettings } from '../wt-settings.js?v=0.2.0';

test('Invalid or blocked storage restores defaults; numerical density snaps to its bounds and step', () => {
  const defaults = { aoLevel: null, shadows: true, density: 100 };
  for (const win of [{}, { get localStorage() { throw Error('blocked'); } },
    ...['null', '5', '{', '{"aoLevel":"3","shadows":0,"density":null}'].map(s => ({ localStorage: { getItem: () => s } }))]) {
    assert.deepEqual(loadSettings(win), defaults);
  }
  for (const [value, expected] of [[1, 25], [113, 115], [900, 200]]) {
    const saved = { localStorage: { getItem: () => JSON.stringify({ aoLevel: 0, shadows: false, density: value }) } };
    assert.deepEqual(loadSettings(saved), { aoLevel: 0, shadows: false, density: expected });
  }
});

test('The settings menu applies live choices, persists them and samples FPS while open', () => {
  const data = new Map(), controls = new Map();
  const win = { localStorage: { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) } };
  function element(id) {
    const events = new Map(), el = {
      id, addEventListener(type, fn) { events.set(type, fn); },
      setAttribute(k, v) { this[k] = v; }, focus() { doc.activeElement = this; },
      emit(type) { events.get(type)(); }
    };
    controls.set(id, el);
    return el;
  }
  const levels = [0, 1, 2, 3].map(i => Object.assign(element('ao' + i), { value: String(i) }));
  const doc = {
    getElementById(id) { return controls.get(id) ?? element(id); },
    querySelectorAll: () => levels, addEventListener() {}
  };
  const pipe = { aoLevel: 2, forcedLevel: null, capable: true,
    setShadows(on) { this.shadows = on; }, setAoLevel(n) { this.aoLevel = n ?? 2; } };
  let density;
  const graphics = createGraphicsSettings(doc, win, pipe, { setDensity(v) { density = v; } });
  const panel = controls.get('wt-settings'), toggle = controls.get('wt-btn-settings');
  panel.hidden = true;
  toggle.emit('click');
  assert.equal(panel.hidden, false);
  assert.equal(doc.activeElement, levels[2]);
  levels[3].emit('change');
  assert.equal(pipe.aoLevel, 3);
  const shadows = controls.get('wt-shadows'), slider = controls.get('wt-density');
  shadows.checked = false; shadows.emit('change');
  slider.value = '175'; slider.emit('input'); slider.emit('change');
  assert.equal(density, 175);
  assert.equal(pipe.shadows, false);
  assert.equal(slider['aria-valuetext'], '175 %');
  assert.deepEqual([...data.keys()], ['wind_turbine_settings']);
  assert.deepEqual(loadSettings(win), { aoLevel: 3, shadows: false, density: 175 });
  for (let i = 0; i <= 25; i++) graphics.frame(1000 + i * 20);
  assert.equal(controls.get('wt-settings-fps').textContent, '50');
  graphics.close(true);
  assert.ok(panel.hidden);
  assert.equal(doc.activeElement, toggle);
});

test('Page, local module imports and import map select the same wind release', () => {
  assert.match(html, /id="wt-version-btn"[^>]*>v0\.2\.0<\/button>/);
  assert.match(html, /id="wt-btn-reset"[^>]*>[^<]*<\/button>\s*<button[^>]*id="wt-btn-settings"/);
  assert.match(html, /id="wt-density" min="25" max="200" step="5" value="100"/);
  assert.match(html, /href="\.\/styles\.css\?v=0\.2\.0"/);
  assert.match(html, /src="\.\/wt-main\.js\?v=0\.2\.0"/);
  assert.equal(imports['three/addons/postprocessing/GTAOPass.js'], './vendor/three-0.170.0-addons/postprocessing/GTAOPass.js?v=0.2.0');
  assert.equal(imports['three/addons/'], '../../shared/vendor/three-0.170.0/examples/jsm/');
  assert.ok(Object.values(imports).every(src => src.startsWith('.')));
  const dir = new URL('../', import.meta.url);
  for (const file of readdirSync(dir).filter(f => f.endsWith('.js'))) {
    for (const [, path] of readFileSync(new URL(file, dir), 'utf8').matchAll(/from '(\.\/[^']+)'/g)) {
      assert.match(path, /\.js\?v=0\.2\.0$/);
    }
  }
});
