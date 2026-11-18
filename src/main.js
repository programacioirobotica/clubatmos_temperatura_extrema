import '@fontsource-variable/space-grotesk';
import './style.css';
import './components.css';

import { $ } from './utils.js';
import './hero.js';
import './foundations.js';
import './lab.js';
import './mission.js';

/* Diàleg "Quina és la missió?" */
const primer = $('#primerDialog');
$('#openPrimer').addEventListener('click', () => primer.showModal());
$('#closePrimer').addEventListener('click', () => primer.close());
$('#primerContinue').addEventListener('click', () => {
  primer.close();
  $('#explora').scrollIntoView({ behavior: 'smooth' });
});
primer.addEventListener('click', (event) => {
  const bounds = primer.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right
    || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) primer.close();
});
