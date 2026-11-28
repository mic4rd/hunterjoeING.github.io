// Pitch radii, tooth counts and animation share the same gear definitions.
import * as T from 'three';

const TAU = 2 * Math.PI;
export const PLANETARY = { sun: 16, planet: 30, ring: 76, count: 4, module: 0.018 };
export const SPUR = { wheel: 68, pinion: 17, module: 0.014 };
export const YAW = { ring: 56, pinion: 12, module: 0.035 };
export const pitch = (teeth, module) => teeth * module / 2;

function node(parent, name, geometry, mat, x, y, z) {
  const obj = new T.Mesh(geometry, mat);
  obj.name = name;
  obj.position.set(x, y, z);
  parent.add(obj);
  return obj;
}

// Annular tooth mesh with open bore. A helical pair uses opposite face twists.
// The internal gear carries teeth on the inside of the stationary housing.
function wheelGeometry(teeth, module, depth, rim, internal, helix) {
  const r = pitch(teeth, module), positions = [], indices = [];
  const offsets = [-0.5, -0.36, -0.14, 0.14, 0.36];
  const n = teeth * offsets.length;
  for (let i = 0; i < n; i++) {
    const k = i % offsets.length, tooth = Math.floor(i / offsets.length);
    const tip = k === 2 || k === 3;
    const toothR = r + (internal ? -1 : 1) * module * (tip ? 0.72 : -1.12);
    for (let face = 0; face < 2; face++) {
      const z = (face - 0.5) * depth;
      const a = (tooth + offsets[k]) * TAU / teeth + z * helix / r;
      for (const radius of internal ? [toothR, rim] : [rim, toothR]) {
        positions.push(radius * Math.cos(a), radius * Math.sin(a), z);
      }
    }
  }
  const quad = (a, b, c, d) => indices.push(a, b, c, a, c, d);
  for (let i = 0; i < n; i++) {
    const a = 4 * i, b = 4 * ((i + 1) % n);
    quad(a, b, b + 1, a + 1); quad(a + 2, a + 3, b + 3, b + 2);
    quad(a + 1, b + 1, b + 3, a + 3); quad(a, a + 2, b + 2, b);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}

function wheel(parent, name, teeth, module, depth, rim, mat, x, y, z, internal = false, helix = 0) {
  return node(parent, name, wheelGeometry(teeth, module, depth, rim, internal, helix), mat, x, y, z);
}

// Machined bores remain open through the brake, coupling and bearing.
export function sleeve(outer, inner, depth) {
  const contour = new T.Shape();
  contour.absarc(0, 0, outer, 0, TAU, false);
  const bore = new T.Path();
  bore.absarc(0, 0, inner, 0, TAU, true);
  contour.holes.push(bore);
  const g = new T.ExtrudeGeometry(contour, { depth, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -depth / 2);
  return g;
}

function shaft(parent, name, r, x, y, front, rear, mat) {
  const geo = new T.CylinderGeometry(r, r, front - rear, 20);
  geo.rotateX(Math.PI / 2);
  return node(parent, name, geo, mat, x, y, (front + rear) / 2);
}

export function createGearbox(group, mats, registerShell, cutCovers) {
  // Local +Z faces the rotor. The carrier meets the main shaft at z=0.60,
  // the output stub meets the fast shaft at z=-0.755.
  const { sun, planet, ring, count, module } = PLANETARY;
  const planetZ = 0.35, orbit = pitch(sun + planet, module);
  const carrier = new T.Group();
  carrier.name = 'Planetenträger'; group.add(carrier);
  shaft(carrier, 'Trägernabe', 0.22, 0, 0, 0.60, 0.495, mats.steelDark);
  const planets = [];
  for (let i = 0; i < count; i++) {
    const arm = new T.Group();
    arm.rotation.z = i * TAU / count;
    carrier.add(arm);
    node(arm, 'Trägerarm', new T.BoxGeometry(orbit, 0.075, 0.055), mats.gearGold, orbit / 2, 0, 0.515);
    shaft(arm, 'Planetenbolzen', 0.048, orbit, 0, 0.55, planetZ - 0.1, mats.steelBright);
    planets.push(wheel(arm, 'Planet', planet, module, 0.18, 0.049, mats.gearSteel, orbit, 0, planetZ));
  }
  const solar = wheel(group, 'Sonne', sun, module, 0.18, 0.050, mats.gearGold, 0, 0, planetZ);
  wheel(group, 'Hohlrad', ring, module, 0.21, 0.75, mats.steelDark, 0, 0, planetZ, true);
  const a = SPUR, distance = pitch(a.wheel + a.pinion, a.module), axis = 0.62;
  const x = distance * Math.cos(axis), y = distance * Math.sin(axis);
  const z1 = -0.055, z2 = -0.535;
  const first = wheel(group, 'Stirnrad 1', a.wheel, a.module, 0.18, 0.050, mats.gearSteel, 0, 0, z1, false, 0.16);
  const pin1 = wheel(group, 'Ritzel 1', a.pinion, a.module, 0.18, 0.042, mats.steelBright, x, y, z1, false, -0.16);
  const second = wheel(group, 'Stirnrad 2', a.wheel, a.module, 0.18, 0.042, mats.gearGold, x, y, z2, false, -0.16);
  const pin2 = wheel(group, 'Ritzel 2', a.pinion, a.module, 0.18, 0.068, mats.steelBright, 0, 0, z2, false, 0.16);
  shaft(group, 'Sonnenwelle', 0.049, 0, 0, planetZ + 0.09, z1 - 0.09, mats.steelBright);
  shaft(group, 'Zwischenwelle', 0.041, x, y, z1 + 0.095, z2 - 0.095, mats.steelBright);
  shaft(group, 'Abtriebszapfen', 0.067, 0, 0, z2 + 0.09, -0.755, mats.steelBright);
  // Open-ended halves leave the shaft passages and the entire gear space clear.
  for (const front of [false, true]) {
    const geometry = new T.CylinderGeometry(0.983, 0.983, 1.31, 40, 1, true, front ? 0 : Math.PI, Math.PI);
    geometry.rotateX(Math.PI / 2);
    const material = mats.steelDark.clone(); material.side = T.DoubleSide;
    const shell = node(group, front ? 'Getriebedeckel' : 'Getriebewand', geometry, material, 0.09, 0.20, -0.04);
    registerShell(shell);
    if (front) cutCovers.push(shell);
  }
  for (const x of [-0.22, 0.40]) {
    node(group, 'Getriebefuß', new T.BoxGeometry(0.16, 0.31, 0.52), mats.steelDark, x, -0.845, -0.20);
  }
  function update(angle) {
    const fastSun = angle * (1 + ring / sun), intermediate = -fastSun * a.wheel / a.pinion;
    const output = -intermediate * a.wheel / a.pinion;
    carrier.rotation.z = angle;
    solar.rotation.z = fastSun;
    for (const p of planets) p.rotation.z = Math.PI / planet - angle * ring / planet;
    first.rotation.z = fastSun + axis;
    pin1.rotation.z = intermediate + axis + Math.PI - Math.PI / a.pinion;
    second.rotation.z = intermediate + axis + Math.PI;
    pin2.rotation.z = output + axis - Math.PI / a.pinion;
    return output;
  }
  update(0);
  return update;
}

const yawAxis = pitch(YAW.ring + YAW.pinion, YAW.module);
function yawMount(i) {
  const angle = Math.PI / 4 + i * Math.PI / 2;
  return { x: yawAxis * Math.cos(angle), z: yawAxis * Math.sin(angle), angle };
}

export function createBedplate(mat) {
  // A pierced machine carrier: motor spindles and service access have real openings.
  const outline = new T.Shape();
  outline.moveTo(-1.175, -3.375); outline.lineTo(1.175, -3.375);
  outline.lineTo(1.175, 3.375); outline.lineTo(-1.175, 3.375); outline.closePath();
  function bore(x, y, r) { const h = new T.Path(); h.absarc(x, y, r, 0, TAU, true); outline.holes.push(h); }
  for (let i = 0; i < 4; i++) {
    const mount = yawMount(i);
    bore(mount.x, -mount.z - 0.5, 0.091);
  }
  bore(0, -0.5, 0.68);
  const geom = new T.ExtrudeGeometry(outline, { depth: 0.32, bevelEnabled: false, curveSegments: 16 });
  geom.translate(0, 0, -0.16); geom.rotateX(-Math.PI / 2);
  return new T.Mesh(geom, mat);
}

export function createYaw(group, mats) {
  const { ring, pinion, module } = YAW;
  const fixed = wheel(group, 'Azimutkranz', ring, module, 0.22, 0.70, mats.gearSteel, 0, 0, 0);
  fixed.rotation.x = -Math.PI / 2;
  const race = node(group, 'Azimutlager', sleeve(0.84, 0.70, 0.14), mats.steelDark, 0, 0.18, 0);
  race.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const { x, z, angle } = yawMount(i);
    const pin = wheel(group, 'Azimutritzel', pinion, module, 0.195, 0.077, mats.steelBright, x, 0, z);
    pin.rotation.order = 'XYZ'; pin.rotation.x = -Math.PI / 2;
    pin.rotation.z = -angle + Math.PI - Math.PI / pinion;
    node(group, 'Ritzelwelle', new T.CylinderGeometry(0.076, 0.076, 0.68, 16), mats.steelBright, x, 0.24, z);
    node(group, 'Azimutgetriebe', new T.CylinderGeometry(0.167, 0.183, 0.16, 20), mats.steelDark, x, 0.65, z);
    node(group, 'Azimutmotor', new T.CylinderGeometry(0.12, 0.12, 0.26, 20), mats.generatorRotor, x, 0.86, z);
  }
}
