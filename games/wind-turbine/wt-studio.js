import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createWindRenderer } from './wt-ao.js?v=0.2.0';

export function createStudio(canvas, camera, turbine, wind) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();

  const fill = new THREE.HemisphereLight(0xf1f5f9, 0x334155);
  const key = new THREE.DirectionalLight(0xffffff);
  key.position.set(13, 17, 15);
  key.target.position.set(0, -1.8, 1);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -13, right: 13, top: 14, bottom: -15, near: 9, far: 52 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias = -0.00035;
  key.shadow.normalBias = 0.015;
  const rim = new THREE.DirectionalLight(0xf97316);
  rim.position.set(-12, 6, -10);
  scene.add(fill, key, key.target, rim, turbine.root, wind.mesh);

  let lastTheme;
  function syncTheme() {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    if (lastTheme === theme) return;
    lastTheme = theme;
    const dark = theme === 'dark', background = dark ? 0x0b1220 : 0xeef3fa;
    scene.background = new THREE.Color(background);
    scene.fog = new THREE.Fog(background, 34, 82);
    fill.intensity = dark ? 0.85 : 1.15;
    key.intensity = dark ? 2.0 : 2.2;
    rim.intensity = dark ? 1.0 : 0.6;
    turbine.applyTheme(theme);
    wind.applyTheme(dark);
  }
  syncTheme();
  window.addEventListener('arcade:theme-changed', syncTheme);
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return createWindRenderer(renderer, scene, camera, key);
}
