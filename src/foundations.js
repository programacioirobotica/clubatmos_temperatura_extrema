import { $, $$, fmt, lerp, resizeCanvas, animateWhileVisible, setupGuess, markProgress } from './utils.js';

/* ================================================================== */
/* 01 · EFECTE HIVERNACLE                                             */
/* ================================================================== */
// Dades del Diari STEAM (NASA GISTEMP v4 i NOAA). L'increment es compara amb 1951–1980.
const GH_STEPS = [
  { era: 'Fa uns 250 anys', ppm: 280, delta: null, label: 'punt de partida' },
  { era: 'Dècada de 1980', ppm: 339, delta: 0.26, label: 'més que la mitjana 1951–1980' },
  { era: 'Dècada de 1990', ppm: 354, delta: 0.45, label: 'més que la mitjana 1951–1980' },
  { era: 'Dècada de 2000', ppm: 370, delta: 0.61, label: 'més que la mitjana 1951–1980' },
  { era: 'Dècada de 2010', ppm: 390, delta: 0.72, label: 'més que la mitjana 1951–1980' },
  { era: 'Dècada de 2020', ppm: 414, delta: 1.02, label: 'més que la mitjana 1951–1980' },
  { era: 'Any 2024', ppm: 423, delta: 1.28, label: 'més que la mitjana 1951–1980' },
];

const ghCanvas = $('#ghCanvas');
const ghCtx = ghCanvas.getContext('2d');
let ghStep = 0;

/** Posicions fixes (0–1) de les molècules de CO₂ perquè no "saltin" en moure el control. */
const CO2_SPOTS = Array.from({ length: 48 }, (_, i) => ({
  x: (Math.sin(i * 91.7) * 0.5 + 0.5),
  y: (Math.sin(i * 47.3 + 2) * 0.5 + 0.5),
  speed: 0.4 + ((i * 37) % 10) / 14,
}));

