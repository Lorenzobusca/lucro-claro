/* SITE: calculadoras grátis do topo (quanto posso tirar · limite do MEI), preço, WhatsApp e links para o app.
   As contas ficam em compartilhado/js/calculo/ (as mesmas do app). O resultado vai para o app pelo
   endereço do link "Guardar esta conta", para a pessoa não digitar tudo de novo depois de criar a conta. */
import { numeroDe, brl, pct } from '../../compartilhado/js/ui/numero.js';
import { aoMudarTaxas, taxa } from '../../compartilhado/js/ui/taxas.js';
import { calcularRetirada } from '../../compartilhado/js/calculo/retirada.js';
import { calcularLimite } from '../../compartilhado/js/calculo/limite.js';
import { VALORES_LEGAIS } from '../../compartilhado/config/valores-legais.js';
import { PLANOS, WHATSAPP } from '../../compartilhado/config/planos.js';
import { endereco, ajustarLinks } from '../../compartilhado/js/ui/enderecos.js';

const $ = id => document.getElementById(id);
const CHAVE = 'lc-site-calc';
const hoje = new Date(), ano = hoje.getFullYear(), mesAtual = hoje.getMonth() + 1;
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const valor = id => { const v = numeroDe($(id).value); return isFinite(v) && v >= 0 ? v : 0; };
const reais = v => brl(v).replace(/ /g, ' ');
const inteiro = v => reais(Math.round(v)).replace(/,00$/, '');

let qual = 'retirada';
let salarioMinimo = VALORES_LEGAIS.salarioMinimoReserva;

/* "Quando abriu o MEI": antes deste ano ou um dos meses até agora */
MESES.slice(0, mesAtual).forEach((m, i) => $('l-abertura').insertAdjacentHTML('beforeend', `<option value="${i + 1}">Em ${m} de ${ano}</option>`));

/* Volta com os números que a pessoa digitou da última vez (ficam só neste aparelho) */
try {
  const salvo = JSON.parse(localStorage.getItem(CHAVE));
  if (salvo?.campos) Object.entries(salvo.campos).forEach(([id, v]) => { if ($(id)) $(id).value = v; });
  if (salvo?.qual) qual = salvo.qual;
} catch (e) {}

function guardarAqui() {
  const ids = ['r-vendas', 'r-gastos', 'r-atividade', 'r-reserva', 'l-faturado', 'l-abertura'];
  try { localStorage.setItem(CHAVE, JSON.stringify({ qual, campos: Object.fromEntries(ids.map(id => [id, $(id).value])) })); } catch (e) {}
}

/* ---------- Conta: quanto posso tirar ---------- */
function contaRetirada() {
  const vendas = valor('r-vendas'), gastos = valor('r-gastos'), atividade = $('r-atividade').value, reservaPct = Math.min(100, valor('r-reserva'));
  const r = calcularRetirada({ vendas, gastos, atividade, salarioMinimo, reservaPct });

  $('res-rotulo').textContent = 'Você pode tirar pra você';
  $('res-numero').textContent = reais(r.podeTirar);
  $('res-numero').classList.toggle('zero', r.podeTirar <= 0);
  $('res-barra').hidden = true;

  $('res-leitura').textContent = r.sobra < 0
    ? `Neste mês o negócio gastou mais do que vendeu: faltam ${reais(r.falta)}. Tirar dinheiro agora seria usar o da mercadoria do mês que vem.`
    : r.sobra === 0 ? 'Neste mês o negócio empatou: não sobrou nada para tirar sem mexer no dinheiro da mercadoria.'
    : `E ainda ficam ${reais(r.reserva)} guardados no negócio para o mês fraco. Tirar mais do que isso é usar o dinheiro de repor mercadoria.`;
  $('res-detalhe').innerHTML = [
    ['Vendas', reais(vendas)],
    ['Gastos do negócio', '− ' + reais(gastos)],
    [`DAS do MEI (${ano})`, '− ' + reais(r.das)],
    ['Sobra do mês', reais(r.sobra)],
    [`Guardar no negócio (${pct(reservaPct, 0)})`, '− ' + reais(r.reserva)],
  ].map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('');

  return new URLSearchParams({ calc: 'retirada', vendas, gastos, atividade, reserva: reservaPct, sm: salarioMinimo });
}

