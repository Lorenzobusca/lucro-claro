/* UI: ajuda dentro das ferramentas.
   1) Faixa "Primeira vez aqui?" no topo de cada ferramenta, com o botão "Como usar".
   2) Tour: balões que apontam campo por campo. Abre sozinho na primeira visita (chave lc-tour-<ferramenta>),
      dá para pular com Esc e reabrir pelo botão.
   3) Botões "?" ao lado dos termos técnicos, com a explicação de uma linha e link para o glossário.

   Uso, no fim de cada tela:
     registrarTour('margem', { painel: 'p-margem', etapa: 4, passos: [{ alvo: 'm-preco', titulo: '...', texto: '...', termo: 'Margem de contribuição' }] });
   O "termo" é opcional: quando existe, o campo ganha um "?" com a definição do glossário. */
import { $, semMovimento } from './numero.js';
import { definicao, abrirGlossario } from './glossario.js';

const SETA = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const seguro = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jaViu = chave => { try { return localStorage.getItem('lc-tour-' + chave) === '1'; } catch (e) { return false; } };
const marcarVisto = chave => { try { localStorage.setItem('lc-tour-' + chave, '1'); } catch (e) {} };
const painelVisivel = painel => painel && !painel.hidden && !painel.classList.contains('travado') && painel.getClientRects().length > 0;   /* travado = ferramenta do plano completo, vista no plano grátis */

/* ---------- Botão "?" com explicação curta ---------- */
let popover = null;
function fecharPopover() { if (popover) { popover.remove(); popover = null; } }
document.addEventListener('click', e => { if (popover && !e.target.closest('.ajuda, .ajuda-pop')) fecharPopover(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharPopover(); });

export function botaoAjuda(termo) {
  const texto = definicao(termo);
  if (!texto) return null;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'ajuda';
  b.setAttribute('aria-label', `O que é ${termo}?`);
  b.setAttribute('aria-expanded', 'false');
  b.textContent = '?';
  b.addEventListener('click', e => {
    e.preventDefault();
    const aberto = popover && popover._dono === b;
    fecharPopover();
    document.querySelectorAll('.ajuda[aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded', 'false'));
    if (aberto) return;
    popover = document.createElement('div');
    popover.className = 'ajuda-pop';
    popover.setAttribute('role', 'note');
    popover._dono = b;
    popover.innerHTML = `<b>${seguro(termo)}</b><p>${seguro(texto)}</p><button type="button" class="link" data-glossario>Ver no glossário</button>`;
    popover.querySelector('[data-glossario]').addEventListener('click', () => { fecharPopover(); abrirGlossario(termo); });
    b.setAttribute('aria-expanded', 'true');
    b.insertAdjacentElement('afterend', popover);
  });
  return b;
}

/* Põe o "?" no rótulo do campo (o texto do rótulo é o primeiro nó de texto do <label>) */
function ajudaNoCampo(idDoCampo, termo) {
  const campo = $(idDoCampo);
  const rotulo = campo?.closest('label');
  if (!rotulo || rotulo.querySelector('.ajuda')) return;
  const b = botaoAjuda(termo);
  if (b) campo.insertAdjacentElement('beforebegin', b);
}

/* ---------- Tour ---------- */
let ativo = null;

function fecharTour(chave) {
  if (!ativo) return;
  ativo.capa.remove(); ativo.balao.remove();
  document.querySelector('.tour-alvo')?.classList.remove('tour-alvo');
  const voltar = ativo.voltarPara;
  ativo = null;
  marcarVisto(chave);
  voltar?.focus?.();
}