function drawGreenhouse(time) {
  const rect = resizeCanvas(ghCanvas, ghCtx);
  const { width: W, height: H } = rect;
  const step = GH_STEPS[ghStep];
  const heat = (step.ppm - 280) / (423 - 280); // 0 → 1
  ghCtx.clearRect(0, 0, W, H);

  // Espai i atmosfera
  const sky = ghCtx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#120f22');
  sky.addColorStop(0.55, '#2a1e3d');
  sky.addColorStop(1, '#3a2a3f');
  ghCtx.fillStyle = sky;
  ghCtx.fillRect(0, 0, W, H);

  const atmTop = H * 0.26;
  const atmBottom = H * 0.64;
  const atm = ghCtx.createLinearGradient(0, atmTop, 0, atmBottom);
  atm.addColorStop(0, `rgba(255,138,61,${0.06 + heat * 0.1})`);
  atm.addColorStop(1, `rgba(255,138,61,${0.14 + heat * 0.2})`);
  ghCtx.fillStyle = atm;
  ghCtx.fillRect(0, atmTop, W, atmBottom - atmTop);
  ghCtx.strokeStyle = 'rgba(255,255,255,.14)';
  ghCtx.setLineDash([6, 6]);
  ghCtx.strokeRect(0, atmTop, W, atmBottom - atmTop);
  ghCtx.setLineDash([]);

  // Terra (el color s'escalfa amb la temperatura)
  const ground = ghCtx.createLinearGradient(0, atmBottom + 20, 0, H);
  ground.addColorStop(0, `rgb(${Math.round(lerp(56, 190, heat))},${Math.round(lerp(150, 80, heat))},${Math.round(lerp(98, 44, heat))})`);
  ground.addColorStop(1, `rgb(${Math.round(lerp(30, 110, heat))},${Math.round(lerp(80, 40, heat))},${Math.round(lerp(60, 30, heat))})`);
  ghCtx.fillStyle = ground;
  ghCtx.fillRect(0, atmBottom + 20, W, H - atmBottom - 20);

  // Sol
  const sunX = W * 0.1;
  const sunY = H * 0.12;
  const glow = ghCtx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 64);
  glow.addColorStop(0, 'rgba(255,225,120,1)');
  glow.addColorStop(1, 'rgba(255,201,60,0)');
  ghCtx.fillStyle = glow;
  ghCtx.beginPath(); ghCtx.arc(sunX, sunY, 64, 0, Math.PI * 2); ghCtx.fill();
  ghCtx.fillStyle = '#ffd95c';
  ghCtx.beginPath(); ghCtx.arc(sunX, sunY, 22, 0, Math.PI * 2); ghCtx.fill();

  // Raigs de llum que entren (tots arriben a la Terra)
  const groundY = atmBottom + 20;
  for (let i = 0; i < 5; i++) {
    const x1 = sunX + 24 + i * 12;
    const y1 = sunY + 12 + i * 6;
    const x2 = W * (0.22 + i * 0.09);
    ghCtx.strokeStyle = 'rgba(255,217,92,.55)';
    ghCtx.lineWidth = 2;
    ghCtx.beginPath(); ghCtx.moveTo(x1, y1); ghCtx.lineTo(x2, groundY); ghCtx.stroke();
    const progress = (time * 0.35 + i * 0.2) % 1;
    ghCtx.fillStyle = '#ffd95c';
    ghCtx.beginPath();
    ghCtx.arc(lerp(x1, x2, progress), lerp(y1, groundY, progress), 4, 0, Math.PI * 2);
    ghCtx.fill();
  }

  // Molècules de CO₂ (n'hi ha més com més ppm)
  const molecules = Math.round(step.ppm / 12);
  for (let i = 0; i < molecules; i++) {
    const spot = CO2_SPOTS[i];
    const x = (spot.x * (W - 40) + 20 + Math.sin(time * spot.speed + i) * 8);
    const y = atmTop + 14 + spot.y * (atmBottom - atmTop - 28) + Math.cos(time * spot.speed + i) * 5;
    ghCtx.fillStyle = 'rgba(255,255,255,.88)';
    ghCtx.beginPath(); ghCtx.arc(x - 5, y, 4.2, 0, Math.PI * 2); ghCtx.fill();
    ghCtx.beginPath(); ghCtx.arc(x + 5, y, 4.2, 0, Math.PI * 2); ghCtx.fill();
    ghCtx.fillStyle = 'rgba(255,138,61,.95)';
    ghCtx.beginPath(); ghCtx.arc(x, y, 5.6, 0, Math.PI * 2); ghCtx.fill();
  }

  // Calor que torna a sortir: part s'escapa i part es queda atrapada
  const trapped = 0.2 + 0.55 * heat; // fracció que torna cap a baix
  const rays = 7;
  for (let i = 0; i < rays; i++) {
    const x = W * (0.42 + i * 0.075);
    const bounces = i / rays < trapped;
    const phase = (time * 0.45 + i * 0.13) % 1;
    ghCtx.strokeStyle = bounces ? 'rgba(255,93,74,.7)' : 'rgba(255,170,120,.4)';
    ghCtx.lineWidth = 2;
    ghCtx.setLineDash([5, 5]);
    ghCtx.beginPath();
    if (bounces) {
      ghCtx.moveTo(x, groundY);
      ghCtx.lineTo(x + 10, atmTop + 24);
      ghCtx.lineTo(x + 24, groundY - 6);
    } else {
      ghCtx.moveTo(x, groundY);
      ghCtx.lineTo(x + 16, H * 0.02);
    }
    ghCtx.stroke();
    ghCtx.setLineDash([]);
    const px = bounces
      ? (phase < 0.5 ? lerp(x, x + 10, phase * 2) : lerp(x + 10, x + 24, (phase - 0.5) * 2))
      : lerp(x, x + 16, phase);
    const py = bounces
      ? (phase < 0.5 ? lerp(groundY, atmTop + 24, phase * 2) : lerp(atmTop + 24, groundY - 6, (phase - 0.5) * 2))
      : lerp(groundY, H * 0.02, phase);
    ghCtx.fillStyle = bounces ? '#ff5d4a' : '#ffaa78';
    ghCtx.beginPath(); ghCtx.arc(px, py, 4, 0, Math.PI * 2); ghCtx.fill();
  }

  ghCtx.fillStyle = 'rgba(255,255,255,.78)';
  ghCtx.font = '600 12px ui-monospace, SFMono-Regular, Consolas, monospace';
  ghCtx.textAlign = 'left';
  ghCtx.fillText('llum del Sol', sunX + 38, sunY + 4);
  ghCtx.fillText('calor que s’escapa', W * 0.56, H * 0.06);
  ghCtx.fillText('calor atrapada pel CO₂', W * 0.5, atmTop + 14);
  ghCtx.textAlign = 'right';
  ghCtx.fillText('CO₂', W - 12, atmBottom - 8);
}

