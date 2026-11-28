// Maße des gezeichneten Modells (Szeneneinheiten). +Z zeigt zum anströmenden Wind.
export const ROTOR = Object.freeze({
  y: 0.25, z: 3.85, root: 0.82, length: 8.6, spinSign: -1,
  spans: 26, profileSegments: 24
});
export const RADIUS = ROTOR.root + ROTOR.length;

export function spinnerRadius(z) {
  return Math.max(0.02, 1.16 * Math.pow(1 - Math.max(0, Math.min(1, (z + 0.65) / 2.25)), 0.56));
}

// Profilringe in Blattkoordinaten vor dem Pitch. Dieselben Stützpunkte bilden
// die sichtbaren Dreiecke und die Querschnitte für die Partikelkollision.
export function bladeRings() {
  const vertices = [];
  for (let i = 0; i <= ROTOR.spans; i++) {
    const t = i / ROTOR.spans;
    const blend = Math.max(0, Math.min(1, (t - 0.04) / 0.14));
    const chord = t < 0.18 ? 0.36 + t / 0.18 * 0.42 : 0.78 * (1 - (t - 0.18) / 0.85) ** 0.78 + 0.07;
    const thickness = t < 0.18 ? 0.36 * (1 - blend) + chord * 0.26 * blend : chord * (0.24 - t * 0.11);
    const twist = (16 * (1 - t) ** 1.35 - 2) * Math.PI / 180;
    for (let j = 0; j <= ROTOR.profileSegments; j++) {
      const angle = j / ROTOR.profileSegments * Math.PI * 2;
      const s = (1 - Math.cos(angle)) / 2;
      const half = 5 * thickness * (0.2969 * Math.sqrt(s) - 0.126 * s -
        0.3516 * s ** 2 + 0.2843 * s ** 3 - 0.1015 * s ** 4);
      const x = Math.cos(angle) * 0.18 * (1 - blend) + (0.30 - s) * chord * blend;
      const z = Math.sin(angle) * 0.18 * (1 - blend) +
        (0.045 * chord * Math.sin(Math.PI * s) + (angle <= Math.PI ? half : -half)) * blend;
      vertices.push(x * Math.cos(twist) + z * Math.sin(twist), t * ROTOR.length,
        -x * Math.sin(twist) + z * Math.cos(twist) + 0.22 * t ** 2.2);
    }
  }
  return vertices;
}