/* ---------- Conta: termômetro do limite ---------- */
function contaLimite() {
  const faturado = valor('l-faturado'), mesAbertura = Number($('l-abertura').value) || 0;
  const r = calcularLimite({ faturado, mesAtual, mesAbertura, ano });
  const usoLimitado = Math.min(100, r.uso);

  $('res-rotulo').textContent = `Você já usou do limite de ${ano}`;
  $('res-numero').textContent = pct(r.uso, 0);
  $('res-numero').classList.remove('zero');
  const barra = $('res-barra');
  barra.hidden = false;
  barra.querySelector('span').style.width = usoLimitado + '%';
  barra.querySelector('i').style.left = Math.min(100, mesAtual / 12 * 100) + '%';
  barra.dataset.tom = r.situacao === 'dentro' ? 'ok' : r.situacao === 'perto' ? 'aviso' : 'erro';

  const proximo = r.limiteProximoAno > r.limiteAnual ? ` Em ${ano + 1}, o limite sobe para ${inteiro(r.limiteProximoAno)}.` : '';
  const leituras = {
    dentro: `Tranquilo. Nesse ritmo, você fecha o ano com uns ${inteiro(r.projecao)}, abaixo do limite de ${inteiro(r.limite)}.`,
    perto: `Atenção: você já está perto do limite de ${inteiro(r.limite)}.${r.mesesRestantes > 0 ? ` Para não passar, dá para faturar até ${inteiro(Math.max(0, r.sobraNoAno))} até dezembro.` : ''}`,
    acima: 'Você passou do limite em até 20%. Paga o DAS normal até dezembro, depois uma guia com a diferença, e no ano que vem vira microempresa. Converse com um contador.',
    'muito-acima': 'Você passou mais de 20% do limite. A mudança para microempresa vale desde janeiro deste ano, com imposto a acertar. Procure um contador logo.',
  };
  let leitura = leituras[r.situacao];
  if (r.situacao === 'dentro' && r.situacaoProjetada !== 'dentro') {
    leitura = `Hoje está tranquilo, mas nesse ritmo você fecha o ano com uns ${inteiro(r.projecao)}, perto ou acima do limite de ${inteiro(r.limite)}. Dá para faturar até ${inteiro(Math.max(0, r.sobraNoAno))} até dezembro.`;
  }
  $('res-leitura').textContent = leitura + proximo;
  $('res-detalhe').innerHTML = [
    [r.mesesAtivos < 12 ? `Seu limite em ${ano} (${r.mesesAtivos} meses)` : `Limite de ${ano}`, inteiro(r.limite)],
    ['Faturado até agora', reais(faturado)],
    ['Ainda cabe no ano', inteiro(Math.max(0, r.sobraNoAno))],
  ].map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('');

  return new URLSearchParams({ calc: 'limite', faturado, abertura: mesAbertura });
}

function atualizar() {
  const params = qual === 'retirada' ? contaRetirada() : contaLimite();
  $('levar').href = endereco('app', 'entrar.html?' + params.toString());
  guardarAqui();
}

function escolher(novo) {
  qual = novo;
  document.querySelectorAll('.s-calc-aba').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.calc === qual)));
  $('calc-retirada').hidden = qual !== 'retirada';
  $('calc-limite').hidden = qual !== 'limite';
  atualizar();
}

document.querySelectorAll('.s-calc-aba').forEach(b => b.addEventListener('click', () => escolher(b.dataset.calc)));
document.querySelectorAll('.s-calc-form').forEach(f => {
  f.addEventListener('input', atualizar);
  f.addEventListener('submit', e => e.preventDefault());
});
$('fonte-legal').textContent = `Limite e DAS do MEI: LC 123/2006 e LC 238/2026, conferidos em ${VALORES_LEGAIS.conferido_em.split('-').reverse().join('/')}.`;

/* O salário mínimo chega do Banco Central; até lá vale o de reserva */
aoMudarTaxas(() => { salarioMinimo = taxa('salario_minimo') || VALORES_LEGAIS.salarioMinimoReserva; atualizar(); });
escolher(qual);

/* ---------- Preço, WhatsApp, links ---------- */
if (PLANOS.precoMensal != null) {
  $('preco-completo').innerHTML = `${reais(PLANOS.precoMensal)} <small>por mês</small>` +
    (PLANOS.precoAnual != null ? `<span class="s-anual">ou ${reais(PLANOS.precoAnual)} por ano no Pix</span>` : '');
}
if (WHATSAPP) {
  const w = $('whatsapp');
  w.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Vim pelo site do Lastrion e tenho uma dúvida.')}`;
  w.hidden = false;
}
document.querySelectorAll('[data-comecar]').forEach(a => a.addEventListener('click', () => {
  /* "Começar grátis" também leva a conta que estiver na calculadora */
  a.href = $('levar').href;
}));
$('ano').textContent = ano;
ajustarLinks();
if (new URLSearchParams(location.search).get('conta') === 'excluida') {
  document.querySelector('.s-hero-texto').insertAdjacentHTML('afterbegin', '<p class="aviso" role="status">Sua conta foi excluída, junto com tudo o que estava guardado nela.</p>');
}
