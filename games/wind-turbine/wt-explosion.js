import * as THREE from 'three';
import { ROTOR } from './wt-rotor.js?v=0.2.0';

const REV_SECONDS = 2.4, PEAK_RPM = 88, GRAVITY = 13.5;
const QUIPS = [
  'Blatt 2 hat sich für eine Karriere als Bumerang entschieden.',
  'Die Gondel meldet sich heute aus dem Erdgeschoss.',
  'Das Getriebe bittet um einen windstillen Arbeitsplatz.'
];

function createSound(win) {
  let context, oscillator, gain;
  function stop() {
    if (!oscillator) return;
    oscillator.stop();
    oscillator.disconnect();
    gain.disconnect();
    oscillator = gain = null;
  }
  function start() {
    const Audio = win?.AudioContext || win?.webkitAudioContext;
    if (!Audio || win.ArcadeAudio?.isMuted?.()) return;
    try {
      context ??= new Audio();
      if (context.state === 'suspended') context.resume().catch(() => {});
      oscillator = context.createOscillator();
      gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(90, now);
      oscillator.frequency.exponentialRampToValueAtTime(690, now + REV_SECONDS);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.085, now + 0.35);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(now + REV_SECONDS + 0.1);
    } catch { if (oscillator) { oscillator.disconnect(); gain?.disconnect(); oscillator = null; } }
  }
  function muted() { return win?.ArcadeAudio?.isMuted?.(); }
  win?.document?.addEventListener('visibilitychange', () => { if (win.document.hidden) stop(); });
  return { start, stop, mute() { if (muted()) stop(); },
    burst() { stop(); if (!muted()) win?.ArcadeAudio?.explosion?.(); } };
}