function updateGreenhouse() {
  ghStep = Number($('#ghSlider').value);
  const step = GH_STEPS[ghStep];
  $('#ghEra').textContent = step.era;
  $('#ghPpm').textContent = step.ppm;
  $('#ghDelta').textContent = step.delta === null ? '—' : `+${fmt(step.delta, 2)} °C`;
  $('#ghDeltaLabel').textContent = step.label;
  $('#ghSlider').setAttribute('aria-valuetext', `${step.era}: ${step.ppm} ppm de CO₂`);
}
$('#ghSlider').addEventListener('input', updateGreenhouse);
animateWhileVisible(ghCanvas, drawGreenhouse);
updateGreenhouse();

setupGuess({
  button: '#checkGhGuess', name: 'ghGuess', feedback: '#ghGuessFeedback', correct: 'b',
  text: 'El CO₂ no atura la llum del Sol, però no deixa escapar la calor que la Terra torna cap a l’espai.',
  progress: 'greenhouse',
});

/* ================================================================== */
/* 02 · TEMPS I CLIMA                                                 */
/* ================================================================== */
const climateCanvas = $('#climateCanvas');
const climateCtx = climateCanvas.getContext('2d');
// Dades d'exemple: temperatura mitjana de cada dia d'un mes de novembre (°C)
const DAILY = [6, 9, 7, 10, 12, 8, 6, 9, 13, 11, 8, 5, 7, 10, 12, 9, 8, 6, 10, 11, 9, 7, 8, 12, 10, 6, 8, 9, 11, 7];
// Increments de temperatura global per dècades (NASA/NOAA, vs 1951–1980)
const DECADES = [
  { year: 1980, delta: 0.26 }, { year: 1990, delta: 0.45 }, { year: 2000, delta: 0.61 },
  { year: 2010, delta: 0.72 }, { year: 2020, delta: 1.02 }, { year: 2024, delta: 1.28 },
];
const CLIMATE_TEXT = [
  { word: '1 dia', note: 'Amb un sol dia només veiem el temps: avui fa fred. No podem saber res del clima.' },
  { word: '1 mes', note: 'Amb un mes veiem que la temperatura puja i baixa cada dia. Això també és temps, no clima.' },
  { word: '1980–2024', note: 'Amb molts anys, mesurant sempre de la mateixa manera, apareix una tendència clara: el planeta s’escalfa.' },
];
let climateMode = 0;

