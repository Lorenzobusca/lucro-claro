/* TELA: simulador de carteira (planejamento.html, aba "Simulador de carteira"). */
import { $, ler, preencher, brl, pct, linhas, mostrarNumero } from '../ui/numero.js';
import { aoMudarTaxas, taxas, taxa } from '../ui/taxas.js';
import { desenharLinhas } from '../ui/grafico.js';
import { rendimentoPoupanca } from '../calculo/investimento.js';
import { ATIVOS, CARTEIRAS, HIPOTESES, calcularCarteira } from '../calculo/carteira.js';

const TEXTO_IR = { isento: 'Isento', regressivo: 'Tabela regressiva (15% após 2 anos)', acoes: '15% sobre o lucro na venda' };
const presets = [...document.querySelectorAll('.preset')];
let serie = [];

/* Preenche a coluna "Rende ao ano". Taxas oficiais ficam travadas; hipóteses podem ser editadas
   (e, depois que a pessoa mexe, não são mais sobrescritas). */
function preencherTaxas() {
  const inflacao = ler('w-inf'), cdi = taxa('cdi'), selic = taxa('selic'), ex = taxas().exemplo ? ' (exemplo)' : '';
  const linha = (k, valor, origem, travada) => {
    const campo = $('w-r-' + k);
    if (travada || !campo.dataset.mexeu) campo.value = valor.toFixed(2);
    campo.readOnly = !!travada;
    $('w-o-' + k).textContent = origem;
  };
  linha('poup', rendimentoPoupanca(selic, taxa('tr')), 'Regra oficial da poupança' + ex, true);
  linha('selic', selic, 'Selic de hoje' + ex, true);
  linha('cdb', cdi, 'CDI de hoje' + ex, true);
  linha('lci', cdi * .9, '90% do CDI de hoje' + ex, true);
  linha('ipca', (1 + inflacao / 100) * (1 + HIPOTESES.ipcaReal / 100) * 100 - 100, 'Inflação + 7% ao ano (exemplo, pode editar)');
  linha('fii', HIPOTESES.fii, 'Hipótese de média histórica (pode editar)');
  linha('acoes', HIPOTESES.acoes, 'Hipótese de média histórica (pode editar)');
  ATIVOS.forEach(a => $('w-i-' + a.k).textContent = TEXTO_IR[a.ir]);
  atualizar();
}

function usarPreset(nome) {
  ATIVOS.forEach(a => $('w-p-' + a.k).value = CARTEIRAS[nome][a.k]);
  presets.forEach(b => b.setAttribute('aria-pressed', b.dataset.preset === nome));
  atualizar();
}

function atualizar() {
  const r = calcularCarteira({
    inicial: ler('w-ini'), aporte: ler('w-apt'), anos: ler('w-anos'), inflacao: ler('w-inf'),
    percentuais: ATIVOS.map(a => ler('w-p-' + a.k)),
    taxas: ATIVOS.map(a => ler('w-r-' + a.k)),
  });
  const c = r.carteira, p = r.poupanca;

  $('w-sum').textContent = pct(r.soma, 0);
  $('w-sum').classList.toggle('bad', !r.somaOk);
  $('w-label').textContent = `Sua carteira daqui a ${r.anos} ${r.anos === 1 ? 'ano' : 'anos'}`;
  mostrarNumero($('w-big'), c.liquido, brl);
  $('w-real').textContent = `Equivale a ${brl(c.liquido / r.fator)} em dinheiro de hoje`;
  $('w-pill').innerHTML = !r.somaOk ? `<span class="pill warn">A carteira soma ${pct(r.soma, 0)}; ajuste para 100%</span>`
    : c.liquido > p.liquido ? `<span class="pill ok">${brl(c.liquido - p.liquido)} a mais que a poupança</span>`
    : '<span class="pill bad">Rende menos que a poupança</span>';
  $('w-kv').innerHTML = linhas([
    ['Dinheiro que você guardou', brl(c.investido)],
    ['Rendimento bruto', brl(c.bruto - c.investido)],
    ['Imposto de renda estimado', brl(c.bruto - c.liquido)],
    ['Rendimento médio da carteira', pct(r.taxaMedia) + ' ao ano'],
    ['Se deixasse tudo na poupança', brl(p.liquido)],
  ]);

  serie = r.serie;
  $('w-tab').innerHTML = '<thead><tr><th>Ano</th><th>Guardado</th><th>Sua carteira</th><th>Poupança</th><th>Carteira em dinheiro de hoje</th></tr></thead><tbody>' +
    serie.map(x => `<tr><td>${x.ano}</td><td>${brl(x.inv)}</td><td>${brl(x.cart)}</td><td>${brl(x.poup)}</td><td>${brl(x.cartHoje)}</td></tr>`).join('') + '</tbody>';
  desenhar();
}

const desenhar = () => desenharLinhas($('w-chart'), serie);

['w-ini', 'w-apt', 'w-anos'].forEach(id => $(id).addEventListener('input', atualizar));
$('w-inf').addEventListener('input', preencherTaxas);
ATIVOS.forEach(a => {
  $('w-p-' + a.k).addEventListener('input', () => { presets.forEach(b => b.setAttribute('aria-pressed', 'false')); atualizar(); });
  $('w-r-' + a.k).addEventListener('input', e => { e.target.dataset.mexeu = '1'; atualizar(); });
});
presets.forEach(b => b.addEventListener('click', () => usarPreset(b.dataset.preset)));

/* O gráfico depende da largura: redesenha ao redimensionar e quando a aba volta a aparecer */
let espera;
addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(desenhar, 120); });
$('p-carteira').addEventListener('aba-aberta', () => requestAnimationFrame(desenhar));

usarPreset('moderada');
aoMudarTaxas(() => { preencher('w-inf', taxa('ipca_focus_12m')); preencherTaxas(); });
