import { $, $$, clamp, fmt, resizeCanvas, animateWhileVisible, markProgress, zoneFor, spectrumPosition } from './utils.js';

/* ------------------------------------------------------------------ */
/* Model didàctic de la temperatura d'un menjador (valors aproximats)     */
/* ------------------------------------------------------------------ */
// Condicions fixes: un dia de temps suau amb una mica de calefacció.
const MILD = { offset: 0, sun: 0.75, radiator: 3.5 };
const SPOTS = {
  center: { label: 'LLOC FIX DEL MENJADOR', x: 50, y: 74, warning: '' },
  window: { label: 'FINESTRA AMB SOL', x: 12.5, y: 63, warning: 'El termòmetre rep el sol directe: la lectura puja a la tarda i no representa tot el menjador.' },
  radiator: { label: 'PROP DEL RADIADOR', x: 79.5, y: 62, warning: 'El radiador escalfa la placa: la lectura és més alta que la de la resta del menjador.' },
  door: { label: 'PORTA DEL PASSADÍS', x: 90, y: 64, warning: 'El corrent d’aire del passadís refreda la placa: la lectura és més baixa.' },
};
const state = {
  spot: 'center',
  hour: 12,
  hypothesisSet: false,
  guessHour: '',
  guessComfort: '',
  ledVisible: true,
};

/** Temperatura base del menjador segons l'hora (màxim cap a les 15 h). */
function baseTemperature(hour) {
  return 18.5 + 4.5 * Math.sin((Math.PI * (hour - 8)) / 14);
}

function sunIntensity(hour) {
  return Math.max(0, Math.sin((Math.PI * (hour - 8)) / 12));
}

export function labTemperature(hour, spot = state.spot) {
  let value = baseTemperature(hour) + MILD.offset;
  if (spot === 'window') value += 6 * MILD.sun * sunIntensity(hour);
  if (spot === 'radiator') value += MILD.radiator;
  if (spot === 'door') value -= 2;
  return Math.round(value * 10) / 10;
}

/* ------------------------------------------------------------------ */
/* Escena del menjador (canvas)                                           */
/* ------------------------------------------------------------------ */
const roomCanvas = $('#roomCanvas');
const roomCtx = roomCanvas.getContext('2d');

function tintFor(temperature) {
  if (temperature < 16) return 'rgba(76,201,240,.2)';
  if (temperature <= 22) return 'rgba(63,174,106,.16)';
  if (temperature <= 25) return 'rgba(217,185,58,.18)';
  if (temperature < 35) return 'rgba(240,144,43,.24)';
  return 'rgba(217,70,58,.3)';
}

