import { TURBINE_SPECS } from './wt-data.js?v=0.2.0';

// The mechanical state and the normal telemetry stay frozen during the gag.
export function createAccidentControls(doc, accident, camera, controls, restore) {
  const byId = id => doc.getElementById(id);
  const banner = byId('wt-accident'), title = byId('wt-accident-title'), message = byId('wt-accident-message');
  const button = byId('wt-repair'), labels = byId('wt-label-layer'), toggle = byId('wt-btn-labels');
  const status = byId('wt-status-badge'), rpm = byId('wt-tel-rpm');
  const modes = Array.from(doc.querySelectorAll('[data-view-mode]'));
  const savedEye = camera.position.clone(), savedTarget = controls.target.clone();
  let savedMode, shownPhase = '', shownRpm = -1;
  function start(telemetry, mode) {
    if (accident.state.phase !== 'idle') return false;
    savedEye.copy(camera.position); savedTarget.copy(controls.target); savedMode = mode;
    accident.start(telemetry.rotorRpm);
    labels.hidden = true; toggle.disabled = true; banner.hidden = false;
    for (const b of modes) b.classList.toggle('active', b.dataset.viewMode === 'exploded');
    byId('wt-tel-pitch').textContent = 'Regelung aus';
    frame();
    return true;
  }
  function frame() {
    const { phase, quip } = accident.state;
    if (phase === 'idle') return;
    const speed = Math.round(accident.state.rpm);
    if (phase !== shownPhase) {
      shownPhase = phase;
      const blown = phase === 'blown';
      status.dataset.status = 'cutout';
      status.textContent = blown ? 'Anlage außer Betrieb' : 'Bremse und Pitch offline';
      banner.classList.toggle('is-overrev', !blown);
      button.hidden = !blown;
      message.textContent = blown ? quip : 'Die Blattverstellung reagiert nicht. Der Rotor dreht hoch.';
      if (blown) {
        title.textContent = 'Anlagenschaden bei ' + speed + ' U/min!';
        rpm.textContent = '0 U/min';
        byId('wt-tel-power').textContent = '0 kW';
        byId('wt-tel-genrpm').textContent = '0 U/min';
        byId('wt-tel-homes').textContent = '0';
        byId('wt-tel-cp').textContent = '0 %';
      }
    }
    if (phase === 'overrev' && speed !== shownRpm) {
      shownRpm = speed;
      rpm.textContent = speed + ' U/min';
      byId('wt-tel-genrpm').textContent = Math.round(accident.state.rpm * TURBINE_SPECS.gearRatio) + ' U/min';
      title.textContent = '⚠️ BREMSE OFFLINE · ' + rpm.textContent + '!';
    }
  }
  function repair() {
    if (!accident.repair()) return;
    banner.hidden = true; labels.hidden = false; toggle.disabled = false;
    shownRpm = -1; shownPhase = '';
    for (const b of modes) b.classList.toggle('active', b.dataset.viewMode === savedMode);
    camera.position.copy(savedEye); controls.target.copy(savedTarget);
    restore();
  }
  button.addEventListener('click', repair);
  return { start, frame, repair, get active() { return accident.state.phase !== 'idle'; } };
}