// All rigid bodies keep their original parents. Ballistics uses their centres
// in world space and converts the result back into each parent's local frame.
export function createTurbineAccident({ root, groups, blades, spinning, brake, shells, hidden, floorY, win }) {
  const state = { phase: 'idle', elapsed: 0, rpm: 0, quip: '' };
  const sound = createSound(win);
  const bodies = [...blades, ...Array.from(groups).filter(([id]) =>
    !['blades', 'tower', 'transformer'].includes(id)).map(([, node]) => node)].map(node => ({
    node, centre: new THREE.Vector3(), half: new THREE.Vector3(), pos: new THREE.Vector3(),
    vel: new THREE.Vector3(), spin: new THREE.Vector3(), rot: new THREE.Quaternion(),
    inverseParent: new THREE.Matrix4(), inverseRotation: new THREE.Quaternion(), resting: false
  }));
  const tower = groups.get('tower'), nacelle = groups.get('nacelle');
  const touched = new Set([...bodies.map(b => b.node), ...spinning, tower, brake]);
  const snapshots = Array.from(touched, node => ({ node, pos: new THREE.Vector3(), rot: new THREE.Euler() }));
  const covers = shells.map(({ mesh, normalMat, line }) => ({ mesh, normalMat, line }));
  const materials = Array.from(new Set(covers.map(c => c.normalMat)), mat => ({ mat }));
  const hiddenStates = hidden.map(node => ({ node, visible: true }));
  const smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0x89909a, transparent: true, opacity: 0.36, depthWrite: false }), 32);
  smoke.name = 'Rauch und Staub';
  smoke.frustumCulled = false;
  smoke.visible = false;
  smoke.count = 0;
  smoke.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  root.add(smoke);
  const matrix = new THREE.Matrix4(), orientation = new THREE.Quaternion(), delta = new THREE.Euler();
  const point = new THREE.Vector3(), dust = new THREE.Vector3(), bounds = new THREE.Box3(), box = new THREE.Box3();
  let startRpm = 0, dustTime = Infinity;

  function start(rpm) {
    if (state.phase !== 'idle') return;
    for (const s of snapshots) { s.pos.copy(s.node.position); s.rot.copy(s.node.rotation); }
    for (const c of covers) {
      c.old = c.mesh.material; c.visible = c.mesh.visible; c.edges = c.line.visible; c.shadow = c.mesh.castShadow;
      c.mesh.material = c.normalMat; c.mesh.visible = c.mesh.castShadow = true; c.line.visible = false;
    }
    for (const s of materials) {
      const m = s.mat;
      s.opacity = m.opacity; s.transparent = m.transparent; s.write = m.depthWrite;
      m.opacity = 1; m.transparent = false; m.depthWrite = true;
    }
    for (const s of hiddenStates) { s.visible = s.node.visible; s.node.visible = false; }
    state.phase = 'overrev'; state.elapsed = 0; state.rpm = startRpm = rpm;
    state.quip = QUIPS[Math.floor(Math.random() * QUIPS.length)];
    dustTime = Infinity;
    sound.start();
  }

  function launch() {
    state.phase = 'blown'; state.elapsed = 0;
    smoke.visible = true;
    smoke.count = 0;
    sound.burst();
    root.updateMatrixWorld(true);
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i], node = b.node;
      // A tight model-local box includes the real blade tips and the shell.
      b.inverseParent.copy(node.matrixWorld).invert();
      bounds.makeEmpty();
      node.traverse(child => {
        if (!child.isMesh || !child.visible) return;
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
        matrix.multiplyMatrices(b.inverseParent, child.matrixWorld);
        bounds.union(box.copy(child.geometry.boundingBox).applyMatrix4(matrix));
      });
      bounds.getCenter(b.centre); bounds.getSize(b.half).multiplyScalar(0.5);
      b.pos.copy(b.centre).applyMatrix4(node.matrixWorld);
      node.getWorldQuaternion(b.rot);
      b.inverseParent.copy(node.parent.matrixWorld).invert();
      node.parent.getWorldQuaternion(b.inverseRotation).invert();
      const angle = i < 3 ? Math.atan2(b.pos.x, b.pos.y - ROTOR.y) : i * 2.39996;
      b.vel.set(Math.sin(angle) * 4.5, 4.3 + i % 3, i < 3 ? (i - 1) * 3.2 : 4 * Math.cos(angle));
      b.spin.set(0.6 + 0.15 * (i % 4), (i % 3 - 1) * 1.2, i % 2 ? 1.5 : -1.5);
      b.resting = false;
    }
  }

  function fly(b, dt) {
    if (b.resting) return;
    b.vel.y -= GRAVITY * dt;
    b.pos.addScaledVector(b.vel, dt);
    delta.set(b.spin.x * dt, b.spin.y * dt, b.spin.z * dt);
    b.rot.premultiply(orientation.setFromEuler(delta)).normalize();
    matrix.makeRotationFromQuaternion(b.rot);
    const m = matrix.elements;
    const bottom = b.pos.y - Math.abs(m[1]) * b.half.x - Math.abs(m[5]) * b.half.y - Math.abs(m[9]) * b.half.z;
    if (bottom <= floorY) {
      b.pos.y += floorY - bottom;
      if (dustTime === Infinity) { dust.copy(b.pos); dust.y = floorY; dustTime = state.elapsed; }
      b.vel.y = Math.max(0, -b.vel.y * 0.24);
      b.vel.x *= 0.67; b.vel.z *= 0.67; b.spin.multiplyScalar(0.45);
      b.resting = b.vel.y < 0.19 && b.spin.lengthSq() < 0.08;
    }
    point.copy(b.centre).applyQuaternion(b.rot);
    b.node.position.copy(b.pos).sub(point).applyMatrix4(b.inverseParent);
    b.node.quaternion.multiplyQuaternions(b.inverseRotation, b.rot);
  }

  function puffs() {
    let count = 0;
    for (let i = 0; i < 32; i++) {
      const impact = i >= 20;
      const age = state.elapsed - (impact ? dustTime : 0) - (i % 10) * 0.055;
      const life = age / (impact ? 1.4 : 2.6);
      if (life <= 0 || life >= 1) continue;
      const angle = i * 2.39996, spread = (impact ? 0.2 + life * 4 : 0.25 + life * 1.9);
      const size = (0.16 + life * 0.78) * Math.sin(Math.PI * life);
      matrix.makeScale(size, size * (impact ? 0.55 : 1.15), size);
      matrix.setPosition((impact ? dust.x : 0) + Math.cos(angle) * spread,
        (impact ? floorY + 0.15 : 0.65) + life * (impact ? 0.85 : 5), (impact ? dust.z : 0) + Math.sin(angle) * spread);
      smoke.setMatrixAt(count++, matrix);
    }
    smoke.count = count;
    smoke.visible = count > 0;
    smoke.instanceMatrix.needsUpdate = true;
  }

  function update(seconds) {
    if (state.phase === 'idle') return;
    const dt = Math.min(0.05, Math.max(0, seconds));
    state.elapsed += dt;
    sound.mute();
    if (state.phase === 'overrev') {
      const t = Math.min(1, state.elapsed / REV_SECONDS);
      state.rpm = startRpm + (PEAK_RPM - startRpm) * t * t;
      for (const node of spinning) node.rotation.z += ROTOR.spinSign * state.rpm * Math.PI / 30 * dt;
      for (const blade of blades) blade.rotation.y *= Math.exp(-7 * dt);
      brake.position.x = 0.39;
      tower.rotation.z = Math.sin(state.elapsed * 34) * t * 0.013;
      nacelle.position.x = Math.sin(state.elapsed * 46) * t * 0.12;
      if (t >= 1) launch();
    } else {
      for (const b of bodies) fly(b, dt);
      puffs();
    }
  }

  function repair() {
    if (state.phase === 'idle') return false;
    sound.stop();
    for (const s of snapshots) { s.node.position.copy(s.pos); s.node.rotation.copy(s.rot); }
    for (const c of covers) {
      c.mesh.material = c.old; c.mesh.visible = c.visible; c.line.visible = c.edges; c.mesh.castShadow = c.shadow;
    }
    for (const s of materials) {
      s.mat.opacity = s.opacity; s.mat.transparent = s.transparent; s.mat.depthWrite = s.write;
    }
    for (const s of hiddenStates) s.node.visible = s.visible;
    smoke.visible = false; smoke.count = 0;
    state.phase = 'idle'; state.elapsed = 0; state.rpm = 0;
    root.updateMatrixWorld(true);
    return true;
  }
  return { state, start, update, repair };
}
