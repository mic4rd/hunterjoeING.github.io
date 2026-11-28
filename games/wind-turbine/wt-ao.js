import { AdditiveBlending } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const OPAQUE = 1, OVERLAY = 2;
const AO_LEVELS = [
  null,
  { radius: 0.38, thickness: 0.16, intensity: 0.70 },
  { radius: 0.52, thickness: 0.22, intensity: 1.44 },
  { radius: 0.66, thickness: 0.28, intensity: 1.90 }
];

// Layer zero stays available for normal rendering, shadows and picking.
function assignLayer(object) {
  if (object.isLight) {
    object.layers.enable(OPAQUE);
    object.layers.enable(OVERLAY);
  } else if (object.material) {
    const m = object.material;
    const solid = object.isMesh && !object.userData.windParticle && !object.userData.aoOverlay && !m.transparent && m.depthWrite && m.blending !== AdditiveBlending;
    object.layers.enable(solid ? OPAQUE : OVERLAY);
    object.layers.disable(solid ? OVERLAY : OPAQUE);
  }
}

class OpaqueAO extends GTAOPass {
  constructor(scene, camera, level) {
    super(scene, camera, 1, 1, undefined,
      { samples: 8 }, { radius: 3, samples: 8 });
    this.output = GTAOPass.OUTPUT.Off;
    this.needsSwap = false;
    const uniforms = this.blendMaterial.uniforms;
    uniforms.tDepth = this.gtaoMaterial.uniforms.tDepth;
    uniforms.cameraNear = this.gtaoMaterial.uniforms.cameraNear;
    uniforms.cameraFar = this.gtaoMaterial.uniforms.cameraFar;
    uniforms.thickness = this.gtaoMaterial.uniforms.thickness;
    // Upsample the half-resolution contact term only from the same surface.
    // The full-resolution depth also keeps clear background pixels untouched.
    this.originalBlend = this.blendMaterial.fragmentShader;
    this.depthAwareBlend = `
      #include <packing>
      uniform sampler2D tDepth, tDiffuse;
      uniform float cameraNear, cameraFar, thickness, intensity;
      varying vec2 vUv;
      void main() {
        float depth = texture2D(tDepth, vUv).r;
        if (depth >= 1.0) discard;
        float z = perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
        vec2 size = vec2(textureSize(tDiffuse, 0));
        vec2 p = vUv * size - 0.5, fraction = fract(p);
        float shadow = 0.0, total = 0.0;
        for (int y = 0; y < 2; y++) {
          for (int x = 0; x < 2; x++) {
            vec2 offset = vec2(x, y);
            vec2 uv = (floor(p) + offset + 0.5) / size;
            float sampleZ = perspectiveDepthToViewZ(texture2D(tDepth, uv).r, cameraNear, cameraFar);
            vec2 w = mix(1.0 - fraction, fraction, offset);
            float weight = w.x * w.y * (1.0 - smoothstep(0.0, thickness, abs(z - sampleZ)));
            shadow += weight * (1.0 - texture2D(tDiffuse, uv).r);
            total += weight;
          }
        }
        gl_FragColor = vec4(vec3(max(0.0, 1.0 - intensity * shadow / max(total, 0.25))), 1.0);
      }`;
    this.setLevel(level);
  }

  setLevel(level) {
    if (this.level === level) return;
    this.level = level;
    const preset = AO_LEVELS[level];
    this.updateGtaoMaterial(preset);
    this.updatePdMaterial({ depthPhi: level === 1 ? 2 : preset.thickness });
    this.blendIntensity = preset.intensity;
    const shader = level === 1 ? this.originalBlend : this.depthAwareBlend;
    if (this.blendMaterial.fragmentShader !== shader) {
      this.blendMaterial.fragmentShader = shader;
      this.blendMaterial.needsUpdate = true;
    }
  }

  // The camera already excludes every overlay from the normal/depth render.
  overrideVisibility() {}
  restoreVisibility() {}

