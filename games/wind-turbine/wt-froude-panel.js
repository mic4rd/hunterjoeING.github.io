import { froudeValues } from './wt-froude.js?v=0.2.0';
import { TURBINE_SPECS } from './wt-data.js?v=0.2.0';

const format = digits => new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format;
const num = format(1), power = format(2), precise = format(3), whole = format(0);
const statusText = {
  standby: 'Unterhalb des Einschaltwinds speist die Anlage keinen Strom ein.',
  partial: 'Die elektrische Leistung folgt der Leistungskurve der Anlage.',
  rated: 'Pitch begrenzt die Leistung auf 3,6 MW. Bei weiter steigendem Wind sinkt deshalb der elektrische Leistungsbeiwert.',
  cutout: 'Bei Sturmabschaltung stehen die Blätter in Fahnenstellung. Die elektrische Leistung ist null.'
};
export const froudePanel = `
  <div class="wt-froude-scroll" tabindex="0" aria-label="Live-Rechnung und Herleitung">
    <label class="wt-froude-wind" for="wt-fr-slider">Anströmung v₁ <output id="wt-fr-wind" for="wt-fr-slider"></output>
      <input id="wt-fr-slider" type="range" min="0" max="${TURBINE_SPECS.maxWindSpeed}" step="0.5" aria-label="Anströmung in Metern pro Sekunde">
    </label>
    <details><summary>Herleitung und Rotorauslegung</summary>
      <ol class="wt-froude-equations">
        <li>Massenstrom durch die Rotorscheibe<br>ṁ = ρ · A · v<sub>R</sub></li>
        <li>Schub aus dem Impulsverlust<br>F = ṁ · (v₁ − v₃)</li>
        <li>Leistung aus Arbeit und Energieverlust<br>P = F · v<sub>R</sub> = ½ · ṁ · (v₁² − v₃²)<br>⇒ v<sub>R</sub> = (v₁ + v₃)/2</li>
        <li>Mit x = v₃/v₁ gilt c<sub>P</sub> = ½ · (1 + x) · (1 − x²). Das Maximum liegt bei x = ⅓.</li>
        <li>Am Optimum gilt v<sub>R</sub> = ⅔ v₁, v₃ = ⅓ v₁ und c<sub>P,max</sub> = 16/27 ≈ 59,3 %.</li>
      </ol>
      <p>Für eine gewünschte Leistung P bei gegebenem Wind ergibt sich die ideale Mindestfläche A = 2P/(ρ · v₁³ · c<sub>P,max</sub>). Reale Verluste erhöhen den Flächenbedarf.</p>
    </details>
    <div id="wt-fr-values"></div>
  </div>`;

export function updateFroudePanel(doc, telemetry) {
  const values = doc.getElementById('wt-fr-values');
  if (!values) return;
  const v = froudeValues(telemetry), slider = doc.getElementById('wt-fr-slider');
  slider.value = String(v.v1);
  doc.getElementById('wt-fr-wind').textContent = num(v.v1) + ' m/s';
  values.innerHTML = `
    <table><thead><tr><th>Geschwindigkeit</th><th>Modell</th><th>Betz-Optimum</th></tr></thead>
    <tbody><tr><th>Rotor v<sub>R</sub></th><td>${num(v.vR)} m/s</td><td>${num(v.idealRotor)} m/s</td></tr>
    <tr><th>Nachlauf v₃</th><td>${num(v.v3)} m/s</td><td>${num(v.idealWake)} m/s</td></tr></tbody></table>
    <p>${v.v1 ? 'Induktion a = 1 − v<sub>R</sub>/v₁ = <b>' + precise(v.a) + '</b> im Modell, ⅓ am Optimum.' : 'Bei Windstille ruht die Strömung. Das Modell setzt a = 0.'}</p>
    <p>Im Modell gilt v<sub>R</sub> = (1 − a)v₁ und v₃ = (1 − 2a)v₁. Die äußeren Ringe markieren die Fernwerte schematisch.</p>
    <p>A = π · (${whole(TURBINE_SPECS.rotorDiameterM)} m / 2)² ≈ ${whole(v.area)} m²<br>ρ = ${precise(v.rho)} kg/m³</p>
    <dl><dt>Windleistung ½ρAv₁³</dt><dd>${power(v.windMW)} MW</dd>
    <dt>Betz-Grenze · 16/27 davon</dt><dd>${power(v.betzMW)} MW</dd>
    <dt>Elektrische Modellleistung</dt><dd>${power(v.electricMW)} MW</dd>
    <dt>c<sub>P,el</sub> · Anteil der Windleistung</dt><dd>${num(100 * v.cp)} %</dd>
    <dt>Anteil der Betz-Leistung</dt><dd>${v.share === null ? '– (Windstille)' : num(100 * v.share) + ' %'}</dd></dl>
    <p>${statusText[telemetry.status]}</p>`;
}
