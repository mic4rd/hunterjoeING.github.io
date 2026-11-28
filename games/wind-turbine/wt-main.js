import * as THREE from 'three';
import { frameTourContent } from './wt-measurements.js?v=0.2.0';
import { froudePanel, updateFroudePanel } from './wt-froude-panel.js?v=0.2.0';
import { createAccidentControls } from './wt-accident-controls.js?v=0.2.0';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStudio } from './wt-studio.js?v=0.2.0';
import { createGraphicsSettings } from './wt-settings.js?v=0.2.0';
import { createWindParticles } from './wt-wind-particles.js?v=0.2.0';
import {
  TURBINE_SPECS,
  TURBINE_PARTS,
  TURBINE_TOUR_STEPS,
  computeTurbineTelemetry
} from './wt-data.js?v=0.2.0';
import { createWindTurbineModel } from './wt-model.js?v=0.2.0';

const DEFAULT_CAMERA = {
  normal: { pos: [47, 10, 22], target: [0, -0.8, 3] },
  cutaway: { pos: [8.6, 2.3, 4.6], target: [0.0, 0.15, 0.2] },
  xray: { pos: [10.5, 2.6, 7.6], target: [0.0, -0.4, 0.0] },
  exploded: { pos: [23, 5, 25], target: [0, -2.8, 2.0] }
};

