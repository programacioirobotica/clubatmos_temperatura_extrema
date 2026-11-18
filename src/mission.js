import { $, $$, clamp, markProgress, playChime } from './utils.js';

const MISSION_START = 100;  // % d'emissions de CO₂ de partida
const MISSION_TARGET = 62;  // %: objectiu per fer retrocedir l'Ombra
const MISSION_BUDGET = 7;
const MISSION_MEASURES = 3;

const state = { checked: false };
const buttons = $$('#measures button');

for (let i = 0; i < MISSION_BUDGET; i++) $('#budgetDots').append(document.createElement('i'));
for (let i = 0; i < MISSION_MEASURES; i++) $('#countDots').append(document.createElement('i'));

const selected = () => buttons.filter(button => button.classList.contains('selected'));
const sum = (list, key) => list.reduce((total, button) => total + Number(button.dataset[key]), 0);

function updateMission() {
  const chosen = selected();
  const reduction = sum(chosen, 'reduction');
  const cost = sum(chosen, 'cost');
  const emissions = MISSION_START - reduction;
  $('#missionTemp').textContent = emissions;
  $('#budgetValueTop').textContent = cost;
  $('#measureCount').textContent = chosen.length;
  $('#budgetDots').setAttribute('aria-label', `${cost} de ${MISSION_BUDGET} punts utilitzats`);
  $$('#budgetDots i').forEach((dot, index) => dot.classList.toggle('used', index < cost));
  $$('#countDots i').forEach((dot, index) => dot.classList.toggle('used', index < chosen.length));
  $('.dash-count').classList.toggle('is-done', chosen.length === MISSION_MEASURES);
  $('.dash-emissions').classList.toggle('is-ok', emissions <= MISSION_TARGET);
  $('#missionDial').style.setProperty('--level', `${clamp(emissions, 4, 100)}%`);
  $('#missionDial').classList.toggle('is-ok', emissions <= MISSION_TARGET);
  $('#missionMessage').textContent = emissions <= MISSION_TARGET
    ? 'Objectiu d’emissions assolit'
    : emissions <= MISSION_TARGET + 10 ? 'Gairebé ho tens' : 'Cal actuar';
  const missing = MISSION_MEASURES - chosen.length;
  const over = cost - MISSION_BUDGET;
  const left = emissions - MISSION_TARGET;
  $('#missionHint').textContent = missing > 0
    ? `Et ${missing === 1 ? 'falta 1 acció' : `falten ${missing} accions`} per triar.`
    : over > 0
      ? `Et passes ${over} ${over === 1 ? 'punt' : 'punts'} del pressupost: canvia alguna acció.`
      : left > 0
        ? `Encara et falten ${left} ${left === 1 ? 'punt' : 'punts'} per arribar al 62 %: prova una altra combinació.`
        : 'Proposta llesta! Prem «Comprova la proposta».';
  $('.dash-points').classList.toggle('over-budget', cost > MISSION_BUDGET);
  buttons.forEach(button => {
    button.disabled = !button.classList.contains('selected') && chosen.length >= MISSION_MEASURES;
    button.setAttribute('aria-pressed', String(button.classList.contains('selected')));
  });
  if (state.checked) {
    $('#missionFeedback').hidden = true;
    $('#missionSuccessArt').hidden = true;
  }
}

buttons.forEach(button => button.addEventListener('click', () => {
  button.classList.toggle('selected');
  state.checked = false;
  updateMission();
}));

$('#resetMission').addEventListener('click', () => {
  buttons.forEach(button => { button.classList.remove('selected'); button.disabled = false; });
  state.checked = false;
  $('#missionFeedback').hidden = true;
  $('#missionSuccessArt').hidden = true;
  updateMission();
});

$('#checkMission').addEventListener('click', () => {
  const chosen = selected();
  const reduction = sum(chosen, 'reduction');
  const cost = sum(chosen, 'cost');
  const emissions = MISSION_START - reduction;
  const feedback = $('#missionFeedback');
  const art = $('#missionSuccessArt');
  const usesCapture = chosen.some(button => button.dataset.key === 'capture');
  const usesWind = chosen.some(button => button.dataset.key === 'wind');
  feedback.classList.remove('error');
  art.hidden = true;
  if (chosen.length !== MISSION_MEASURES) {
    feedback.textContent = `Has de seleccionar exactament ${MISSION_MEASURES} accions. Ara en tens ${chosen.length}.`;
    feedback.classList.add('error');
  } else if (cost > MISSION_BUDGET) {
    feedback.textContent = `Has utilitzat ${cost} punts i el màxim és ${MISSION_BUDGET}.` +
      (usesCapture ? ' La planta de captura redueix molt, però és tan cara que no et deixa pressupost per a res més i encara és experimental: busca accions que evitin emetre CO₂.' : ' Busca una combinació més eficient.');
    feedback.classList.add('error');
  } else if (emissions > MISSION_TARGET) {
    feedback.textContent = `Has arribat al ${emissions} %. És una millora, però encara cal baixar ${emissions - MISSION_TARGET} ${emissions - MISSION_TARGET === 1 ? 'punt percentual' : 'punts percentuals'} més.`;
    feedback.classList.add('error');
  } else {
    feedback.textContent = `Missió superada: les emissions del barri baixen al ${emissions} % i l’Ombra retrocedeix. Has fet servir ${cost} de ${MISSION_BUDGET} punts i has triat exactament ${MISSION_MEASURES} accions` +
      (usesWind ? ', amb energia neta del vent: sense cremar combustibles, no s’emet més CO₂.' : '.');
    art.hidden = false;
    playChime();
    markProgress('mission');
  }
  state.checked = true;
  feedback.hidden = false;
});

/* Pregunta final */
$('#quizForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const answer = $('input[name="quiz"]:checked');
  const feedback = $('#quizFeedback');
  if (!answer) {
    feedback.textContent = 'Tria una resposta.';
    feedback.style.color = '#a3453f';
  } else if (answer.value === 'b') {
    feedback.textContent = 'Correcte. Un dia és temps; el clima es veu mesurant molt de temps de la mateixa manera.';
    feedback.style.color = '#08786f';
    markProgress('quiz');
  } else {
    feedback.textContent = 'Torna-ho a pensar: un dia fred no atura l’escalfament, i el CO₂ fa que la calor quedi atrapada, no que s’escapi.';
    feedback.style.color = '#a3453f';
  }
});

updateMission();
