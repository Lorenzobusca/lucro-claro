/* TELA: página inicial. Animações ligadas à rolagem:
   a nota fiscal se separando em CBS e IBS, a linha do tempo da reforma e os celulares dos vídeos.
   Só mexe em transform e opacity, uma vez por quadro. */
import { $, semMovimento } from '../ui/numero.js';
import { lerTrilha, feitas, proximaPendente, trilhaCompleta } from '../ui/trilha.js';
import { TOTAL_ETAPAS } from '../calculo/trilha.js';

const nota = $('receipt'), cbs = $('chipCbs'), ibs = $('chipIbs'), antigos = $('chipOld'), hero = document.querySelector('.hero');
const linha = $('tl'), preenchimento = $('tlFill');
const etapas = [...document.querySelectorAll('.step')], celulares = [...document.querySelectorAll('.reel')];

let agendado = false;
function quadro() {
  agendado = false;
  const alturaTela = innerHeight;

  if (!semMovimento) {
    /* p vai de 0 (topo da página) a 1 (apresentação saiu da tela) */
    const p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight || 1)));
    nota.style.transform = `translateY(${p * 70}px) rotate(${-7 + 9 * p}deg)`;
    cbs.style.transform = `translate(${p * 40}px,${-p * 50}px) rotate(${4 - 8 * p}deg)`;
    ibs.style.transform = `translate(${p * 20}px,${p * 30}px) rotate(${-3 + 7 * p}deg)`;
    antigos.style.transform = `translate(${-p * 60}px,${p * 40}px)`;
    antigos.style.opacity = 1 - p * .8;
    celulares.forEach((el, i) => {
      const r = el.getBoundingClientRect(), centro = (r.top + r.height / 2 - alturaTela / 2) / alturaTela;
      el.style.transform = `translateY(${centro * (i % 2 ? -40 : 40)}px)`;
    });
  }

  /* A linha do tempo se preenche até 60% da altura da tela */
  const r = linha.getBoundingClientRect(), marca = alturaTela * 0.6;
  const progresso = Math.min(1, Math.max(0, (marca - r.top) / r.height));
  preenchimento.style.transform = `scaleY(${progresso})`;
  etapas.forEach(el => el.classList.toggle('on', el.getBoundingClientRect().top < marca));
}

addEventListener('scroll', () => { if (!agendado) { agendado = true; requestAnimationFrame(quadro); } }, { passive: true });
addEventListener('resize', quadro);
quadro();

/* Quem já começou a trilha "Comece por aqui" vê de onde parou */
const trilha = lerTrilha();
if (trilha && feitas(trilha) > 0) {
  const botao = $('hero-comece'), cont = $('hero-continuar'), f = feitas(trilha), prox = proximaPendente(trilha, trilha.atual || 1);
  if (trilhaCompleta(trilha)) {
    botao.firstChild.textContent = 'Trilha concluída: acompanhar este mês';
    botao.href = 'metas.html#metas';
  } else {
    botao.firstChild.textContent = 'Continuar de onde parei';
    botao.href = 'comece.html#etapa-' + prox;
  }
  cont.hidden = false;
  cont.href = 'comece.html';
  $('hero-prog').style.width = (f / TOTAL_ETAPAS * 100) + '%';
  $('hero-prog-texto').textContent = `${f} de ${TOTAL_ETAPAS} etapas da trilha`;
}
