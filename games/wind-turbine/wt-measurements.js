import * as T from 'three';
import { ROTOR, RADIUS } from './wt-rotor.js?v=0.2.0';
import { sampleSection } from './wt-airflow.js?v=0.2.0';
import { axialInduction } from './wt-froude.js?v=0.2.0';
import { SECTION_OFFSETS } from './wt-camera.js?v=0.2.0';
// Earlier pages on the same 0.2.0 test branch import the projection from here.
export { frameTourContent } from './wt-camera.js?v=0.2.0';

function makeLabel(text, doc) {
  const canvas = doc.createElement('canvas');
  canvas.width = 160; canvas.height = 88;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(19,37,56,.90)'; ctx.fillRect(0, 0, 160, 88);
  ctx.fillStyle = '#f4f9ff'; ctx.font = 'bold 58px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('v', 65, 42);
  ctx.font = 'bold 32px sans-serif'; ctx.fillText(text, 97, 58);
  const tex = new T.CanvasTexture(canvas); tex.colorSpace = T.SRGBColorSpace;
  const sprite = new T.Sprite(new T.SpriteMaterial({ map: tex, depthWrite: false, toneMapped: false, sizeAttenuation: false }));
  sprite.scale.set(.041, .023, 1);
  return sprite;
}

export function createMeasurements(doc) {
  const group = new T.Group(), circle = new T.RingGeometry(.985, 1.015, 100);
  group.visible = false;
  const stations = [['1', 0x0ba6b8], ['R', 0x398ba8], ['3', 0x3666c5]].map(([label, color], i) => {
    const xi = SECTION_OFFSETS[i];
    const ring = new T.Mesh(circle, new T.MeshBasicMaterial({ color, side: T.DoubleSide, transparent: true, opacity: .70, depthWrite: false }));
    const badge = makeLabel(label, doc);
    ring.position.set(0, ROTOR.y, ROTOR.z - xi * RADIUS);
    group.add(ring, badge);
    return { xi, ring, badge };
  });
  const section = {};
  function set(active, tel) {
    group.visible = active;
    if (!active) return;
    const a = axialInduction(tel);
    for (const { xi, ring, badge } of stations) {
      const r = sampleSection(section, xi * RADIUS, a).tube;
      ring.scale.set(r, r, 1);
      badge.position.set(r * .60, ROTOR.y + r * .80, ring.position.z);
    }
  }
  function resizeLabels(height, camera) {
    const unit = 2 * Math.tan(T.MathUtils.degToRad(camera.getEffectiveFOV() / 2)) / height;
    for (const { badge } of stations) badge.scale.set(36 * unit, 20 * unit, 1);
  }
  return { group, set, resizeLabels };
}