function init() {
  const viewport = document.getElementById('wt-viewport');
  const canvas = document.getElementById('wt-canvas');
  const labelLayer = document.getElementById('wt-label-layer');
  if (!viewport || !canvas) return;

  // =========================================================================
  // THREE.JS RENDERER & STUDIO SCENE
  // =========================================================================
  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 320);
  camera.position.set(...DEFAULT_CAMERA.normal.pos);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 3.2;
  controls.maxDistance = 145;
  controls.maxPolarAngle = Math.PI * 0.68;
  controls.target.set(...DEFAULT_CAMERA.normal.target);

  const turbine = createWindTurbineModel();
  const wind = createWindParticles(window);
  const studio = createStudio(canvas, camera, turbine, wind);
  const graphics = createGraphicsSettings(document, window, studio, wind);

  // =========================================================================
  // KAMERA-FLUG-INTERPOLATION
  // =========================================================================
  let camAnim = null;
  function flyCamera(posArr, targetArr, duration = 0.85, overview = false) {
    camAnim = {
      startPos: camera.position.clone(),
      endPos: new THREE.Vector3(...posArr),
      startTarget: controls.target.clone(),
      endTarget: new THREE.Vector3(...targetArr),
      elapsed: 0,
      duration
    };
    if (overview) fitOverview(camAnim.endPos, camAnim.endTarget);
  }
  function fitOverview(position, target) {
    const scale = Math.max(1, 1.12 * camera.zoom / camera.aspect);
    position.sub(target).multiplyScalar(scale).add(target);
  }
  controls.addEventListener('start', () => {
    camAnim = null;
  });

  // =========================================================================
  // APP-STATE
  // =========================================================================
  const appState = {
    viewMode: 'normal',
    windSpeed: 10.5,
    labelsVisible: false,
    flowVisible: true,
    selectedPart: null,
    tourActive: false,
    froude: false,
    tourIndex: 0
  };

  let telemetry = computeTurbineTelemetry(appState.windSpeed);
  const accidentUI = createAccidentControls(document, turbine.accident, camera, controls, () => {
    camAnim = null;
    updateTelemetryUI();
  });

  // =========================================================================
  // 3D-LABELS (PROJEKTION)
  // =========================================================================
  const labelEls = new Map();
  TURBINE_PARTS.forEach(part => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wt-label-pin';
    btn.dataset.partId = part.id;
    btn.innerHTML = `<span class="wt-pin-num">${part.number}</span><span class="wt-pin-text">${part.shortLabel}</span>`;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      selectPart(part.id, true);
    });
    labelLayer.appendChild(btn);
    labelEls.set(part.id, btn);
  });

  const projVec = new THREE.Vector3();
  function updateLabels() {
    const show = appState.labelsVisible && !accidentUI.active;
    labelLayer.classList.toggle('is-visible', show);
    if (!show) return;

    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    for (const part of TURBINE_PARTS) {
      const el = labelEls.get(part.id);
      turbine.getPartWorldAnchor(part.id, projVec).project(camera);
      const visible = projVec.z > -1 && projVec.z < 1;
      if (!visible) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        continue;
      }
      const x = (projVec.x * 0.5 + 0.5) * w;
      const y = (-projVec.y * 0.5 + 0.5) * h;
      const inBounds = x > 24 && x < w - 24 && y > 24 && y < h - 24;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.opacity = inBounds ? '1' : '0';
      el.style.pointerEvents = inBounds ? 'auto' : 'none';
      el.classList.toggle('active', appState.selectedPart === part.id);
    }
  }

  // =========================================================================
  // RAYCASTING (DIREKTES ANKLICKEN VON 3D-BAUTEILEN)
  // =========================================================================
  const raycaster = new THREE.Raycaster();
  const pointerDownPos = new THREE.Vector2();
  const pointerNdc = new THREE.Vector2();

  canvas.addEventListener('pointerdown', e => {
    pointerDownPos.set(e.clientX, e.clientY);
  });

  canvas.addEventListener('pointerup', e => {
    if (accidentUI.active) return;
    if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 6) return;
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(turbine.root.children, true);
    const hit = hits.find(h => h.object.visible && h.object.userData && h.object.userData.partId);
    if (hit) {
      selectPart(hit.object.userData.partId, false);
    }
  });

  // =========================================================================
  // INTERAKTIVES LEISTUNGSKURVEN-DIAGRAMM (SVG)
  // =========================================================================
  const chartSvg = document.getElementById('wt-power-chart');
  const chartW = 320;
  const chartH = 152;
  const pad = { left: 36, right: 12, top: 14, bottom: 26 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  function xForWind(v) {
    return pad.left + (v / TURBINE_SPECS.maxWindSpeed) * plotW;
  }
  function yForPower(mw) {
    return pad.top + plotH - (mw / TURBINE_SPECS.ratedPowerMW) * plotH;
  }

  function buildPowerCurveChart() {
    if (!chartSvg) return;
    const samples = [];
    for (let v = 0; v <= TURBINE_SPECS.maxWindSpeed; v += 0.25) {
      const t = computeTurbineTelemetry(v);
      samples.push({ v, mw: t.powerMW });
    }
    const linePath = samples
      .map((s, idx) => `${idx === 0 ? 'M' : 'L'}${xForWind(s.v).toFixed(1)},${yForPower(s.mw).toFixed(1)}`)
      .join(' ');
    const areaPath =
      `${linePath} L${xForWind(TURBINE_SPECS.maxWindSpeed).toFixed(1)},${yForPower(0).toFixed(1)} ` +
      `L${xForWind(0).toFixed(1)},${yForPower(0).toFixed(1)} Z`;

    const xCutIn = xForWind(TURBINE_SPECS.cutInSpeed);
    const xRated = xForWind(TURBINE_SPECS.ratedSpeed);
    const xCutOut = xForWind(TURBINE_SPECS.cutOutSpeed);

    chartSvg.innerHTML = `
      <defs>
        <linearGradient id="wtCurveFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2563eb" stop-opacity="0.34" />
          <stop offset="100%" stop-color="#2563eb" stop-opacity="0.03" />
        </linearGradient>
      </defs>
      <!-- Betriebsregionen -->
      <rect x="${xRated.toFixed(1)}" y="${pad.top}" width="${(xCutOut - xRated).toFixed(1)}" height="${plotH}" class="chart-zone-rated" />
      <rect x="${xCutOut.toFixed(1)}" y="${pad.top}" width="${(xForWind(28) - xCutOut).toFixed(1)}" height="${plotH}" class="chart-zone-cutout" />
      <!-- Horizontale Hilfslinien -->
      ${[0, 1.2, 2.4, 3.6]
        .map(mw => {
          const y = yForPower(mw).toFixed(1);
          return `<line x1="${pad.left}" y1="${y}" x2="${chartW - pad.right}" y2="${y}" class="chart-grid" />
            <text x="${pad.left - 6}" y="${Number(y) + 3.5}" text-anchor="end" class="chart-axis-text">${mw.toFixed(1)}</text>`;
        })
        .join('')}
      <!-- Vertikale Marker (Anlauf, Nenn, Abschalt) -->
      <line x1="${xCutIn.toFixed(1)}" y1="${pad.top}" x2="${xCutIn.toFixed(1)}" y2="${pad.top + plotH}" class="chart-marker-line" />
      <line x1="${xRated.toFixed(1)}" y1="${pad.top}" x2="${xRated.toFixed(1)}" y2="${pad.top + plotH}" class="chart-marker-line" />
      <line x1="${xCutOut.toFixed(1)}" y1="${pad.top}" x2="${xCutOut.toFixed(1)}" y2="${pad.top + plotH}" class="chart-marker-line danger" />
      <!-- Fläche & Kurve -->
      <path d="${areaPath}" fill="url(#wtCurveFill)" />
      <path d="${linePath}" fill="none" class="chart-curve-line" />
      <!-- X-Achsen-Labels -->
      ${[0, 3, 12, 20, 25]
        .map(v => `<text x="${xForWind(v).toFixed(1)}" y="${chartH - 7}" text-anchor="middle" class="chart-axis-text">${v}</text>`)
        .join('')}
      <text x="${pad.left + 2}" y="${pad.top + 10}" class="chart-unit-text">MW</text>
      <text x="${chartW - 4}" y="${chartH - 7}" text-anchor="end" class="chart-unit-text">m/s</text>
      <!-- Live-Betriebspunkt -->
      <line id="wt-chart-vline" x1="0" y1="${pad.top}" x2="0" y2="${pad.top + plotH}" class="chart-live-guide" />
      <circle id="wt-chart-dot-ring" cx="0" cy="0" r="8" class="chart-live-ring" />
      <circle id="wt-chart-dot" cx="0" cy="0" r="4.5" class="chart-live-dot" />
    `;

    // Klick & Drag direkt auf dem Chart steuert die Windgeschwindigkeit!
    let dragging = false;
    function scrub(e) {
      const rect = chartSvg.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * chartW;
      const ratio = Math.max(0, Math.min(1, (relX - pad.left) / plotW));
      setWindSpeed(Math.round(ratio * TURBINE_SPECS.maxWindSpeed * 2) / 2);
    }
    chartSvg.addEventListener('pointerdown', e => {
      dragging = true;
      chartSvg.setPointerCapture(e.pointerId);
      scrub(e);
    });
    chartSvg.addEventListener('pointermove', e => {
      if (dragging) scrub(e);
    });
    chartSvg.addEventListener('pointerup', () => {
      dragging = false;
    });
    chartSvg.addEventListener('pointercancel', () => {
      dragging = false;
    });
    chartSvg.addEventListener('lostpointercapture', () => {
      dragging = false;
    });
  }

  function updatePowerCurveMarker() {
    const cx = xForWind(telemetry.windSpeed).toFixed(1);
    const cy = yForPower(telemetry.powerMW).toFixed(1);
    const vline = document.getElementById('wt-chart-vline');
    const dot = document.getElementById('wt-chart-dot');
    const ring = document.getElementById('wt-chart-dot-ring');
    if (vline) {
      vline.setAttribute('x1', cx);
      vline.setAttribute('x2', cx);
    }
    if (dot) {
      dot.setAttribute('cx', cx);
      dot.setAttribute('cy', cy);
    }
    if (ring) {
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
    }
  }

  // =========================================================================
  // UI-UPDATES & STEUERUNG
  // =========================================================================
  const elWindSlider = document.getElementById('wt-wind-slider');
  const elWindVal = document.getElementById('wt-wind-val');
  const elStatusBadge = document.getElementById('wt-status-badge');
  const elTelPower = document.getElementById('wt-tel-power');
  const elTelRpm = document.getElementById('wt-tel-rpm');
  const elTelPitch = document.getElementById('wt-tel-pitch');
  const elTelGenRpm = document.getElementById('wt-tel-genrpm');
  const elTelHomes = document.getElementById('wt-tel-homes');
  const elTelCp = document.getElementById('wt-tel-cp');
  const elInspector = document.getElementById('wt-inspector');
  const elTourCard = document.getElementById('wt-tour-card');
  const elTourStartBtn = document.getElementById('wt-btn-tour');
  const elLabelsToggle = document.getElementById('wt-btn-labels');
  const elFlowToggle = document.getElementById('wt-btn-flow');
  const elPanelDrawer = document.getElementById('wt-side-panel');
  const elDrawerToggle = document.getElementById('wt-mobile-panel-toggle');

  function updateTelemetryUI() {
    telemetry = computeTurbineTelemetry(appState.windSpeed);
    studio.setMeasurements(appState.froude, telemetry);
    if (appState.froude) updateFroudePanel(document, telemetry);
    if (elWindSlider && Number(elWindSlider.value) !== appState.windSpeed) {
      elWindSlider.value = String(appState.windSpeed);
    }
    if (elWindVal) elWindVal.textContent = `${telemetry.windSpeed.toFixed(1)} m/s`;
    if (elStatusBadge) {
      elStatusBadge.textContent = telemetry.statusLabel;
      elStatusBadge.dataset.status = telemetry.status;
    }
    if (elTelPower) {
      elTelPower.textContent =
        telemetry.powerMW >= 1 ? `${telemetry.powerMW.toFixed(2)} MW` : `${telemetry.powerKW} kW`;
    }
    if (elTelRpm) elTelRpm.textContent = `${telemetry.rotorRpm.toFixed(1)} U/min`;
    if (elTelPitch) elTelPitch.textContent = `${telemetry.pitchDeg.toFixed(1)}°`;
    if (elTelGenRpm) elTelGenRpm.textContent = `${Math.round(telemetry.generatorRpm)} U/min`;
    if (elTelHomes) elTelHomes.textContent = `~${telemetry.homesPowered.toLocaleString('de-DE')}`;
    if (elTelCp) elTelCp.textContent = `${Math.round(telemetry.cp * 100)} %`;

    document.querySelectorAll('.wt-preset-btn').forEach(b => {
      const target = Number(b.dataset.wind);
      b.classList.toggle('active', Math.abs(target - telemetry.windSpeed) < 0.3);
    });
    updatePowerCurveMarker();
  }

  function setWindSpeed(val) {
    accidentUI.repair();
    appState.windSpeed = Math.max(0, Math.min(TURBINE_SPECS.maxWindSpeed, Number(val) || 0));
    updateTelemetryUI();
  }

  function setViewMode(mode, shouldFly = true) {
    if (shouldFly && appState.tourActive && (mode === 'exploded' || appState.froude ||
      TURBINE_TOUR_STEPS[appState.tourIndex].focusPart === 'serviceAccess')) stopTour();
    if (mode === 'exploded') {
      if (accidentUI.start(telemetry, appState.viewMode)) {
        flyCamera(DEFAULT_CAMERA.exploded.pos, DEFAULT_CAMERA.exploded.target, 0.65, true);
      }
      return;
    }
    accidentUI.repair();
    appState.viewMode = mode;
    turbine.setViewMode(mode);
    document.querySelectorAll('[data-view-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.viewMode === mode);
    });
    if (shouldFly && DEFAULT_CAMERA[mode]) {
      flyCamera(DEFAULT_CAMERA[mode].pos, DEFAULT_CAMERA[mode].target, 0.85, mode === 'normal');
    }
    if (window.ArcadeAudio) window.ArcadeAudio.click();
  }

  function selectPart(partId, flyToPart = false) {
    if (accidentUI.active) return;
    appState.selectedPart = partId;
    turbine.setSelectedPart(partId);
    const part = TURBINE_PARTS.find(p => p.id === partId);
    if (!elInspector) return;
    if (!part) {
      elInspector.innerHTML = `
        <div class="wt-inspector-empty">
          Klicke ein Bauteil im 3D-Modell oder aktiviere <strong>Labels</strong>, um alle ${TURBINE_PARTS.length} Baugruppen im Detail zu untersuchen.
        </div>`;
      return;
    }
    elInspector.innerHTML = `
      <div class="wt-inspector-head">
        <span class="wt-inspector-num">${part.number}</span>
        <div>
          <div class="wt-inspector-cat">${part.category}</div>
          <h3 class="wt-inspector-title">${part.name}</h3>
        </div>
        <button type="button" class="wt-inspector-close" id="wt-inspector-clear" aria-label="Auswahl aufheben">✕</button>
      </div>
      <div class="wt-inspector-stage">⚡ ${part.energyStage}</div>
      <p class="wt-inspector-desc">${part.description}</p>
      <div class="wt-inspector-spec">${part.spec}</div>
    `;
    const clearBtn = document.getElementById('wt-inspector-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => selectPart(null, false));
    }
    if (flyToPart && part.cameraPos) {
      flyCamera(part.cameraPos, part.cameraTarget);
    }
    if (window.ArcadeAudio) window.ArcadeAudio.pop();
  }

  // =========================================================================
  // 06 SCHRITT-FÜR-SCHRITT-TOUR
  // =========================================================================
  function renderTourStep() {
    if (!elTourCard) return;
    elTourCard.classList.toggle('hidden', !appState.tourActive);
    if (elTourStartBtn) elTourStartBtn.classList.toggle('active', appState.tourActive);
    if (!appState.tourActive) return;

    const step = TURBINE_TOUR_STEPS[appState.tourIndex];
    const total = TURBINE_TOUR_STEPS.length;
    appState.froude = step.lesson === 'froude';
    turbine.setAccessTour(step.focusPart === 'serviceAccess');
    elTourCard.classList.toggle('wt-froude-open', appState.froude);
    elTourCard.innerHTML = `
      <div class="wt-tour-top">
        <span class="wt-tour-step-pill">Schritt ${step.step} / ${total}</span>
        <span class="wt-tour-badge">${step.badge}</span>
        <button type="button" class="wt-tour-close" id="wt-tour-end" aria-label="Tour beenden">✕</button>
      </div>
      <h3 class="wt-tour-title">${step.title}</h3>
      <p class="wt-tour-body">${step.body}</p>
      ${appState.froude ? froudePanel : ''}
      <div class="wt-tour-footer">
        <div class="wt-tour-dots">
          ${TURBINE_TOUR_STEPS.map((_, idx) => `<button type="button" class="wt-tour-dot ${idx === appState.tourIndex ? 'active' : ''}" data-tour-goto="${idx}" aria-label="Schritt ${idx + 1}"></button>`).join('')}
        </div>
        <div class="wt-tour-actions">
          <button type="button" class="wt-btn-ghost" id="wt-tour-prev" ${appState.tourIndex === 0 ? 'disabled' : ''}>← Zurück</button>
          <button type="button" class="wt-btn-primary" id="wt-tour-next">${appState.tourIndex === total - 1 ? 'Fertig ✓' : 'Weiter →'}</button>
        </div>
      </div>
    `;

    fitTourFrame();
    // Zustand & Kamera für diesen Schritt anwenden
    setViewMode(step.viewMode, false);
    if (step.demoWind !== undefined) setWindSpeed(step.demoWind);
    else updateTelemetryUI();
    if (appState.froude) document.getElementById('wt-fr-slider')?.addEventListener('input', e => setWindSpeed(e.target.value));
    selectPart(step.focusPart, false);
    if (step.step === 1 || appState.froude) setFlow(true);
    flyCamera(step.cameraPos, step.cameraTarget, 0.95, step.viewMode === 'normal');

    document.getElementById('wt-tour-end')?.addEventListener('click', () => stopTour());
    document.getElementById('wt-tour-prev')?.addEventListener('click', () => {
      if (appState.tourIndex > 0) {
        appState.tourIndex--;
        renderTourStep();
      }
    });
    document.getElementById('wt-tour-next')?.addEventListener('click', () => {
      if (appState.tourIndex < total - 1) {
        appState.tourIndex++;
        renderTourStep();
      } else {
        stopTour();
      }
    });
    elTourCard.querySelectorAll('[data-tour-goto]').forEach(btn => {
      btn.addEventListener('click', () => {
        appState.tourIndex = Number(btn.dataset.tourGoto);
        renderTourStep();
      });
    });
  }

  function startTour(index = 0) {
    appState.tourActive = true;
    appState.tourIndex = index;
    renderTourStep();
  }

  function stopTour() {
    appState.tourActive = false;
    appState.froude = false;
    studio.setMeasurements(false, telemetry);
    turbine.setAccessTour(false);
    if (elTourCard) elTourCard.classList.add('hidden');
    fitTourFrame();
    if (elTourStartBtn) elTourStartBtn.classList.remove('active');
    if (window.ArcadeAudio) window.ArcadeAudio.click();
  }

  // Event-Bindings
  document.querySelectorAll('[data-view-mode]').forEach(btn => {
    btn.addEventListener('click', () => setViewMode(btn.dataset.viewMode, true));
  });

  elWindSlider?.addEventListener('input', e => setWindSpeed(e.target.value));

  document.querySelectorAll('.wt-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setWindSpeed(Number(btn.dataset.wind));
      if (window.ArcadeAudio) window.ArcadeAudio.click();
    });
  });

  elLabelsToggle?.addEventListener('click', () => {
    appState.labelsVisible = !appState.labelsVisible;
    elLabelsToggle.classList.toggle('active', appState.labelsVisible);
    if (window.ArcadeAudio) window.ArcadeAudio.click();
  });

  function setFlow(visible) {
    appState.flowVisible = visible;
    turbine.setFlowVisible(visible);
    elFlowToggle?.classList.toggle('active', visible);
    elFlowToggle?.setAttribute('aria-pressed', String(visible));
  }
  elFlowToggle?.addEventListener('click', () => {
    setFlow(!appState.flowVisible);
    if (window.ArcadeAudio) window.ArcadeAudio.click();
  });

  document.getElementById('wt-btn-reset')?.addEventListener('click', () => {
    accidentUI.repair();
    const cam = DEFAULT_CAMERA[appState.viewMode] || DEFAULT_CAMERA.normal;
    flyCamera(cam.pos, cam.target, 0.85, appState.viewMode === 'normal');
    if (window.ArcadeAudio) window.ArcadeAudio.click();
  });

  elTourStartBtn?.addEventListener('click', () => {
    if (appState.tourActive) stopTour();
    else startTour(0);
  });

  const elDrawerBackdrop = document.getElementById('wt-drawer-backdrop');
  const elDrawerClose = document.getElementById('wt-drawer-close');

  function setDrawerOpen(open) {
    if (!elPanelDrawer) return;
    elPanelDrawer.classList.toggle('mobile-open', open);
    elDrawerBackdrop?.classList.toggle('visible', open);
    if (elDrawerToggle) {
      elDrawerToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      elDrawerToggle.textContent = open ? '✕ Steuerung ausblenden' : '⚙️ Wind, Kurve & Details';
    }
  }

  elDrawerToggle?.addEventListener('click', () => {
    setDrawerOpen(!elPanelDrawer.classList.contains('mobile-open'));
    if (window.ArcadeAudio) window.ArcadeAudio.click();
  });

  elDrawerClose?.addEventListener('click', () => {
    setDrawerOpen(false);
    if (window.ArcadeAudio) window.ArcadeAudio.click();
  });

  elDrawerBackdrop?.addEventListener('click', () => setDrawerOpen(false));

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && graphics.close(true)) return;
    if (e.key === 'Escape' && accidentUI.active) accidentUI.repair();
    if (e.key === 'Escape' && elPanelDrawer?.classList.contains('mobile-open')) {
      setDrawerOpen(false);
    }
  });

  // Topbar Mute & Version Changelog
  const elMute = document.getElementById('btn-mute');
  if (elMute && window.ArcadeAudio) {
    window.ArcadeAudio.syncButton(elMute);
    elMute.addEventListener('click', () => window.ArcadeAudio.toggleMute(elMute));
  }
  const elVersionBtn = document.getElementById('wt-version-btn');
  if (elVersionBtn && window.ArcadeUpdates) {
    const latest = window.ArcadeUpdates.latest('wind_turbine');
    if (latest) elVersionBtn.textContent = `v${latest.version}`;
    elVersionBtn.addEventListener('click', () => window.ArcadeUpdates.openChangelog('wind_turbine', elVersionBtn));
  }

  // Initialisieren
  buildPowerCurveChart();
  updateTelemetryUI();
  selectPart(null, false);

  // Keep the three sections or the access demonstration between the toolbar and
  // the tour card. Only UI/resize events touch the projection, never the render loop.
  function fitTourFrame() {
    const w = viewport.clientWidth, h = viewport.clientHeight;
    let top = 0, bottom = h;
    if (appState.tourActive && (appState.froude || TURBINE_TOUR_STEPS[appState.tourIndex].focusPart === 'serviceAccess')) {
      const toolbar = document.getElementById('wt-mode-dock');
      top = toolbar.offsetTop + toolbar.offsetHeight + 4;
      bottom = elTourCard.offsetTop - 5;
    }
    frameTourContent(camera, w, h, top, bottom);
    studio.resizeLabels(h);
  }

  // Resize Handling
  function handleResize() {
    const w = Math.max(1, viewport.clientWidth);
    const h = Math.max(1, viewport.clientHeight);
    fitTourFrame();
    studio.resize(w, h);
    wind.resize();
  }
  handleResize();
  fitOverview(camera.position, controls.target);
  const resizeObs = new ResizeObserver(handleResize);
  resizeObs.observe(viewport);
  new ResizeObserver(fitTourFrame).observe(elTourCard);

  // =========================================================================
  // RENDER LOOP
  // =========================================================================
  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);
    const seconds = (now - lastTime) / 1000;
    const dt = Math.min(0.25, seconds);
    lastTime = now;
    if (document.hidden) return;

    if (camAnim) {
      camAnim.elapsed += dt;
      const t = Math.min(1, camAnim.elapsed / camAnim.duration);
      const ease = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(camAnim.startPos, camAnim.endPos, ease);
      controls.target.lerpVectors(camAnim.startTarget, camAnim.endTarget, ease);
      if (t >= 1) camAnim = null;
    }

    controls.update();
    const pose = turbine.update(dt, telemetry);
    accidentUI.frame();
    wind.update(dt, telemetry, pose, camera, appState.flowVisible && !accidentUI.active);
    studio.updateWeather(dt, telemetry.windSpeed, appState.froude || appState.viewMode !== 'normal', camera.position.length());
    studio.render(seconds);
    graphics.frame(now);
    updateLabels();
  }
  requestAnimationFrame(animate);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
