/* TELA: painel do app (app/index.html). Saudação, plano, "Comece por aqui", ferramentas e o cálculo trazido do site. */
import { pronto } from './conta/iniciar.js';
import { seloDoPlano } from './conta/situacao.js';
import { iconeCadeado } from './conta/plano.js';
import { FERRAMENTAS_PAGAS, PLANOS } from '../../compartilhado/config/planos.js';
import { lerTrilha, feitas, trilhaCompleta } from '../../compartilhado/js/ui/trilha.js';
import { TOTAL_ETAPAS } from '../../compartilhado/js/calculo/trilha.js';

const $ = id => document.getElementById(id);
const seguro = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* As ferramentas pelo problema que resolvem, não pelo nome técnico */
const GRUPOS = [
  { titulo: 'Dinheiro do mês', setor: 'metas', itens: [
    { painel: 'p-caixa', href: 'metas.html#caixa', problema: 'Vai faltar dinheiro nos próximos meses?', nome: 'Fluxo de caixa', limite: `grátis: ${PLANOS.gratis.mesesDeCaixa} meses` },
    { painel: 'p-metas', href: 'metas.html#metas', problema: 'Estou no ritmo para bater a meta do mês?', nome: 'Metas do mês', limite: `grátis: ${PLANOS.gratis.metas} metas` },
    { painel: 'p-zero', href: 'metas.html#zero', problema: 'Onde dá para cortar gasto?', nome: 'Orçamento base zero' },
  ] },
  { titulo: 'Preço e lucro', setor: 'custeio', itens: [
    { painel: 'p-margem', href: 'custeio.html#margem', problema: 'Quanto preciso vender para pagar as contas?', nome: 'Margem e equilíbrio' },
    { painel: 'p-preco', href: 'custeio.html#preco', problema: 'Quanto cobrar para sobrar dinheiro de verdade?', nome: 'Formação de preço' },
    { painel: 'p-produtos', href: 'custeio.html#produtos', problema: 'Qual produto vale mais a pena vender?', nome: 'Margem por produto', limite: `grátis: ${PLANOS.gratis.produtos} produtos` },
    { painel: 'p-perdas', href: 'custeio.html#perdas', problema: 'Quanto o desperdício tira do meu bolso?', nome: 'Perdas' },
    { painel: 'p-custeio', href: 'custeio.html#custeio', problema: 'Esse produto dá lucro mesmo?', nome: 'Custeio ABC' },
  ] },
  { titulo: 'Imposto', setor: 'impostos', itens: [
    { painel: 'p-simples', href: 'impostos.html#simples', problema: 'Quanto pago de DAS e quanto falta para o limite do MEI?', nome: 'MEI e Simples' },
    { painel: 'p-iva', href: 'impostos.html#iva', problema: 'Quanto a reforma tributária muda no meu preço?', nome: 'IBS e CBS' },
  ] },
  { titulo: 'Seu dinheiro', setor: 'planejamento', itens: [
    { painel: 'p-invest', href: 'planejamento.html#invest', problema: 'Meu dinheiro guardado está perdendo para a inflação?', nome: 'Investimento × inflação' },
    { painel: 'p-carteira', href: 'planejamento.html#carteira', problema: 'Quanto o que eu guardo vai valer daqui a uns anos?', nome: 'Simulador de carteira' },
  ] },
];

const SETA = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function desenharFerramentas(pago) {
  $('ferramentas').innerHTML = GRUPOS.map(g => `
    <div class="ferr-grupo" data-setor="${g.setor}">
      <h3>${g.titulo}</h3>
      <ul>${g.itens.map(i => {
        const travada = !pago && FERRAMENTAS_PAGAS[i.painel];
        const selo = travada ? `<span class="ferr-selo">${iconeCadeado}Plano completo</span>` : (!pago && i.limite ? `<span class="ferr-selo leve">${i.limite}</span>` : '');
        return `<li><a class="ferr${travada ? ' travada' : ''}" href="${i.href}"><b>${i.problema}</b><span>${i.nome}</span>${selo}<i>${SETA}</i></a></li>`;
      }).join('')}</ul>
    </div>`).join('');
}

function desenharTrilha() {
  const t = lerTrilha();
  if (!t) return;
  const n = feitas(t);
  $('trilha-barra').style.width = `${n / TOTAL_ETAPAS * 100}%`;
  if (trilhaCompleta(t)) {
    $('trilha-texto').textContent = 'Você fez todas as etapas. Volte quando quiser rever os números.';
    $('trilha-botao').textContent = 'Rever a trilha';
  } else if (n > 0) {
    $('trilha-texto').textContent = `Você já fez ${n} de ${TOTAL_ETAPAS} etapas.`;
    $('trilha-botao').textContent = 'Continuar';
  }
}

function desenharChegada() {
  let feita = null;
  try { feita = localStorage.getItem('lc-chegada-feita'); localStorage.removeItem('lc-chegada-feita'); } catch (e) {}
  if (!feita) return;
  const caixa = feita === 'retirada';
  $('chegada').hidden = false;
  $('chegada').innerHTML = `
    <p class="eyebrow">Trouxemos o seu cálculo do site</p>
    <h2>${caixa ? 'Sua retirada do mês já está no fluxo de caixa' : 'Seu faturamento já está na ferramenta do MEI'}</h2>
    <p class="hint">${caixa ? 'Agora anote o que espera vender e gastar nos próximos meses para ver se o dinheiro falta em algum deles.' : 'Lá você vê o DAS do mês e quanto ainda falta para o limite do ano.'}</p>
    <a class="btn primary" href="${caixa ? 'metas.html#caixa' : 'impostos.html#simples'}">Abrir${SETA}</a>`;
}

pronto.then(plano => {
  const nome = (plano.usuario?.nome || '').split(' ')[0];
  $('ola').textContent = nome ? `Olá, ${seguro(nome)}!` : 'Olá!';
  const selo = seloDoPlano(plano);
  $('plano-chip').textContent = selo.texto;
  $('plano-chip').dataset.tom = selo.tom;
  if (!plano.pago && plano.situacao !== 'demonstracao') $('plano-chip').insertAdjacentHTML('beforeend', ' · <a href="assinatura.html">ver o plano completo</a>');
  desenharFerramentas(plano.pago);
  desenharTrilha();
  desenharChegada();
});
