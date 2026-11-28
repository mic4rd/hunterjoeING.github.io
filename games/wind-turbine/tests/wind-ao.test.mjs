import assert from 'node:assert/strict';
import test from 'node:test';

import './importmap.mjs';
const T = await import('three');
const { createWindRenderer } = await import('../wt-ao.js?v=0.2.0');

function fixture({ width = 1200, cores = 8, memory = 8, search = '', capable = true } = {}) {
  globalThis.window = { innerWidth: width, navigator: { hardwareConcurrency: cores, deviceMemory: memory },
    location: { search }, devicePixelRatio: 1 };
  globalThis.document = { hidden: false, addEventListener() {} };
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(), draws = [];
  const solid = new T.Mesh(), shell = new T.Mesh(), fire = new T.Mesh(), beads = new T.InstancedMesh(new T.SphereGeometry(1), new T.MeshStandardMaterial(), 2);
  beads.userData.windParticle = true;
  const light = new T.DirectionalLight(), hidden = new T.Group();
  solid.name = 'solid'; shell.name = 'shell'; fire.name = 'fire'; beads.name = 'beads'; light.name = 'light';
  hidden.visible = false;
  hidden.add(new T.Mesh());
  shell.material.transparent = true;
  fire.material.blending = T.AdditiveBlending;
  scene.add(solid, shell, fire, beads, light, hidden);
  scene.background = new T.Color(0xcccccc);
  const renderer = {
    extensions: { has: () => capable }, shadowMap: { autoUpdate: true }, toneMapping: T.ACESFilmicToneMapping,
    toneMappingExposure: 1.08, outputColorSpace: T.SRGBColorSpace, autoClear: true, target: null,
    getPixelRatio() { return this.ratio; }, setPixelRatio(r) { this.ratio = r; },
    setSize(w, h) { this.width = w; this.height = h; }, getSize(out) { return out.set(this.width, this.height); },
    getRenderTarget() { return this.target; }, setRenderTarget(target) { this.target = target; },
    getClearColor() {}, getClearAlpha() { return 1; }, setClearColor() {}, setClearAlpha() {},
    clear() { draws.push({ clear: true, target: this.target }); },
    render(object, view) {
      const names = [];
      if (object === scene) scene.traverseVisible(o => {
        if (o.name && view.layers.test(o.layers)) names.push(o.name);
      });
      draws.push({ names, scene: object === scene, normals: Boolean(scene.overrideMaterial), bg: scene.background,
        target: this.target, material: object.material, shadows: this.shadowMap.autoUpdate });
    }
  };
  const pipe = createWindRenderer(renderer, scene, camera, light);
  pipe.resize(width, 800);
  function frame(dt = 1/60) {
    draws.length = 0;
    pipe.render(dt);
    return draws.filter(d => d.scene);
  }
  return { scene, camera, shell, light, renderer, pipe, draws, frame };
}

