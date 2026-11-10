/* UI: abas que trocam de ferramenta dentro da página.
   Marcação esperada: <button class="tab" role="tab" id="t-NOME" aria-controls="p-NOME"> e <div id="p-NOME" role="tabpanel">.
   Um link com #NOME abre direto aquela aba. Quando uma aba abre, o painel recebe o evento "aba-aberta". */
import { semMovimento } from './numero.js';

const abas = [...document.querySelectorAll('.tab')];
const indicador = document.createElement('i');
indicador.className = 'aba-ind';
indicador.setAttribute('aria-hidden', 'true');

function aplicar(aba) {
  abas.forEach(x => {
    const ativa = x === aba;
    x.setAttribute('aria-selected', ativa);
    x.tabIndex = ativa ? 0 : -1;
    document.getElementById(x.getAttribute('aria-controls')).hidden = !ativa;
  });
  aba.prepend(indicador);
  try { localStorage.setItem('lc-tab', aba.id); } catch (e) {}
  document.getElementById(aba.getAttribute('aria-controls')).dispatchEvent(new CustomEvent('aba-aberta'));
}

/* Com animação, o indicador desliza de uma aba para a outra (onde o navegador suporta) */
function abrir(aba, animar) {
  if (!animar || semMovimento || !document.startViewTransition) return aplicar(aba);
  document.documentElement.classList.add('vt-aba');
  document.startViewTransition(() => aplicar(aba)).finished.finally(() => document.documentElement.classList.remove('vt-aba'));
}

abas.forEach((aba, i) => {
  aba.addEventListener('click', () => abrir(aba, true));
  aba.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const outra = abas[(i + (e.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length];
    abrir(outra, true);
    outra.focus();
  });
});

const abrirPeloLink = () => {
  const aba = document.getElementById('t-' + location.hash.slice(1));
  if (aba && abas.includes(aba)) { abrir(aba, false); return true; }
  return false;
};
addEventListener('hashchange', abrirPeloLink);

if (abas.length && !abrirPeloLink()) {
  let salva = null;
  try { salva = document.getElementById(localStorage.getItem('lc-tab')); } catch (e) {}
  abrir(abas.includes(salva) ? salva : abas[0], false);
}
