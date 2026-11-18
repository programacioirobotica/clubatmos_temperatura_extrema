import { $, clamp, fmt, resizeCanvas, animateWhileVisible, zoneFor } from './utils.js';

const heroCanvas = $('#heroScope');
const heroCtx = heroCanvas.getContext('2d');

/** Ona de calor decorativa: la intensitat segueix la temperatura simulada. */
function drawHeroScope(time) {
  const rect = resizeCanvas(heroCanvas, heroCtx);
  heroCtx.clearRect(0, 0, rect.width, rect.height);
  const mid = rect.height / 2;
  const phase = time * 1.4;
  for (let line = 0; line < 3; line++) {
    heroCtx.beginPath();
    for (let x = 0; x <= rect.width; x += 3) {
      const envelope = 0.45 + 0.55 * Math.sin(x * 0.011 + phase * 0.3 + line) ** 2;
      const y = mid + (line - 1) * 34
        + Math.sin(x * 0.02 + phase + line * 1.3) * rect.height * 0.12 * envelope
        + Math.sin(x * 0.007 - phase * 0.5) * 18;
      if (x === 0) heroCtx.moveTo(x, y); else heroCtx.lineTo(x, y);
    }
    const gradient = heroCtx.createLinearGradient(0, 0, rect.width, 0);
    gradient.addColorStop(0, 'rgba(255,138,61,0)');
    gradient.addColorStop(0.3, line === 1 ? '#ff8a3d' : 'rgba(255,138,61,.55)');
    gradient.addColorStop(0.75, line === 1 ? '#ffc93c' : 'rgba(255,201,60,.5)');
    gradient.addColorStop(1, 'rgba(255,201,60,0)');
    heroCtx.strokeStyle = gradient;
    heroCtx.lineWidth = line === 1 ? 3 : 1.6;
    heroCtx.shadowColor = '#ff8a3d';
    heroCtx.shadowBlur = line === 1 ? 14 : 0;
    heroCtx.stroke();
  }
  heroCtx.shadowBlur = 0;
}

animateWhileVisible(heroCanvas, drawHeroScope);

/* Lectura simulada d'un termòmetre durant un "dia" */
let tick = 0;
function updateHeroMeter() {
  tick += 1;
  const temperature = 22 + 9 * Math.sin(tick / 9) + 2 * Math.sin(tick / 3.7);
  const zone = zoneFor(temperature);
  $('#heroTemp').textContent = fmt(temperature, 1);
  $('#heroMeterFill').style.background = zone.color;
  $('#heroMeterFill').style.width = `${clamp(((temperature - 10) / 35) * 100, 4, 100)}%`;
  $('#heroStatus').lastChild.textContent = ` ${zone.label.split(' · ')[0]}`;
  $('#heroStatus span').style.background = zone.color;
  $('#heroStatus span').style.boxShadow = `0 0 12px ${zone.color}`;
}
updateHeroMeter();
setInterval(updateHeroMeter, 900);