test.describe('Ambient occlusion', () => {
  let previousWindow, previousDocument;
  test.beforeEach(() => {
    previousWindow = globalThis.window;
    previousDocument = globalThis.document;
  });
  test.afterEach(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });

  test('AO multiplies opaque colour in place; overlays retain opaque depth and OutputPass runs last', () => {
    const { scene, camera, shell, draws, frame } = fixture();
    const background = scene.background;
    const [opaque, normals, overlay] = frame();
    assert.deepEqual(opaque.names, ['solid', 'light']);
    assert.deepEqual(normals.names, opaque.names);
    assert.equal(normals.normals, true);
    assert.equal(normals.target.width, opaque.target.width);
    assert.deepEqual(overlay.names, ['shell', 'fire', 'beads', 'light']);
    assert.equal(opaque.target, overlay.target);
    assert.ok(opaque.target.depthBuffer);
    const middle = draws.slice(draws.indexOf(opaque) + 1, draws.indexOf(overlay));
    assert.ok(!middle.some(d => d.clear && d.target === overlay.target));
    const blend = middle.at(-1);
    assert.equal(blend.target, opaque.target);
    assert.equal(blend.material.depthWrite, false);
    assert.equal(blend.material.uniforms.intensity.value, 1.44);
    assert.equal(blend.material.uniforms.tDepth.value, normals.target.depthTexture);
    assert.equal(overlay.bg, null);
    assert.equal(normals.shadows || overlay.shadows, false);
    assert.equal(scene.background, background);
    assert.equal(camera.layers.mask, 1);
    assert.equal(draws.at(-1).target, null);
    assert.equal(draws.at(-1).material.uniforms.tDiffuse.value, opaque.target.texture);
    assert.ok('ACES_FILMIC_TONE_MAPPING' in draws.at(-1).material.defines);
    assert.ok('SRGB_TRANSFER' in draws.at(-1).material.defines);
    shell.material.transparent = false;
    assert.ok(frame()[1].names.includes('shell'));
  });

  test('AO defaults, forced modes, resize and DPR use the active viewport', () => {
    for (const options of [{ width: 768 }, { cores: 4 }, { memory: 4 }, { search: '?ao=0' },
      { capable: false, search: '?ao=1' }]) assert.equal(fixture(options).frame().length, 1);
    const { frame, pipe } = fixture({ width: 390, memory: 2, search: '?ao=1' });
    globalThis.window.devicePixelRatio = 3;
    let [opaque, normals] = frame();
    assert.equal(opaque.target.width, 780);
    assert.equal(normals.target.width, 780);
    pipe.resize(500, 650);
    [opaque, normals] = frame();
    assert.equal(opaque.target.height, 1300);
    assert.equal(normals.target.height, 1300);
    for (let i = 0; i < 65; i++) assert.equal(frame(1/25).length, 3);
    const auto = fixture();
    auto.pipe.resize(700, 500);
    assert.equal(auto.frame().length, 1);
    auto.pipe.resize(1200, 800);
    assert.equal(auto.frame().length, 3);
  });

  test('All four presets switch live, preserve overlay depth and release targets when off', () => {
    const { pipe, frame, draws } = fixture({ width: 390, cores: 4, memory: 2 });
    let previous, disposed = false;
    for (const [level, radius, thickness, intensity] of [[1, 0.38, 0.16, 0.70], [2, 0.52, 0.22, 1.44], [3, 0.66, 0.28, 1.90]]) {
      pipe.setAoLevel(level);
      const [opaque, normal, overlay] = frame();
      const post = draws.slice(draws.indexOf(normal) + 1, draws.indexOf(overlay));
      const ao = post.find(d => d.material?.uniforms.thickness && d.material?.uniforms.radius);
      assert.equal(ao.material.uniforms.radius.value, radius);
      assert.equal(ao.material.uniforms.thickness.value, thickness);
      assert.equal(post.at(-1).material.uniforms.intensity.value, intensity);
      assert.equal(ao.target.width, Math.ceil(opaque.target.width / 2));
      assert.equal(normal.target.width, level === 1 ? ao.target.width : opaque.target.width);
      assert.equal(pipe.aoLevel, level);
      assert.deepEqual(overlay.names, ['shell', 'fire', 'beads', 'light']);
      if (previous) assert.equal(ao.target, previous);
      previous = ao.target;
      for (let i = 0; i < 80; i++) assert.equal(frame(1/25).length, 3);
    }
    pipe.setAoLevel(1);
    assert.equal(frame()[1].target.width, 195);
    previous.addEventListener('dispose', () => { disposed = true; });
    pipe.setAoLevel(0);
    assert.ok(disposed);
    assert.equal(frame().length, 1);
    pipe.resize(1400, 900);
    assert.equal(pipe.aoLevel, 0);
  });

  test('URL wins over every saved level, unsupported devices report off and manual choice can revive dropped AO', () => {
    for (const [search, expected] of [['?ao=0', 0], ['?ao=1', 2]]) {
      const { pipe, frame } = fixture({ cores: 2, search });
      for (const level of [0, 1, 2, 3]) {
        pipe.setAoLevel(level);
        assert.equal(pipe.aoLevel, expected);
        assert.equal(frame().length, expected ? 3 : 1);
      }
    }
    const unavailable = fixture({ capable: false, search: '?ao=1' });
    unavailable.pipe.setAoLevel(3);
    assert.equal(unavailable.pipe.aoLevel, 0);
    const { pipe, frame } = fixture({ search: '?ao=invalid' });
    for (let i = 0; i < 80; i++) frame(1/32);
    assert.equal(pipe.aoLevel, 0);
    pipe.setAoLevel(3);
    assert.equal(pipe.aoLevel, 3);
    pipe.resize(390, 750);
    assert.equal(pipe.aoLevel, 3);
  });

  test('Scene shadows toggle independently of AO and across render passes', () => {
    const { light, renderer, pipe, frame } = fixture();
    for (const level of [0, 2, 1]) {
      pipe.setAoLevel(level);
      for (const on of [false, true]) {
        pipe.setShadows(on);
        frame();
        assert.equal(light.castShadow, on);
        assert.equal(renderer.shadowMap.enabled, on);
        assert.equal(renderer.shadowMap.autoUpdate, true);
        assert.equal(pipe.aoLevel, level);
      }
    }
  });

  test('AO tolerates brief slowdowns and drops after two consecutive low-FPS seconds', () => {
    const { frame, pipe } = fixture();
    for (let i = 0; i < 32; i++) assert.equal(frame(1/32).length, 3);
    for (let i = 0; i < 64; i++) assert.equal(frame(1/64).length, 3);
    for (let i = 0; i < 63; i++) assert.equal(frame(1/32).length, 3);
    assert.equal(frame(1/32).length, 1);
    pipe.resize(1400, 900);
    assert.deepEqual(frame()[0].names, ['solid', 'shell', 'fire', 'beads', 'light']);
  });
});