function mostrarPasso(def, chave, i) {
  const passo = def.passos[i], alvo = $(passo.alvo) || document.getElementById(def.painel);
  document.querySelector('.tour-alvo')?.classList.remove('tour-alvo');
  const caixaAlvo = alvo.closest('label, td, .card, .painel-top') || alvo;
  caixaAlvo.classList.add('tour-alvo');
  caixaAlvo.scrollIntoView({ block: 'center', behavior: semMovimento ? 'auto' : 'smooth' });

  const ultimo = i === def.passos.length - 1;
  ativo.balao.innerHTML = `
    <span class="tour-contagem">${i + 1} de ${def.passos.length}</span>
    <h3 id="tour-titulo">${seguro(passo.titulo)}</h3>
    <p>${passo.texto}</p>
    ${passo.exemplo ? `<p class="tour-exemplo"><b>Exemplo:</b> ${passo.exemplo}</p>` : ''}
    <div class="tour-botoes">
      <button type="button" class="btn-mini apagar" data-tour="pular">Pular</button>
      ${i > 0 ? '<button type="button" class="btn-mini apagar" data-tour="anterior">Anterior</button>' : ''}
      <button type="button" class="btn-mini" data-tour="proximo">${ultimo ? 'Entendi' : 'Próximo'}${ultimo ? '' : SETA}</button>
    </div>`;
  ativo.balao.querySelector('[data-tour="proximo"]').focus();
  ativo.i = i;

  /* Posição: abaixo do alvo no computador; no celular, fixo embaixo (ver CSS) */
  requestAnimationFrame(() => {
    const b = ativo?.balao; if (!b) return;
    const r = caixaAlvo.getBoundingClientRect(), largura = b.offsetWidth, altura = b.offsetHeight;
    const cabeEmbaixo = r.bottom + altura + 16 < innerHeight;
    const top = (cabeEmbaixo ? r.bottom + 12 : Math.max(12, r.top - altura - 12)) + scrollY;
    const left = Math.max(12, Math.min(r.left + scrollX, innerWidth - largura - 12 + scrollX));
    b.style.top = top + 'px'; b.style.left = left + 'px';
    b.classList.toggle('acima', !cabeEmbaixo);
  });
}

function iniciarTour(def, chave, botao) {
  if (ativo) fecharTour(ativo.chave);
  const capa = document.createElement('div');
  capa.className = 'tour-capa';
  const balao = document.createElement('div');
  balao.className = 'tour-balao';
  balao.setAttribute('role', 'dialog');
  balao.setAttribute('aria-modal', 'false');
  balao.setAttribute('aria-labelledby', 'tour-titulo');
  document.body.append(capa, balao);
  ativo = { capa, balao, chave, i: 0, voltarPara: botao };

  balao.addEventListener('click', e => {
    const acao = e.target.closest('[data-tour]')?.dataset.tour;
    if (!acao) return;
    if (acao === 'pular') fecharTour(chave);
    else if (acao === 'anterior') mostrarPasso(def, chave, ativo.i - 1);
    else if (ativo.i + 1 < def.passos.length) mostrarPasso(def, chave, ativo.i + 1);
    else fecharTour(chave);
  });
  capa.addEventListener('click', () => fecharTour(chave));
  balao.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharTour(chave);
    if (e.key === 'ArrowRight' && ativo.i + 1 < def.passos.length) mostrarPasso(def, chave, ativo.i + 1);
    if (e.key === 'ArrowLeft' && ativo.i > 0) mostrarPasso(def, chave, ativo.i - 1);
  });
  mostrarPasso(def, chave, 0);
}

/* ---------- Registro de uma ferramenta ---------- */
export function registrarTour(chave, def) {
  const painel = $(def.painel);
  if (!painel) return;

  /* "?" nos campos com termo */
  def.passos.forEach(p => { if (p.termo) ajudaNoCampo(p.alvo, p.termo); });

  /* Faixa no topo do formulário */
  const form = painel.querySelector('.card.form') || painel.querySelector('.card');
  const faixa = document.createElement('div');
  faixa.className = 'primeira-vez';
  faixa.innerHTML = `<span>Primeira vez aqui? Veja como usar.</span>
    <button type="button" class="btn-mini" data-como-usar>Como usar</button>
    ${def.etapa ? `<a href="comece.html#etapa-${def.etapa}">Ver na trilha "Comece por aqui"${SETA}</a>` : ''}`;
  form.prepend(faixa);
  const botao = faixa.querySelector('[data-como-usar]');
  botao.addEventListener('click', () => iniciarTour(def, chave, botao));

  /* Abre sozinho na primeira visita, se a ferramenta estiver à vista. Não abre dentro de um exemplo da trilha,
     para não atrapalhar quem veio pelo "Testar com exemplo". */
  const veioDaTrilha = new URLSearchParams(location.search).has('ex');
  const tentarAbrir = () => { if (!jaViu(chave) && !veioDaTrilha && painelVisivel(painel) && !ativo) setTimeout(() => { if (painelVisivel(painel) && !ativo) iniciarTour(def, chave, botao); }, 700); };
  tentarAbrir();
  painel.addEventListener('aba-aberta', tentarAbrir);
}