function axis(ctx, plot, yMin, yMax, yTicks, yLabel, xLabel) {
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.font = '12px ui-monospace, SFMono-Regular, Consolas, monospace';
  ctx.textAlign = 'right';
  yTicks.forEach(value => {
    const y = plot.bottom - ((value - yMin) / (yMax - yMin)) * (plot.bottom - plot.top);
    ctx.beginPath(); ctx.moveTo(plot.left, y); ctx.lineTo(plot.right, y); ctx.stroke();
    ctx.fillText(String(value).replace('.', ','), plot.left - 8, y + 4);
  });
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.moveTo(plot.left, plot.top); ctx.lineTo(plot.left, plot.bottom); ctx.lineTo(plot.right, plot.bottom); ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillText(yLabel, 8, plot.top - 10);
  ctx.textAlign = 'right';
  ctx.fillText(xLabel, plot.right, plot.bottom + 30);
}

function drawClimate() {
  const rect = resizeCanvas(climateCanvas, climateCtx);
  const ctx = climateCtx;
  const plot = { left: 52, right: rect.width - 20, top: 34, bottom: rect.height - 40 };
  ctx.clearRect(0, 0, rect.width, rect.height);

  if (climateMode < 2) {
    const yMin = 0; const yMax = 16;
    axis(ctx, plot, yMin, yMax, [0, 4, 8, 12, 16], 'temperatura (°C)', climateMode === 0 ? 'dia 1' : 'dies del mes');
    const count = climateMode === 0 ? 1 : DAILY.length;
    const xAt = i => climateMode === 0 ? (plot.left + plot.right) / 2 : plot.left + 12 + (i / (DAILY.length - 1)) * (plot.right - plot.left - 24);
    const yAt = v => plot.bottom - ((v - yMin) / (yMax - yMin)) * (plot.bottom - plot.top);
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const x = xAt(i); const y = yAt(DAILY[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#4cc9f0'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
    for (let i = 0; i < count; i++) {
      ctx.beginPath(); ctx.arc(xAt(i), yAt(DAILY[i]), climateMode === 0 ? 9 : 4, 0, Math.PI * 2);
      ctx.fillStyle = '#4cc9f0'; ctx.fill();
    }
    if (climateMode === 0) {
      ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.font = '700 16px ui-monospace, monospace';
      ctx.fillText(`${DAILY[0]} °C`, xAt(0), yAt(DAILY[0]) - 20);
    }
  } else {
    const yMin = 0; const yMax = 1.5;
    axis(ctx, plot, yMin, yMax, [0, 0.5, 1, 1.5], 'increment de temperatura (°C)', 'any');
    const xAt = year => plot.left + 24 + ((year - 1980) / 44) * (plot.right - plot.left - 48);
    const yAt = v => plot.bottom - ((v - yMin) / (yMax - yMin)) * (plot.bottom - plot.top);
    ctx.beginPath();
    DECADES.forEach((point, i) => {
      const x = xAt(point.year); const y = yAt(point.delta);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#ff8a3d'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.textAlign = 'center'; ctx.font = '12px ui-monospace, monospace';
    DECADES.forEach(point => {
      const x = xAt(point.year); const y = yAt(point.delta);
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = '#ffc93c'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.fillText(String(point.year), x, plot.bottom + 16);
      ctx.fillText(`+${fmt(point.delta, 2)}`, x, y - 14);
    });
  }
}

function updateClimate() {
  climateMode = Number($('#climateSlider').value);
  $('#climateWord').textContent = CLIMATE_TEXT[climateMode].word;
  $('#climateNote').textContent = CLIMATE_TEXT[climateMode].note;
  $('#climateSlider').setAttribute('aria-valuetext', CLIMATE_TEXT[climateMode].word);
  drawClimate();
}
$('#climateSlider').addEventListener('input', updateClimate);
const CLIMATE_QUESTIONS = [
  'La línia puja. Vol dir que, amb els anys, la temperatura ha anat augmentant.',
  'El punt de 2024 és el més alt de tots (+1,28). És l’any més calorós del gràfic.',
  'El punt de 1980 és el més baix (+0,26). És l’any menys càlid del gràfic.',
];
$('#checkClimGuess').addEventListener('click', () => {
  const questions = $$('#climateHypothesis .chart-q');
  const overall = $('#climGuessFeedback');
  let answered = 0; let right = 0;
  questions.forEach((box, i) => {
    const picked = $(`input[name="climQ${i + 1}"]:checked`);
    const out = $('.chart-q-feedback', box);
    if (!picked) { out.textContent = ''; out.className = 'chart-q-feedback'; return; }
    answered += 1;
    const ok = picked.value === box.dataset.correct;
    if (ok) right += 1;
    out.textContent = `${ok ? '✓ Correcte. ' : '✗ Torna-ho a provar. '}Retroacció: ${CLIMATE_QUESTIONS[i]}`;
    out.className = `chart-q-feedback ${ok ? 'success-text' : 'error-text'}`;
  });
  if (answered < questions.length) {
    overall.textContent = 'Respon les 3 preguntes abans de comprovar-les.';
    overall.className = 'error-text';
  } else if (right === questions.length) {
    overall.textContent = 'Molt bé! Amb moltes dades durant molts anys es veu clarament que el planeta s’escalfa.';
    overall.className = 'success-text';
    markProgress('climate');
  } else {
    overall.textContent = `Has encertat ${right} de ${questions.length}. Mira el gràfic un cop més i corregeix les que falten.`;
    overall.className = 'error-text';
  }
});

/* ================================================================== */
/* 03 · TEMPERATURA I CONFORT                                         */
/* ================================================================== */
const COMFORT = [
  { t: -5, icon: '🥶', zone: 'FRED EXTREM', name: 'Una nit gelada', advice: 'El fred extrem pot provocar gelades, danyar les plantes i augmentar el risc d’hipotèrmia.', color: '#4cc9f0' },
  { t: 10, icon: '🧥', zone: 'FRESC', name: 'Un matí fresc', advice: 'Ens cal roba d’abric. Per sota de 16 °C es considera que fa massa fred a casa.', color: '#6fb7e8' },
  { t: 20, icon: '🏠', zone: 'CONFORT', name: 'Un menjador confortable', advice: 'És la temperatura més confortable per a les persones i afavoreix el benestar.', color: '#3fae6a' },
  { t: 30, icon: '🌞', zone: 'CALOR INTENSA', name: 'Una terrassa a ple sol', advice: 'La calor intensa pot causar deshidratació, cansament i dificultar la concentració.', color: '#f0a52b' },
  { t: 36, icon: '🥵', zone: 'CALOR INTENSA', name: 'Una habitació sense ventilar a l’estiu', advice: 'Cal beure aigua, fer ombra i ventilar. Costa molt concentrar-se.', color: '#ea7a2b' },
  { t: 43, icon: '🔥', zone: 'CALOR EXTREMA', name: 'Una onada de calor', advice: 'La calor extrema és perillosa per a la salut i pot provocar incendis, sequera i danys als ecosistemes.', color: '#d9463a' },
];

function updateComfort() {
  const item = COMFORT[Number($('#comfortSlider').value)];
  $('#comfortIcon').textContent = item.icon;
  $('#comfortName').textContent = item.name;
  $('#comfortZone').textContent = item.zone;
  $('#comfortAdvice').textContent = item.advice;
  $('#comfortTemp').textContent = fmt(item.t, 0);
  $('#comfortStage').style.setProperty('--situation-color', item.color);
  $('#comfortSlider').setAttribute('aria-valuetext', `${item.name}, aproximadament ${item.t} graus`);
}
$('#comfortSlider').addEventListener('input', updateComfort);
setupGuess({
  button: '#checkComfortGuess', name: 'comfortGuess', feedback: '#comfortGuessFeedback', correct: 'a',
  text: 'A les aules, la temperatura de confort és aproximadament entre 18 °C i 22 °C.',
  progress: 'comfort',
});

updateComfort();
updateClimate();
window.addEventListener('resize', drawClimate);