function drawRoom(time) {
  const rect = resizeCanvas(roomCanvas, roomCtx);
  const { width: W, height: H } = rect;
  const ctx = roomCtx;
  const temperature = labTemperature(state.hour);
  const sun = sunIntensity(state.hour) * MILD.sun;
  ctx.clearRect(0, 0, W, H);

  // Paret i terra
  ctx.fillStyle = tintFor(temperature);
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.fillRect(0, H * 0.84, W, H * 0.16);
  ctx.strokeStyle = 'rgba(255,255,255,.16)';
  ctx.beginPath(); ctx.moveTo(0, H * 0.84); ctx.lineTo(W, H * 0.84); ctx.stroke();

  // Finestra
  const wx = W * 0.05; const wy = H * 0.2; const ww = W * 0.15; const wh = H * 0.42;
  const daylight = clamp(0.25 + sunIntensity(state.hour), 0, 1);
  ctx.fillStyle = `rgb(${Math.round(30 + 110 * daylight)},${Math.round(50 + 130 * daylight)},${Math.round(90 + 140 * daylight)})`;
  ctx.fillRect(wx, wy, ww, wh);
  // Sol dins de la finestra (puja i baixa amb l'hora)
  const sunPos = (state.hour - 8) / 9;
  const sunY = wy + wh * (0.85 - Math.sin(sunPos * Math.PI) * 0.7);
  ctx.fillStyle = '#ffd95c';
  ctx.beginPath(); ctx.arc(wx + ww * (0.25 + sunPos * 0.5), sunY, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3;
  ctx.strokeRect(wx, wy, ww, wh);
  ctx.fillStyle = '#9b8fa3'; ctx.fillRect(wx - 8, wy + wh, ww + 16, 8);
  ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();

  // Raigs de sol
  if (sun > 0.08) {
    const beam = ctx.createLinearGradient(wx + ww, wy, W * 0.6, H * 0.84);
    beam.addColorStop(0, `rgba(255,217,92,${0.38 * sun})`);
    beam.addColorStop(1, 'rgba(255,217,92,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(wx + ww, wy); ctx.lineTo(wx + ww, wy + wh);
    ctx.lineTo(W * 0.68, H * 0.84); ctx.lineTo(W * 0.46, H * 0.84);
    ctx.closePath(); ctx.fill();
  }

  // Taula del centre
  ctx.fillStyle = '#5a4a5f';
  ctx.fillRect(W * 0.39, H * 0.74, W * 0.22, 10);
  ctx.fillRect(W * 0.41, H * 0.74, 8, H * 0.1);
  ctx.fillRect(W * 0.59 - 8, H * 0.74, 8, H * 0.1);

  // Radiador
  const rx = W * 0.72; const ry = H * 0.62; const rw = W * 0.15; const rh = H * 0.21;
  ctx.fillStyle = '#9b8fa3';
  for (let i = 0; i < 6; i++) ctx.fillRect(rx + i * (rw / 6) + 2, ry, rw / 6 - 5, rh);
  ctx.fillStyle = '#7a6f83';
  ctx.fillRect(rx, ry + rh * 0.12, rw, 6);
  const heating = MILD.radiator / 5;
  if (heating > 0.5) {
    ctx.strokeStyle = `rgba(255,120,80,${0.25 + heating * 0.4})`; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      for (let y = 0; y < H * 0.2; y += 4) {
        const xx = rx + rw * (0.12 + i * 0.25) + Math.sin(y * 0.14 - time * 2.4 + i) * 5;
        if (y === 0) ctx.moveTo(xx, ry - y); else ctx.lineTo(xx, ry - y);
      }
      ctx.stroke();
    }
  }

  // Porta
  const dx = W * 0.925; const dy = H * 0.3; const dw = W * 0.06; const dh = H * 0.54;
  ctx.fillStyle = '#6b4e3a'; ctx.fillRect(dx, dy, dw, dh);
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, dw, dh);
  ctx.fillStyle = '#e9c46a'; ctx.beginPath(); ctx.arc(dx + 8, dy + dh / 2, 3.5, 0, Math.PI * 2); ctx.fill();
  if (state.spot === 'door') {
    ctx.strokeStyle = 'rgba(76,201,240,.65)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let x = 0; x < W * 0.12; x += 5) {
        const yy = dy + dh * (0.3 + i * 0.18) + Math.sin(x * 0.12 + time * 3 + i) * 4;
        if (x === 0) ctx.moveTo(dx - x, yy); else ctx.lineTo(dx - x, yy);
      }
      ctx.stroke();
    }
  }

  // Etiquetes
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.font = '700 11px ui-monospace, SFMono-Regular, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FINESTRA', wx + ww / 2, wy - 10);
  ctx.fillText('TAULA', W * 0.5, H * 0.915);
  ctx.fillText('RADIADOR', rx + rw / 2, H * 0.915);
  ctx.fillText('PORTA', dx + dw / 2, H * 0.915);
}

