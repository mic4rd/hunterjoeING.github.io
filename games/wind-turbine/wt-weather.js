// Two smooth transitions preserve distinct calm, overcast and storm conditions.
function smooth(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

export function weatherAt(wind, out = {}) {
  const cloud = smooth((wind - 5) / 9);
  const storm = smooth((wind - 15) / 9);
  out.cloud = cloud;
  out.storm = storm;
  out.wave = 0.035 + 0.16 * cloud + 0.62 * storm;
  out.foam = 0.18 * cloud + 0.70 * storm;
  out.light = 1 - 0.17 * cloud - 0.30 * storm;
  return out;
}

export function settle(current, target, seconds) {
  return current + (target - current) * -Math.expm1(-2.2 * Math.max(0, Math.min(0.25, seconds)));
}
