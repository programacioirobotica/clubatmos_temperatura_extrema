export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export const lerp = (a, b, t) => a + (b - a) * t;

/** Format català: coma decimal i signe menys tipogràfic. */
export function fmt(value, decimals = 1) {
  const text = Number(value).toFixed(decimals).replace('.', ',');
  return text.startsWith('-') ? `−${text.slice(1)}` : text;
}

/** Converteix text escrit per l'alumnat ("20,7", "20.7", "−3") en un número (NaN si no és vàlid). */
export function parseNumber(text) {
  if (typeof text !== 'string') return NaN;
  const clean = text.trim().replace(',', '.').replace('−', '-').replace('+', '');
  if (clean === '' || !/^-?\d+(\.\d+)?$/.test(clean)) return NaN;
  return Number(clean);
}

export const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/* Progrés global (el percentatge de la capçalera)                    */
/* ------------------------------------------------------------------ */
export const PROGRESS_KEYS = [
  'greenhouse', 'climate', 'comfort',      // 3 hipòtesis de «Aprèn»
  'labHyp', 'labExplore',                  // laboratori del menjador
  'mission', 'quiz',                       // final
];
const progress = new Set();

export function markProgress(key) {
  if (!PROGRESS_KEYS.includes(key)) return;
  progress.add(key);
  const percent = Math.round((progress.size / PROGRESS_KEYS.length) * 100);
  $('#progressValue').textContent = percent;
}

/* ------------------------------------------------------------------ */
/* Canvas nítids i animació només quan són visibles                   */
/* ------------------------------------------------------------------ */
export function resizeCanvas(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * ratio);
  const height = Math.round(rect.height * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return rect;
}

const tasks = [];
let loopStarted = false;
const observer = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const task = tasks.find(item => item.el === entry.target);
        if (task) task.visible = entry.isIntersecting;
      });
    })
  : null;

/** Executa `draw(segons)` a cada fotograma mentre l'element és visible. */
export function animateWhileVisible(el, draw) {
  const task = { el, draw, visible: !observer };
  tasks.push(task);
  if (observer) observer.observe(el);
  if (!loopStarted) {
    loopStarted = true;
    const loop = (time) => {
      const seconds = prefersReducedMotion() ? 0 : time / 1000;
      for (const item of tasks) if (item.visible) item.draw(seconds);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  return task;
}

/* ------------------------------------------------------------------ */
/* Zones de temperatura (graus centígrads)                            */
/* ------------------------------------------------------------------ */
export function zoneFor(t) {
  if (t < 0) return { key: 'cold', label: 'Fred extrem · risc de gelades', color: '#4cc9f0', ink: '#1c6a8c' };
  if (t < 16) return { key: 'cool', label: 'Fred · massa fresc per estar-hi bé', color: '#6fb7e8', ink: '#1c6a8c' };
  if (t < 18) return { key: 'fresh', label: 'Fresc · una mica per sota del confort', color: '#7fc7a8', ink: '#2f7a63' };
  if (t <= 22) return { key: 'ok', label: 'Zona de confort · s’hi està bé', color: '#3fae6a', ink: '#08786f' };
  if (t <= 25) return { key: 'warm', label: 'Una mica càlid · encara tolerable', color: '#d9b93a', ink: '#7a6200' };
  if (t < 35) return { key: 'hot', label: 'Calor · pot costar concentrar-se', color: '#f0902b', ink: '#a35511' };
  if (t < 40) return { key: 'hot', label: 'Calor intensa · cal beure aigua i fer ombra', color: '#e4642b', ink: '#a3451b' };
  return { key: 'extreme', label: 'Calor extrema · perillosa per a la salut', color: '#d9463a', ink: '#a3453f' };
}

/** Posició (0–100 %) d'una temperatura a la barra d'espectre (10–45 °C). */
export const spectrumPosition = (t) => clamp(((t - 10) / 35) * 100, 1, 98);

/* ------------------------------------------------------------------ */
/* Pistes d'hipòtesi (targeta groga)                                  */
/* ------------------------------------------------------------------ */
export function setupGuess({ button, name, feedback, correct, text, progress: key }) {
  $(button).addEventListener('click', () => {
    const answer = $(`input[name="${name}"]:checked`);
    const box = $(feedback);
    if (!answer) {
      box.textContent = 'Tria una resposta abans de comprovar-la.';
      box.className = 'error-text';
    } else if (answer.value === correct) {
      box.textContent = `Sí! ${text}`;
      box.className = 'success-text';
      if (key) markProgress(key);
    } else {
      box.textContent = `Resposta incorrecta. ${text}`;
      box.className = 'error-text';
    }
  });
}

/* ------------------------------------------------------------------ */
/* So (Web Audio): sempre a volum baix                                */
/* ------------------------------------------------------------------ */
let audioContext;
function context() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioContext = audioContext || new Ctx();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function tone(freq, start, duration, type = 'square', volume = 0.035) {
  const ctx = context();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t0 = ctx.currentTime + start;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playAlarm() {
  [0, 0.22, 0.44, 0.66].forEach((time, i) => tone(i % 2 ? 660 : 880, time, 0.18));
}

export function playChime() {
  [523, 659, 784, 1047].forEach((freq, i) => tone(freq, i * 0.11, 0.22, 'sine', 0.05));
}

export function playTick() {
  tone(740, 0, 0.05, 'triangle', 0.03);
}
