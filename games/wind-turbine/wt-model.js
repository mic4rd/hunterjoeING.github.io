import * as THREE from 'three';
import { createTurbineAccident } from './wt-explosion.js?v=0.2.0';
import { TURBINE_PARTS } from './wt-data.js?v=0.2.0';
import { ROTOR, bladeRings, spinnerRadius } from './wt-rotor.js?v=0.2.0';

import { createGearbox, createBedplate, createYaw, sleeve } from './wt-gears.js?v=0.2.0';
import { createAccess, createWindInstruments, TOWER_FLANGES } from './wt-service.js?v=0.2.0';

/**
 * Erzeugt ein realistisch profiliertes, verwundenes Rotorblatt (NACA-ähnliches Profil)
 * entlang der +Y-Achse von y = 0 (Wurzel) bis y = length (Blattspitze).
 */
function createAirfoilBladeGeometry() {
  const { spans: spanSegs, profileSegments: profileSegs } = ROTOR;
  const positions = bladeRings(), uvs = [], indices = [];
  for (let i = 0; i <= spanSegs; i++) {
    for (let j = 0; j <= profileSegs; j++) uvs.push(j / profileSegs, i / spanSegs);
  }
  const ring = profileSegs + 1;
  for (let i = 0; i < spanSegs; i++) {
    for (let j = 0; j < profileSegs; j++) {
      const a = i * ring + j;
      const b = (i + 1) * ring + j;
      const c = (i + 1) * ring + (j + 1);
      const d = i * ring + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Erzeugt eine dezente Textur für die Rotorblätter mit roter Warnspitze.
 */
function createBladeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#e2e8f0');
  grad.addColorStop(0.7, '#f8fafc');
  grad.addColorStop(1, '#ffffff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  // Rote Luftfahrt-Warnstreifen nahe der Spitze (v ~ 0.80 bis 1.0 -> y nahe 0 im Canvas wegen flipY)
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 256, 46);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 46, 256, 24);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 70, 256, 32);

  // Schmale graue Schutzkante am GFK-Profil.
  ctx.fillStyle = 'rgba(73, 83, 92, 0.18)';
  ctx.fillRect(0, 0, 4, 512);
  ctx.fillRect(252, 0, 4, 512);

  // Dezente Wartungsmarkierungen
  ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
  ctx.fillRect(0, 446, 256, 4);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Erzeugt eine gebürstete Metall-Textur für Wellen & Gehäuse.
 */
function createBrushedMetalTexture(baseHex = '#94a3b8') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    const alpha = (Math.random() - 0.5) * 0.08;
    ctx.fillStyle = alpha > 0 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${-alpha})`;
    ctx.fillRect(0, y, 256, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function tagPart(obj, partId) {
  obj.traverse(child => {
    if (child.isMesh) {
      child.userData.partId = partId;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

export function createWindTurbineModel() {
  const root = new THREE.Group();
  const partGroups = new Map();
  const basePositions = new Map();
  const shellCutawayMeshes = [];
  const shellXrayRecords = [];
  const allPartMeshes = new Map();

  const bladeTex = createBladeTexture();
  const metalTex = createBrushedMetalTexture('#c6c9cb');

  // Materialien
  const mats = {
    compositeWhite: new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.36,
      metalness: 0.03
    }),
    compositeCutaway: new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.36,
      metalness: 0.03,
      transparent: true,
      opacity: 1
    }),
    bladeMat: new THREE.MeshStandardMaterial({
      map: bladeTex,
      roughness: 0.31,
      metalness: 0.02
    }),
    steelDark: new THREE.MeshStandardMaterial({
      color: 0x525962,
      map: metalTex,
      roughness: 0.38,
      metalness: 0.82
    }),
    steelBright: new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      map: metalTex,
      roughness: 0.24,
      metalness: 0.88
    }),
    gearGold: new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.30,
      metalness: 0.78
    }),
    gearSteel: new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.28,
      metalness: 0.86
    }),
    copper: new THREE.MeshStandardMaterial({
      color: 0xbb683e,
      roughness: 0.26,
      metalness: 0.90,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0
    }),
    generatorRotor: new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.32,
      metalness: 0.72,
      emissive: new THREE.Color(0x0ea5e9),
      emissiveIntensity: 0.25
    }),
    brakeRed: new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.35,
      metalness: 0.45,
      emissive: new THREE.Color(0xef4444),
      emissiveIntensity: 0.0
    }),
    cutEdge: new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.4,
      metalness: 0.2,
      emissive: new THREE.Color(0xf97316),
      emissiveIntensity: 0.18
    }),
    towerMat: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.38,
      metalness: 0.28
    }),
    towerCutaway: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.38,
      metalness: 0.28,
      transparent: true,
      opacity: 1
    }),
    cableCopper: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.85,
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: 0.15
    }),
    substation: new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.48,
      metalness: 0.55
    }),
    beaconRed: new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: new THREE.Color(0xff2222),
      emissiveIntensity: 1.5,
      roughness: 0.2
    }),
    xrayShell: new THREE.MeshMatcapMaterial({
      name: 'xraySmoke', color: 0x555555, transparent: true, opacity: 0.13,
      depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, fog: false
    })
  };
  const xrayFocus = mats.xrayShell.clone();
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x727272, transparent: true, opacity: 0, depthWrite: false, fog: false
  });

  function registerPartGroup(id, group) {
    partGroups.set(id, group);
    root.add(group);
    return group;
  }

  function registerXrayShell(mesh) {
    const line = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 26), edgeMat);
    line.visible = false;
    mesh.add(line);
    shellXrayRecords.push({ mesh, line });
  }

  // =========================================================================
  // 1. ROTORNABE & BLÄTTER (z = +3.9, rotieren um Z-Achse)
  // =========================================================================
  const hubGroup = registerPartGroup('hub', new THREE.Group());
  hubGroup.position.set(0, ROTOR.y, ROTOR.z);

  const rotorSpinGroup = new THREE.Group();
  hubGroup.add(rotorSpinGroup);

  // Innerer Sphäroguss-Nabenkern
  const hubCore = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.78, 1.15, 24), mats.steelDark);
  hubCore.rotation.x = Math.PI / 2;
  rotorSpinGroup.add(hubCore);

  // 3 interne Pitch-Antriebsmotoren + Lagerflansche
  const pitchMotors = [];
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const holder = new THREE.Group();
    holder.rotation.z = angle;

    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.26, 20), mats.gearGold);
    ring.position.set(0, 0.72, 0);
    holder.add(ring);

    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.45, 16), mats.generatorRotor);
    motor.position.set(0.24, 0.45, 0.12);
    holder.add(motor);
    pitchMotors.push(motor);

    rotorSpinGroup.add(holder);
  }

  // Aerodynamischer Spinner (2 Halbschalen für Cutaway!)
  const spinnerPoints = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const y = -0.65 + t * 2.25;
    const r = spinnerRadius(y);
    spinnerPoints.push(new THREE.Vector2(r, y));
  }
  const spinnerBackGeo = new THREE.LatheGeometry(spinnerPoints, 28, Math.PI * 0.5, Math.PI);
  const spinnerBack = new THREE.Mesh(spinnerBackGeo, mats.compositeWhite.clone());
  spinnerBack.rotation.x = Math.PI / 2;
  rotorSpinGroup.add(spinnerBack);
  registerXrayShell(spinnerBack);

  const spinnerFrontGeo = new THREE.LatheGeometry(spinnerPoints, 28, -Math.PI * 0.5, Math.PI);
  const spinnerFront = new THREE.Mesh(spinnerFrontGeo, mats.compositeCutaway.clone());
  spinnerFront.rotation.x = Math.PI / 2;
  rotorSpinGroup.add(spinnerFront);
  shellCutawayMeshes.push(spinnerFront);
  registerXrayShell(spinnerFront);

  // 2. ROTORBLÄTTER (eigene Explosionsgruppe, folgt Rotation der Nabe!)
  const bladesGroup = registerPartGroup('blades', new THREE.Group());
  bladesGroup.position.set(0, ROTOR.y, ROTOR.z);
  const bladesSpinGroup = new THREE.Group();
  bladesGroup.add(bladesSpinGroup);

  const bladeGeo = createAirfoilBladeGeometry();
  const bladePitchPivots = [];
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI * 2) / 3;

    const pitchPivot = new THREE.Group();
    pitchPivot.position.set(0, ROTOR.root, 0);

    const bladeMesh = new THREE.Mesh(bladeGeo, mats.bladeMat);
    pitchPivot.add(bladeMesh);

    const rootCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.29, 0.24, 18), mats.steelBright);
    rootCollar.position.y = 0.04;
    pitchPivot.add(rootCollar);

    arm.add(pitchPivot);
    bladesSpinGroup.add(arm);
    bladePitchPivots.push(pitchPivot);
  }

  // =========================================================================
  // 3. HAUPTWELLE & HAUPTLAGER
  // =========================================================================
  const mainShaftGroup = registerPartGroup('mainShaft', new THREE.Group());
  mainShaftGroup.position.set(0, 0.25, 2.2);

  const mainShaftSpin = new THREE.Group();
  const shaftCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.30, 2.3, 24), mats.steelBright);
  shaftCyl.name = 'Hauptwelle';
  shaftCyl.rotation.x = Math.PI / 2;
  mainShaftSpin.add(shaftCyl);

  const flangeFront = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.18, 24), mats.steelDark);
  flangeFront.rotation.x = Math.PI / 2;
  flangeFront.position.z = 0.95;
  mainShaftSpin.add(flangeFront);
  mainShaftGroup.add(mainShaftSpin);

  // Hauptlagerbock (stationär)
  const bearingHousing = new THREE.Mesh(sleeve(0.56, 0.308, 0.55), mats.steelDark);
  bearingHousing.position.z = 0.35;
  mainShaftGroup.add(bearingHousing);

  const bearingFoot = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.38, 0.62), mats.steelDark);
  bearingFoot.position.set(0, -0.75, 0.35);
  mainShaftGroup.add(bearingFoot);

  // =========================================================================
  // 4. PLANETENSTUFE UND ZWEI STIRNRADSTUFEN
  // =========================================================================
  const gearboxGroup = registerPartGroup('gearbox', new THREE.Group());
  gearboxGroup.position.set(0, 0.25, 0.45);

  const updateGears = createGearbox(gearboxGroup, mats, registerXrayShell, shellCutawayMeshes);

  // =========================================================================
  // 5. SCHEIBENBREMSE (Geometrie vorgekippt -> rotation.z dreht exakt um Z-Achse!)
  // =========================================================================
  const brakeGroup = registerPartGroup('brake', new THREE.Group());
  brakeGroup.position.set(0, 0.25, -0.78);

  const brakeDiscGeo = sleeve(0.46, 0.111, 0.08);
  const brakeDisc = new THREE.Mesh(brakeDiscGeo, mats.steelBright);
  brakeDisc.name = 'Bremsscheibe';
  brakeGroup.add(brakeDisc);

  const brakeCaliper = new THREE.Group();
  for (const z of [-0.087, 0.087]) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.20, 0.086), mats.brakeRed);
    pad.position.z = z;
    brakeCaliper.add(pad);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.20, 0.26), mats.brakeRed);
  bridge.position.x = 0.17;
  brakeCaliper.add(bridge);
  brakeCaliper.position.set(0.38, 0.24, 0);
  brakeGroup.add(brakeCaliper);

  // =========================================================================
  // 6. SCHNELLE GENERATORWELLE (Geometrie vorgekippt -> rotation.z dreht exakt um Z-Achse!)
  // =========================================================================
  const highSpeedGroup = registerPartGroup('highSpeedShaft', new THREE.Group());
  highSpeedGroup.position.set(0, 0.25, -1.18);

  const hsShaftGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.335, 24);
  hsShaftGeo.rotateX(Math.PI / 2);
  const hsShaft = new THREE.Mesh(hsShaftGeo, mats.steelBright);
  hsShaft.name = 'Schnelle Welle';
  hsShaft.position.z = 0.2075;
  highSpeedGroup.add(hsShaft);

  const hsCouplingGeo = sleeve(0.22, 0.111, 0.28);
  const hsCoupling = new THREE.Mesh(hsCouplingGeo, mats.gearGold);
  hsCoupling.name = 'Kupplung';
  hsCoupling.position.z = -0.07;
  highSpeedGroup.add(hsCoupling);

  // =========================================================================
  // 7. GENERATOR (Stator-Kupferwicklungen + rotierender Läufer)
  // =========================================================================
  const generatorGroup = registerPartGroup('generator', new THREE.Group());
  generatorGroup.position.set(0, 0.25, -2.42);

  // Generator-Hintergehäuse (links -x immer sichtbar)
  const genShellBack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.86, 0.86, 1.85, 28, 1, true, Math.PI, Math.PI),
    mats.steelDark.clone()
  );
  genShellBack.rotation.x = Math.PI / 2;
  generatorGroup.add(genShellBack);
  registerXrayShell(genShellBack);

  // Generator-Cutaway-Halbschale (rechts +x öffnet im Cutaway!)
  const genShellFront = new THREE.Mesh(
    new THREE.CylinderGeometry(0.86, 0.86, 1.85, 28, 1, true, 0, Math.PI),
    mats.steelDark.clone()
  );
  genShellFront.rotation.x = Math.PI / 2;
  generatorGroup.add(genShellFront);
  shellCutawayMeshes.push(genShellFront);
  registerXrayShell(genShellFront);

  // 12 radiale Kupfer-Statorspulen
  const statorCoils = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const coil = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.24, 1.48), mats.copper);
    coil.position.set(Math.cos(a) * 0.64, Math.sin(a) * 0.64, 0);
    coil.rotation.z = a;
    statorCoils.add(coil);
  }
  generatorGroup.add(statorCoils);

  // Rotierender elektromagnetischer Generator-Läufer
  const genRotorGroup = new THREE.Group();
  genRotorGroup.name = 'Generatorläufer';
  const genRotorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.56, 20), mats.generatorRotor);
  genRotorCore.rotation.x = Math.PI / 2;
  genRotorGroup.add(genRotorCore);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 1.5), mats.steelBright);
    pole.position.set(Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0);
    pole.rotation.z = a;
    genRotorGroup.add(pole);
  }
  generatorGroup.add(genRotorGroup);

  // =========================================================================
  // 8. GONDELGEHÄUSE (Maschinenhaus mit Cutaway-Seitenwand & Bodenplatte)
  // =========================================================================
  const nacelleGroup = registerPartGroup('nacelle', new THREE.Group());
  nacelleGroup.position.set(0, 0.25, -0.3);

  // Maschinenträger / Grundrahmen (bleibt sichtbar als stabile Plattform)
  const bedplate = createBedplate(mats.steelDark);
  bedplate.name = 'Maschinenträger';
  bedplate.position.set(0, -1.16, -0.2);
  nacelleGroup.add(bedplate);

  // Rückseite + Dach + linke Seitenwand der Gondel (bleibt im Cutaway stehen!)
  const nacelleBackWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.32, 6.85), mats.compositeWhite.clone());
  nacelleBackWall.position.set(-1.26, 0.12, -0.2);
  nacelleGroup.add(nacelleBackWall);
  registerXrayShell(nacelleBackWall);

  const nacelleRearCap = new THREE.Mesh(new THREE.BoxGeometry(2.68, 2.32, 0.22), mats.compositeWhite.clone());
  nacelleRearCap.position.set(0, 0.12, -3.58);
  nacelleGroup.add(nacelleRearCap);
  registerXrayShell(nacelleRearCap);

  const nacelleFrontRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.12, 12, 32), mats.compositeWhite.clone());
  nacelleFrontRing.position.set(0, 0.0, 3.22);
  nacelleGroup.add(nacelleFrontRing);
  registerXrayShell(nacelleFrontRing);

  // Dachhälfte links (bleibt) + Dachhälfte rechts & rechte Wand (klappen/blenden im Cutaway weg!)
  const nacelleRoofBack = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.16, 6.85), mats.compositeWhite.clone());
  nacelleRoofBack.position.set(-0.66, 1.32, -0.2);
  nacelleGroup.add(nacelleRoofBack);
  registerXrayShell(nacelleRoofBack);

  const nacelleCutawayCover = new THREE.Group();
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.32, 6.85), mats.compositeCutaway.clone());
  rightWall.position.set(1.26, 0.12, -0.2);
  nacelleCutawayCover.add(rightWall);
  shellCutawayMeshes.push(rightWall);
  registerXrayShell(rightWall);

  const rightRoof = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.16, 6.85), mats.compositeCutaway.clone());
  rightRoof.position.set(0.66, 1.32, -0.2);
  nacelleCutawayCover.add(rightRoof);
  shellCutawayMeshes.push(rightRoof);
  registerXrayShell(rightRoof);

  // Dezenter blauer Design-Streifen außen auf der Gondel
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.24, 5.9),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, transparent: true, opacity: 1 })
  );
  stripe.position.set(1.36, 0.18, -0.2);
  nacelleCutawayCover.add(stripe);
  shellCutawayMeshes.push(stripe);
  registerXrayShell(stripe);
  nacelleGroup.add(nacelleCutawayCover);

  // Orangefarbene Schnittkante (sichtbar im Cutaway!)
  const cutTrimMat = mats.cutEdge.clone();
  cutTrimMat.transparent = true;
  cutTrimMat.opacity = 0;
  const cutTrimTop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 6.85), cutTrimMat);
  cutTrimTop.position.set(0.02, 1.32, -0.2);
  nacelleGroup.add(cutTrimTop);
  const cutTrimBottom = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 6.75), cutTrimMat);
  cutTrimBottom.position.set(1.18, -1.04, -0.2);
  nacelleGroup.add(cutTrimBottom);

  // Kühler-Lamellen auf dem Heck + Warnfeuer
  const cooler = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 1.25), mats.steelDark);
  cooler.position.set(0, 1.58, -2.55);
  nacelleGroup.add(cooler);

  const beaconPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 10), mats.steelBright);
  beaconPole.position.set(-0.6, 1.68, -2.8);
  nacelleGroup.add(beaconPole);
  const beaconLightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), mats.beaconRed);
  beaconLightMesh.position.set(-0.6, 1.98, -2.8);
  nacelleGroup.add(beaconLightMesh);

  // =========================================================================
  // 9. ANEMOMETER & WINDFAHNE
  // =========================================================================
  const anemoGroup = registerPartGroup('anemometer', new THREE.Group());
  anemoGroup.position.set(0.10, 1.65, -3.64);
  const updateInstruments = createWindInstruments(anemoGroup, mats);

  // =========================================================================
  // 10. AZIMUTANTRIEB (YAW RING + 4 MOTOREN)
  // =========================================================================
  const yawGroup = registerPartGroup('yawDrive', new THREE.Group());
  yawGroup.position.set(0, -1.32, 0);

  createYaw(yawGroup, mats);

  // =========================================================================
  // 11. STAHLROHRTURM & 3-PHASEN-LEITUNGEN
  // =========================================================================
  const towerGroup = registerPartGroup('tower', new THREE.Group());
  towerGroup.position.set(0, -6.25, 0);

  // Rückhälfte des Turms (bleibt sichtbar)
  const towerBack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.55, 9.6, 32, 1, true, Math.PI * 0.65, Math.PI * 1.15),
    mats.towerMat.clone()
  );
  towerGroup.add(towerBack);
  registerXrayShell(towerBack);

  // Vorderes Turm-Segment (öffnet sich im Cutaway um Stromkabel zu zeigen!)
  const towerFront = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.55, 9.6, 32, 1, true, -Math.PI * 0.2, Math.PI * 0.85),
    mats.towerCutaway.clone()
  );
  towerGroup.add(towerFront);
  shellCutawayMeshes.push(towerFront);
  registerXrayShell(towerFront);

  const towerFlange = new THREE.Mesh(sleeve(0.99, 0.70, 0.02), mats.steelBright);
  towerFlange.name = 'Turmkopfflansch';
  towerFlange.rotation.x = -Math.PI / 2;
  towerFlange.position.y = 4.81;
  towerGroup.add(towerFlange);

  // Flanschringe am Turm
  TOWER_FLANGES.forEach(ry => {
    const rad = 1.25 - (ry / 9.6) * 0.6;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rad + 0.04, 0.055, 10, 32), mats.steelBright);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = ry;
    towerGroup.add(ring);
  });

  // 3 interne Hochstrom-Kupferschienen im Turm
  for (let i = -1; i <= 1; i++) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 9.4, 10), mats.cableCopper);
    cable.position.set(i * 0.22, 0, 0.22);
    towerGroup.add(cable);
  }

  // Fundament-Sockel & Eingangstür
  const foundation = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.75, 0.72, 32), mats.steelDark);
  foundation.position.y = -4.95;
  towerGroup.add(foundation);

  const accessGroup = registerPartGroup('serviceAccess', new THREE.Group());
  accessGroup.position.copy(towerGroup.position);
  const updateAccess = createAccess(accessGroup, mats, registerXrayShell, shellCutawayMeshes);

  // Animierte Strom-Impulse (fließen im Turm nach unten & zum Transformator!)
  const energyPulseGroup = new THREE.Group();
  const pulseGeo = new THREE.SphereGeometry(0.11, 12, 12);
  const pulseMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 });
  const energyPulses = [];
  for (let i = 0; i < 18; i++) {
    const p = new THREE.Mesh(pulseGeo, pulseMat);
    energyPulseGroup.add(p);
    energyPulses.push({ mesh: p, phase: i / 18, lane: (i % 3) - 1 });
  }
  root.add(energyPulseGroup);

  // =========================================================================
  // 12. TRANSFORMATOR & NETZEINSPEISUNG
  // =========================================================================
  const trafoGroup = registerPartGroup('transformer', new THREE.Group());
  trafoGroup.position.set(2.55, -10.3, 0.25);

  const trafoBox = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.35, 1.45), mats.substation);
  trafoGroup.add(trafoBox);

  // Kühlrippen am Transformator
  for (let i = -3; i <= 3; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 1.56), mats.steelBright);
    fin.position.set(i * 0.22, 0, 0);
    trafoGroup.add(fin);
  }
  // 3 Hochspannungs-Isolatoren oben
  for (let i = -1; i <= 1; i++) {
    const iso = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.42, 12), mats.copper);
    iso.position.set(i * 0.36, 0.88, 0);
    trafoGroup.add(iso);
  }
  // Verbindungskanal zum Turm & Netzkabel nach außen
  const linkPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.6, 12), mats.steelDark);
  linkPipe.rotation.z = Math.PI / 2;
  linkPipe.position.set(-1.35, -0.32, 0);
  trafoGroup.add(linkPipe);

  const gridOutPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.2, 12), mats.cableCopper);
  gridOutPipe.rotation.z = Math.PI / 2;
  gridOutPipe.position.set(1.85, -0.45, 0);
  trafoGroup.add(gridOutPipe);

  // =========================================================================
  // STUDIOLANDSCHAFT / PODEST
  // =========================================================================
  const groundGroup = new THREE.Group();
  const basePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(9.5, 9.8, 0.32, 64),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.78, metalness: 0.15 })
  );
  basePlate.position.y = -11.42;
  basePlate.receiveShadow = true;
  groundGroup.add(basePlate);

  const ringAccent = new THREE.Mesh(
    new THREE.RingGeometry(8.9, 9.12, 64),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  ringAccent.rotation.x = -Math.PI / 2;
  ringAccent.position.y = -11.24;
  groundGroup.add(ringAccent);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160),
    new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -11.59;
  floor.receiveShadow = true;
  groundGroup.add(floor);
  root.add(groundGroup);

  // Tag alle Baugruppen für Klick-Raycasting & Highlighting + Basispositionen sichern
  for (const [id, group] of partGroups.entries()) {
    basePositions.set(id, group.position.clone());
    tagPart(group, id);
    const meshes = [];
    group.traverse(child => {
      if (child.isMesh) meshes.push(child);
    });
    allPartMeshes.set(id, meshes);
  }

  // Zustand für sanfte Übergänge
  const state = {
    viewMode: 'normal',
    cutawayTarget: 0,
    cutawayCurrent: 0,
    xrayTarget: 0,
    xrayCurrent: 0,
    rotorAngle: 0,
    currentPitchRad: 0,
    selectedPart: null,
    showFlow: true,
    time: 0
  };

  function setViewMode(mode) {
    state.viewMode = mode;
    state.cutawayTarget = mode === 'cutaway' ? 1 : 0;
    state.xrayTarget = mode === 'xray' ? 1 : 0;
  }

  const animatedMats = new Set([mats.generatorRotor, mats.copper, mats.brakeRed, mats.beaconRed, mats.xrayShell]);

  for (const [id, meshes] of allPartMeshes.entries()) {
    const clonedForPart = new Map();
    for (const m of meshes) {
      if (!m.material || !m.material.emissive || animatedMats.has(m.material)) continue;
      if (m === beaconLightMesh || m === genRotorCore || m === brakeCaliper) continue;
      if (!m.material.userData?._isolatedPartId) {
        let clone = clonedForPart.get(m.material);
        if (!clone) {
          clone = m.material.clone();
          clone.userData = {
            ...(m.material.userData || {}),
            _isolatedPartId: id,
            _baseEmissiveHex: clone.emissive.getHex(),
            _baseEmissiveIntensity: clone.emissiveIntensity || 0
          };
          clonedForPart.set(m.material, clone);
        }
        m.material = clone;
      }
    }
  }

  for (const rec of shellXrayRecords) rec.normalMat = rec.mesh.material;
  const highlights = new Map();
  for (const [id, meshes] of allPartMeshes) {
    highlights.set(id, new Set(meshes.map(m => m.material).filter(m => m.userData._isolatedPartId)));
  }
  function setSelectedPart(partId) {
    state.selectedPart = partId;
    for (const [id, materials] of highlights) {
      for (const mat of materials) {
        mat.emissive.setHex(id === partId ? 0x2563eb : mat.userData._baseEmissiveHex);
        mat.emissiveIntensity = id === partId ? 0.38 : mat.userData._baseEmissiveIntensity;
      }
    }
  }

  function setFlowVisible(visible) {
    state.showFlow = visible;
    energyPulseGroup.visible = visible && accident.state.phase === 'idle';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    basePlate.material.color.setHex(isDark ? 0x162033 : 0xdbe3ee);
    ringAccent.material.color.setHex(isDark ? 0x38bdf8 : 0x1e3a8a);
    floor.material.color.setHex(isDark ? 0x171f2b : 0xd9e0e8);
    mats.xrayShell.color.setHex(isDark ? 0x808080 : 0x555555);
    xrayFocus.color.setHex(isDark ? 0xd4d4d4 : 0x989898);
    edgeMat.color.setHex(isDark ? 0xbcbcbc : 0x727272);
  }

  const anchorOffsets = new Map(TURBINE_PARTS.map(part => [part.id, new THREE.Vector3(...part.anchor)]));
  function getPartWorldAnchor(partId, out = new THREE.Vector3()) {
    const group = partGroups.get(partId);
    if (!group) return out.set(0, 0, 0);
    return out.copy(group.position).sub(basePositions.get(partId)).add(anchorOffsets.get(partId));
  }
  const accident = createTurbineAccident({
    root, groups: partGroups, blades: bladePitchPivots, spinning: [rotorSpinGroup, bladesSpinGroup, mainShaftSpin],
    brake: brakeCaliper, shells: shellXrayRecords, hidden: [energyPulseGroup, cutTrimTop, cutTrimBottom],
    floorY: basePlate.position.y + basePlate.geometry.parameters.height / 2, win: globalThis.window
  });
  const trafoDelta = new THREE.Vector3();
  const flowPose = {};

  function update(dt, telemetry) {
    if (accident.state.phase !== 'idle') {
      accident.update(dt);
      return flowPose;
    }
    const viewDt = Math.min(0.25, dt);
    const clampedDt = Math.min(0.05, dt);
    state.time += clampedDt;

    // Sanfte, zügige Übergänge für Cutaway und X-Ray
    const lerpSpeed = Math.min(1, viewDt * 8.5);
    state.cutawayCurrent += (state.cutawayTarget - state.cutawayCurrent) * lerpSpeed;
    state.xrayCurrent += (state.xrayTarget - state.xrayCurrent) * lerpSpeed;
    if (Math.abs(state.cutawayTarget - state.cutawayCurrent) < 0.015) state.cutawayCurrent = state.cutawayTarget;
    if (Math.abs(state.xrayTarget - state.xrayCurrent) < 0.015) state.xrayCurrent = state.xrayTarget;

    // 2) X-Ray-Material umschalten (vor Cutaway-Transparenz anwenden!)
    const useXray = state.xrayCurrent > 0.18;
    mats.xrayShell.opacity = 0.04 + state.xrayCurrent * 0.09;
    xrayFocus.opacity = mats.xrayShell.opacity * 1.35;
    edgeMat.opacity = state.xrayCurrent * 0.48;
    for (const rec of shellXrayRecords) {
      const shell = rec.mesh.userData.partId === state.selectedPart ? xrayFocus : mats.xrayShell;
      rec.mesh.material = useXray ? shell : rec.normalMat;
      rec.mesh.castShadow = !useXray;
      rec.line.visible = useXray;
    }

    // 3) Cutaway-Deckel weich ausblenden (mit needsUpdate beim Wechsel transparent)
    const cutAlpha = 1 - state.cutawayCurrent;
    for (const mesh of shellCutawayMeshes) {
      if (useXray) {
        mesh.visible = true;
      } else {
        mesh.visible = cutAlpha > 0.04;
        if (mesh.material && mesh.material !== mats.xrayShell) {
          const wantTrans = state.cutawayCurrent > 0.01;
          if (mesh.material.transparent !== wantTrans) {
            mesh.material.transparent = wantTrans;
            mesh.material.needsUpdate = true;
          }
          mesh.material.opacity = cutAlpha;
          mesh.material.depthWrite = !wantTrans;
        }
      }
    }
    cutTrimTop.visible = cutTrimBottom.visible = state.cutawayCurrent > 0.01;
    cutTrimTop.material.opacity = cutTrimBottom.material.opacity = state.cutawayCurrent * (1 - state.xrayCurrent);

    // 4) Mechanische Rotation (Rotor, Wellen, verzahnte Zahnräder, Generator)
    // Visuelle Skalierung: 14.8 U/min = ca. 1.55 rad/s (realistisch & angenehm fürs Auge!)
    const rotorOmega = (telemetry.rotorRpm * Math.PI * 2) / 60;
    state.rotorAngle += ROTOR.spinSign * rotorOmega * clampedDt;
    rotorSpinGroup.rotation.z = state.rotorAngle;
    bladesSpinGroup.rotation.z = state.rotorAngle;
    mainShaftSpin.rotation.z = state.rotorAngle;

    const highSpeedAngle = updateGears(state.rotorAngle);
    brakeDisc.rotation.z = highSpeedAngle;
    hsShaft.rotation.z = highSpeedAngle;
    hsCoupling.rotation.z = highSpeedAngle;
    genRotorGroup.rotation.z = highSpeedAngle;

    // 5) Aktive Pitch-Blattverstellung (sanft interpoliert!)
    const targetPitchRad = THREE.MathUtils.degToRad(telemetry.pitchDeg);
    state.currentPitchRad += (targetPitchRad - state.currentPitchRad) * Math.min(1, clampedDt * 4.0);
    for (const pivot of bladePitchPivots) {
      pivot.rotation.y = state.currentPitchRad;
    }

    updateInstruments(clampedDt, telemetry.windSpeed, state.time);
    updateAccess(clampedDt, useXray || state.cutawayCurrent > 0.1, state.cutawayCurrent);

    // 7) Generator-Induktionsglühen & Bremsen-Status
    const loadRatio = telemetry.powerMW / 3.6;
    mats.generatorRotor.emissiveIntensity = 0.12 + loadRatio * 1.35;
    mats.copper.emissive.setHex(0xb75a28);
    mats.copper.emissiveIntensity = loadRatio * 0.42;
    mats.brakeRed.emissiveIntensity = telemetry.brakeActive ? 0.6 + 0.4 * Math.sin(state.time * 8) : 0.0;
    brakeCaliper.position.x = telemetry.brakeActive ? 0.34 : 0.39;

    // Warnfeuer blinkt rhythmisch
    const blink = Math.sin(state.time * 3.1) > 0.35 ? 2.2 : 0.15;
    mats.beaconRed.emissiveIntensity = blink;

    flowPose.angle = state.rotorAngle;
    flowPose.pitch = state.currentPitchRad;
    flowPose.bladeZ = bladesGroup.position.z;
    flowPose.hubZ = hubGroup.position.z;
    flowPose.towerY = towerGroup.position.y;
    flowPose.nacelleY = nacelleGroup.position.y;
    flowPose.nacelleZ = nacelleGroup.position.z;

    if (!state.showFlow) energyPulseGroup.visible = false;
    if (state.showFlow) {
      // 9) Elektrische Energie-Impulse (sichtbar in Cutaway und X-Ray)
      const interiorOpen = state.cutawayCurrent > 0.1 || state.xrayCurrent > 0.1;
      const flowActive = loadRatio > 0.01 && interiorOpen;
      energyPulseGroup.visible = flowActive;
      if (flowActive) {
        pulseMat.opacity = 0.45 + loadRatio * 0.55;
        const speed = 0.22 + loadRatio * 0.58;
        const towerDeltaY = towerGroup.position.y - basePositions.get('tower').y;
        trafoDelta.copy(trafoGroup.position).sub(basePositions.get('transformer'));

        for (const p of energyPulses) {
          p.phase = (p.phase + speed * clampedDt) % 1;
          const t = p.phase;
          if (t < 0.18) {
            // Generator nach vorne zum Turmkopf
            const k = t / 0.18;
            p.mesh.position.set(p.lane * 0.16, 0.2 - k * 1.4, -2.2 + k * 2.4);
          } else if (t < 0.78) {
            // Durch den Turm nach unten
            const k = (t - 0.18) / 0.60;
            p.mesh.position.set(p.lane * 0.22, -1.2 - k * 9.3 + towerDeltaY * 0.5, 0.22);
          } else {
            // Vom Turmfuß durch den Transformator ins Netz
            const k = (t - 0.78) / 0.22;
            p.mesh.position.set(
              0.2 + k * 4.9 + trafoDelta.x * k,
              -10.65 + trafoDelta.y * k,
              0.25 + trafoDelta.z * k
            );
          }
          const scale = 0.7 + loadRatio * 0.65;
          p.mesh.scale.setScalar(scale);
        }
      }
    }
    return flowPose;
  }

  return {
    root,
    accident,
    setViewMode,
    setSelectedPart,
    setFlowVisible,
    applyTheme,
    getPartWorldAnchor,
    update
  };
}