/* ------------------------------------------------------------------ */
/* Interfície                                                          */
/* ------------------------------------------------------------------ */
function guessFeedbackText() {
  const hours = [9, 12, 16];
  const readings = hours.map(h => labTemperature(h));
  const maxIndex = readings.indexOf(Math.max(...readings));
  const highestHour = hours[maxIndex];
  const noon = readings[1];
  const noonInComfort = noon >= 18 && noon <= 22;
  const hourOk = Number(state.guessHour) === highestHour;
  const comfortOk = (state.guessComfort === 'yes') === noonInComfort;
  const list = hours.map((h, i) => `${h} h → ${fmt(readings[i], 1)} °C`).join(' · ');
  const spot = SPOTS[state.spot];
  return `<b>Resultat:</b> amb aquestes condicions el termòmetre marcaria ${list}. ` +
    `La temperatura més alta és a les <b>${highestHour}:00 h</b>: la teva hipòtesi ${hourOk ? 's’ha complert ✓' : 'no s’ha complert ✗'}. ` +
    `A les 12 h el menjador ${noonInComfort ? 'és' : 'no és'} dins la zona de confort: la teva resposta ${comfortOk ? 'és correcta ✓' : 'no era correcta ✗'}.` +
    (spot.warning ? ` <br><b>Atenció:</b> ${spot.warning} Per comparar dies, mesura sempre en un lloc fix lluny del sol i del radiador.` : '');
}

function updateLab() {
  const temperature = labTemperature(state.hour);
  const zone = zoneFor(temperature);
  const spot = SPOTS[state.spot];
  $('#hourValue').textContent = `${String(state.hour).padStart(2, '0')}:00 h`;
  $('#roomSpot').textContent = spot.label;
  $('#labTemp').textContent = fmt(temperature, 1);
  $('#mbReadout').textContent = Math.round(temperature);
  $('#labZone').textContent = zone.label;
  $('#labZone').style.color = zone.ink;
  $('#labNeedle').style.left = `${spectrumPosition(temperature)}%`;

  const node = $('#mbNode');
  node.style.left = `${spot.x}%`;
  node.style.top = `${spot.y}%`;
  node.classList.toggle('is-hidden', !state.ledVisible);
  node.style.setProperty('--mb-glow', zone.color);

  const conclusion = $('#labConclusion');
  if (!state.hypothesisSet) {
    conclusion.innerHTML = '<b>Comprova la teva hipòtesi:</b> escriu primer què creus que passarà i després mou l’hora del dia.';
  } else {
    conclusion.innerHTML = guessFeedbackText();
  }
  $('#hour').setAttribute('aria-valuetext', `${state.hour} hores, ${fmt(temperature, 1)} graus`);
}

function setControlsEnabled(enabled) {
  $('#hour').disabled = !enabled;
}

function touched() {
  if (state.hypothesisSet) markProgress('labExplore');
}

$$('input[name="spot"]').forEach(input => input.addEventListener('change', (event) => {
  state.spot = event.target.value;
  updateLab(); touched();
}));
$('#hour').addEventListener('input', (event) => {
  state.hour = Number(event.target.value);
  updateLab(); touched();
});

$('#setLabGuess').addEventListener('click', () => {
  const hour = $('#guessHour').value;
  const comfort = $('#guessComfort').value;
  const feedback = $('#labGuessFeedback');
  if (!hour || !comfort) {
    feedback.textContent = 'Tria una resposta a les dues preguntes.';
    feedback.className = 'error-text';
    return;
  }
  state.guessHour = hour;
  state.guessComfort = comfort;
  state.hypothesisSet = true;
  feedback.textContent = 'Hipòtesi preparada. Ara pots moure l’hora per comprovar-la.';
  feedback.className = 'success-text';
  setControlsEnabled(true);
  markProgress('labHyp');
  updateLab();
});

$('#ledToggle').addEventListener('click', () => {
  state.ledVisible = !state.ledVisible;
  const button = $('#ledToggle');
  button.setAttribute('aria-checked', String(state.ledVisible));
  $('b', button).textContent = state.ledVisible ? 'Visible' : 'Amagada';
  updateLab();
});

$('#resetLab').addEventListener('click', () => {
  Object.assign(state, { spot: 'center', hour: 12, hypothesisSet: false, guessHour: '', guessComfort: '' });
  $('input[name="spot"][value="center"]').checked = true;
  $('#hour').value = 12;
  $('#guessHour').value = '';
  $('#guessComfort').value = '';
  $('#labGuessFeedback').textContent = '';
  setControlsEnabled(false);
  updateLab();
});

setControlsEnabled(false);
animateWhileVisible(roomCanvas, drawRoom);
updateLab();
window.addEventListener('resize', updateLab);