  setSize(width, height) {
    const halfWidth = Math.max(1, Math.ceil(width / 2)), halfHeight = Math.max(1, Math.ceil(height / 2));
    if (halfWidth !== this.width || halfHeight !== this.height) super.setSize(halfWidth, halfHeight);
    if (this.level === 1) this.normalRenderTarget.setSize(halfWidth, halfHeight);
    else this.normalRenderTarget.setSize(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)));
  }

  render(renderer, write, read) {
    const update = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    super.render(renderer, write, read);
    // The default GTAO output copies colour to the other buffer, losing scene
    // depth. Multiply AO directly into the opaque colour with depth writes off.
    this.blendMaterial.uniforms.tDiffuse.value = this.gtaoMap;
    this.blendMaterial.uniforms.intensity.value = this.blendIntensity;
    this.renderPass(renderer, this.blendMaterial, read);
    renderer.shadowMap.autoUpdate = update;
  }

  dispose() {
    super.dispose();
    this.gtaoMaterial.dispose();
    this.blendMaterial.dispose();
  }
}

class OverlayPass extends RenderPass {
  render(renderer, write, read) {
    const background = this.scene.background;
    const update = renderer.shadowMap.autoUpdate;
    this.camera.layers.set(OVERLAY);
    this.scene.background = null;
    renderer.shadowMap.autoUpdate = false;
    super.render(renderer, write, read);
    this.scene.background = background;
    renderer.shadowMap.autoUpdate = update;
  }
}

export function createWindRenderer(renderer, scene, camera, shadowLight) {
  const force = new URLSearchParams(window.location.search).get('ao');
  const forcedLevel = force === '1' ? 2 : force === '0' ? 0 : null;
  const hardware = window.navigator;
  const capable = renderer.extensions.has('EXT_color_buffer_float');
  const weak = hardware.hardwareConcurrency <= 4 || hardware.deviceMemory <= 4;
  let composer = null, width = 1, height = 1, ratio = 0;
  let elapsed = 0, frames = 0, slowWindows = 0, dropped = false;
  let preference = null, aoPass = null;

  function release() {
    if (!composer) return;
    for (const pass of composer.passes) pass.dispose();
    composer.dispose();
    composer = null;
    aoPass = null;
    elapsed = frames = slowWindows = 0;
  }

  function updateAO() {
    const automatic = !weak && !dropped && Math.min(window.innerWidth, width) > 768;
    const level = forcedLevel ?? preference ?? (automatic ? 2 : 0);
    if (!capable || !level) {
      release();
      return;
    }
    if (!composer) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      aoPass = new OpaqueAO(scene, camera, level);
      composer.addPass(aoPass);
      const overlay = new OverlayPass(scene, camera);
      overlay.clear = false;
      composer.addPass(overlay);
      composer.addPass(new OutputPass());
    } else if (aoPass.level !== level) {
      const changeResolution = (aoPass.level === 1) !== (level === 1);
      aoPass.setLevel(level);
      if (changeResolution) aoPass.setSize(width * ratio, height * ratio);
    }
  }

  function resize(w, h) {
    width = w;
    height = h;
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    updateAO();
    if (!composer) return;
    composer.setPixelRatio(ratio);
    composer.setSize(width, height);
  }

  function setAoLevel(level) {
    if (preference === level) return;
    preference = level;
    elapsed = frames = slowWindows = 0;
    if (ratio) updateAO();
  }

  function setShadows(enabled) {
    // Updating the light's shadow-caster count makes r170 select matching
    // shader programs even for materials restored later by a view change.
    renderer.shadowMap.enabled = shadowLight.castShadow = enabled;
  }

  let resumed = false;
  function resetMeter() {
    elapsed = frames = slowWindows = 0;
    resumed = true;
  }
  document.addEventListener('visibilitychange', resetMeter);
  function render(dt) {
    if (ratio !== Math.min(window.devicePixelRatio || 1, 2)) resize(width, height);
    if (composer && forcedLevel === null && preference === null && !document.hidden && !resumed) {
      elapsed += dt;
      frames++;
      if (elapsed >= 1) {
        slowWindows = frames / elapsed < 40 ? slowWindows + 1 : 0;
        elapsed = frames = 0;
        if (slowWindows >= 2) {
          dropped = true;
          release();
        }
      }
    }
    resumed = false;
    if (!composer) {
      renderer.render(scene, camera);
      return;
    }
    // Cutaway/X-ray can swap materials and the wind beads belong to the overlay.
    // Classify the current material while preserving ancestor visibility.
    scene.traverseVisible(assignLayer);
    const mask = camera.layers.mask;
    camera.layers.set(OPAQUE);
    composer.render(dt);
    camera.layers.mask = mask;
  }
  return { resize, render, setAoLevel, setShadows, forcedLevel, capable, get aoLevel() { return aoPass?.level ?? 0; } };
}
