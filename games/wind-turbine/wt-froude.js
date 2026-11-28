import { TURBINE_SPECS } from './wt-data.js?v=0.2.0';

export const betzCp = x => (1 + x) * (1 - x * x) / 2;
export const BETZ = betzCp(1 / 3);
export function axialInduction(telemetry) {
  const v = telemetry.windSpeed;
  if (telemetry.status === 'partial') {
    const t = Math.max(0, Math.min(1, (v - TURBINE_SPECS.cutInSpeed) / 2));
    return t * t * (3 - 2 * t) / 3;
  }
  if (telemetry.status === 'rated') return (TURBINE_SPECS.ratedSpeed / v) ** 3 / 3;
  return 0;
}

export function froudeValues(telemetry) {
  const v1 = telemetry.windSpeed, a = axialInduction(telemetry);
  const windMW = telemetry.availableWindMW, betzMW = BETZ * windMW;
  return {
    v1, a, vR: (1 - a) * v1, v3: (1 - 2 * a) * v1, idealRotor: v1 * 2 / 3, idealWake: v1 / 3,
    area: telemetry.sweptArea, rho: TURBINE_SPECS.airDensity, windMW, betzMW,
    electricMW: telemetry.powerMW, cp: telemetry.cp, share: betzMW ? telemetry.powerMW / betzMW : null
  };
}
