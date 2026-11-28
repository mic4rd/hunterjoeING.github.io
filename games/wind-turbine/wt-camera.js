import * as T from 'three';
import { ROTOR, RADIUS } from './wt-rotor.js?v=0.2.0';
import { sampleSection } from './wt-airflow.js?v=0.2.0';
import { TURBINE_TOUR_STEPS } from './wt-data.js?v=0.2.0';
import { BASE_Y } from './wt-terrain.js?v=0.2.0';

// A slightly upward view from the land side keeps the sea horizon below the hub.
export const COAST_VIEW = { pos: [23, -5.05, 21.3], target: [0, -1.2, 2] };
export const SECTION_OFFSETS = [-1.70, 0, 1.85];

export function frameTourContent(camera, width, height, top = 0, bottom = height) {
  camera.aspect = width / height;
  camera.zoom = Math.max(.12, (bottom - top) / height);
  if (top === 0 && bottom === height) camera.clearViewOffset();
  else camera.setViewOffset(width, height, 0, (height - top - bottom) / 2, width, height);
  camera.updateProjectionMatrix();
}

// Frame the swept rotor and the footprint at any blade angle. In the lesson,
// allow the largest ring at each section from zero induction to the Betz optimum.
const turbine = [], rings = [];
function circle(points, radius, y, z, horizontal = false) {
  for (let i = 0; i < 64; i++) {
    const angle = i * Math.PI / 32, a = radius * Math.cos(angle), b = radius * Math.sin(angle);
    points.push(new T.Vector3(a, horizontal ? y : y + b, horizontal ? z + b : z));
  }
}
circle(turbine, RADIUS, ROTOR.y, ROTOR.z);
circle(turbine, 2.75, BASE_Y, 0, true);
turbine.push(new T.Vector3(4.8, BASE_Y, 1.1));
for (const xi of SECTION_OFFSETS) {
  const maxRadius = Math.max(RADIUS, sampleSection({}, xi * RADIUS, 1 / 3).tube);
  circle(rings, maxRadius * 1.015, ROTOR.y, ROTOR.z - xi * RADIUS);
}
const lesson = TURBINE_TOUR_STEPS.find(step => step.lesson === 'froude');
const portraitEye = new T.Vector3(...(lesson.portraitPos ?? lesson.cameraPos));
const portraitTarget = new T.Vector3(...(lesson.portraitTarget ?? lesson.cameraTarget));
const back = new T.Vector3(), right = new T.Vector3(), up = new T.Vector3(), delta = new T.Vector3();
export function fitOverview(position, target, camera, preset) {
  if (preset === 'rings') {
    // A three-quarter view uses more of a portrait screen for the rotor while
    // keeping the three labelled sections separated horizontally.
    const portrait = 1 - T.MathUtils.smoothstep(camera.aspect / camera.zoom, 1.13, 1.85);
    position.fromArray(lesson.cameraPos).lerp(portraitEye, portrait);
    target.fromArray(lesson.cameraTarget).lerp(portraitTarget, portrait);
  }
  back.subVectors(position, target).normalize();
  right.set(back.z, 0, -back.x).normalize();
  up.crossVectors(back, right);
  const tangent = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
  const vertical = tangent * (preset === 'outside' ? .995 : .93);
  const horizontal = tangent * camera.aspect / camera.zoom * .93;
  let distance = 0;
  function include(points) {
    for (const p of points) {
      delta.subVectors(p, target);
      const span = Math.max(Math.abs(delta.dot(up)) / vertical, Math.abs(delta.dot(right)) / horizontal);
      distance = Math.max(distance, delta.dot(back) + span);
    }
  }
  include(turbine);
  if (preset === 'rings') include(rings);
  position.copy(target).addScaledVector(back, distance);
}
