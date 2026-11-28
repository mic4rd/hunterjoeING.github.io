import * as T from 'three';

function mesh(parent, name, geometry, mat, x, y, z) {
  const m = new T.Mesh(geometry, mat);
  m.name = name; m.position.set(x, y, z); parent.add(m);
  return m;
}
function box(parent, name, w, h, d, mat, x, y, z) {
  return mesh(parent, name, new T.BoxGeometry(w, h, d), mat, x, y, z);
}

export const TOWER_FLANGES = [-2.6, 0.4, 3.2];

export function createAccess(group, mats, shell, covers) {
  const deck = (y, name, entrance = false) => {
    const r = 1.25 - y / 9.6 * 0.6 - 0.075;
    const shape = new T.Shape();
    shape.absarc(0, 0, r, 0, 2 * Math.PI, false);
    function opening(x, z, w, d) {
      const h = new T.Path();
      h.moveTo(x - w / 2, -z - d / 2); h.lineTo(x - w / 2, -z + d / 2);
      h.lineTo(x + w / 2, -z + d / 2); h.lineTo(x + w / 2, -z - d / 2); h.closePath();
      shape.holes.push(h);
    }
    opening(0, 0.22, 0.63, 0.16); // Cable conduit
    if (!entrance) {
      opening(-0.265, 0.47, 0.42, 0.27);
      opening(0.23, -0.26, 0.53, 0.55);
    }
    const geometry = new T.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2);
    mesh(group, name, geometry, mats.gearSteel, 0, y, 0);
  };
  deck(-4.54, 'Eingangspodest', true);
  for (const y of TOWER_FLANGES) deck(y, 'Ruhepodest');
  deck(4.62, 'Ausstiegspodest');
  for (const x of [-0.42, -0.11]) box(group, 'Leiterholm', 0.035, 10.0, 0.045, mats.steelBright, x, 0.50, 0.45);
  box(group, 'Steigschutzschiene', 0.032, 10.0, 0.035, mats.gearGold, -0.265, 0.50, 0.405);
  const rungs = new T.InstancedMesh(new T.BoxGeometry(0.32, 0.027, 0.046), mats.steelBright, 45);
  const matrix = new T.Matrix4();
  for (let i = 0; i < rungs.count; i++) rungs.setMatrixAt(i, matrix.makeTranslation(-0.265, -4.38 + i * 0.221, 0.45));
  rungs.name = 'Leitersprossen'; group.add(rungs);
  for (const x of [0.008, 0.452]) {
    mesh(group, 'Liftführungsseil', new T.CylinderGeometry(0.010, 0.010, 10.0, 8), mats.steelBright, x, 0.50, -0.26);
  }
  const lift = new T.Group(); lift.name = 'Service-Lift';
  lift.position.set(0.23, -4.48, -0.26); group.add(lift);
  for (const height of [0.05, 0.70]) box(lift, 'Kabinenrahmen', 0.42, 0.07, 0.43, mats.gearGold, 0, height, 0);
  for (const x of [-0.184, 0.184]) for (const z of [-0.18, 0.18])
    box(lift, 'Kabinenstrebe', 0.035, 0.64, 0.035, mats.steelBright, x, 0.375, z);
  box(lift, 'Kabinenrückwand', 0.39, 0.44, 0.027, mats.gearSteel, 0, 0.29, -0.18);
  box(lift, 'Kabinentür', 0.39, 0.19, 0.027, mats.gearGold, 0, 0.19, 0.18);
  const leaf = box(group, 'Turmtür', 0.50, 0.95, 0.055, mats.steelDark.clone(), 0, -4.00, 1.534);
  shell(leaf); covers.push(leaf);
  const handle = box(group, 'Türgriff', 0.085, 0.025, 0.035, mats.gearGold, 0.16, -4.02, 1.577);
  // Hide the handle with its leaf while preserving its own material.
  for (const x of [-0.285, 0.285]) box(group, 'Türzarge', 0.065, 1.07, 0.12, mats.steelBright, x, -4.0, 1.503);
  box(group, 'Türsturz', 0.635, 0.065, 0.12, mats.steelBright, 0, -3.49, 1.503);
  let travel = 0;
  return (dt, open, cut) => {
    handle.visible = cut < 0.92;
    if (open) travel += dt * 0.17;
    lift.position.y = -4.48 + (1 - Math.cos(travel)) * 4.55;
  };
}

export function createWindInstruments(group, mats) {
  const cyl = (parent, name, r, h, mat, x, y, z) => mesh(parent, name, new T.CylinderGeometry(r, r, h, 16), mat, x, y, z);
  cyl(group, 'Mastfuß', 0.11, 0.07, mats.steelDark, 0, 0.035, 0);
  cyl(group, 'Messmast', 0.036, 0.66, mats.steelBright, 0, 0.37, 0);
  box(group, 'Querträger', 0.90, 0.040, 0.055, mats.steelBright, 0, 0.70, 0);
  for (const x of [-0.43, 0.43]) cyl(group, 'Sensorlager', 0.026, 0.13, mats.steelBright, x, 0.78, 0);
  const star = new T.Group(); star.name = 'Schalenstern'; star.position.set(0.43, 0.855, 0); group.add(star);
  cyl(star, 'Sensornabe', 0.045, 0.09, mats.steelDark, 0, 0, 0);
  const cupGeometry = new T.SphereGeometry(0.079, 16, 8, 0, 2 * Math.PI, 0, Math.PI / 2);
  cupGeometry.rotateX(Math.PI / 2);
  const cupMat = mats.steelBright.clone(); cupMat.side = T.DoubleSide; cupMat.color.setHex(0x516373);
  for (let i = 0; i < 3; i++) {
    const arm = new T.Group(); arm.rotation.y = i * 2 * Math.PI / 3; star.add(arm);
    box(arm, 'Schalenarm', 0.234, 0.018, 0.018, mats.steelBright, 0.12, 0, 0);
    mesh(arm, 'Halbkugelschale', cupGeometry, cupMat, 0.236, 0, 0);
  }
  const vane = new T.Group(); vane.name = 'Windfahne'; vane.position.set(-0.43, 0.86, 0); group.add(vane);
  box(vane, 'Fahnenachse', 0.025, 0.025, 0.56, mats.steelBright, 0, 0, 0);
  const point = mesh(vane, 'Pfeilspitze', new T.ConeGeometry(0.058, 0.135, 8), mats.gearGold, 0, 0, 0.263);
  point.rotation.x = Math.PI / 2;
  const fin = new T.Shape();
  fin.moveTo(-0.08, 0); fin.lineTo(-0.31, 0.12); fin.lineTo(-0.31, -0.06); fin.closePath();
  const finGeo = new T.ExtrudeGeometry(fin, { depth: 0.018, bevelEnabled: false });
  finGeo.rotateY(-Math.PI / 2);
  mesh(vane, 'Leitblech', finGeo, mats.gearGold, 0, 0, 0);
  return (dt, wind, time) => {
    star.rotation.y -= dt * wind * 0.65;
    vane.rotation.y = Math.sin(time * 0.72) * 0.065 * Math.min(1, wind / 4);
  };
}
