/* TELA: IBS e CBS no preço (impostos.html, aba "IBS/CBS no preço"). */
import { $, ler, preencher, brl, pct, linhas, mostrarNumero } from '../ui/numero.js';
import { registrarTour } from '../ui/tour.js';
import { mostrarLeitura } from '../ui/apoio.js';
import { aoMudarTaxas, taxas } from '../ui/taxas.js';
import { calcularIva } from '../calculo/iva.js';

const doAno = () => taxas().reforma[$('v-ano').value];

/* Ao trocar o ano, a alíquota e a observação mudam junto */
function trocarAno() {
  const r = doAno();
  if (!r) return;
  preencher('v-aliq', r.cbs + r.ibs);
  $('v-note').textContent = (r.nota ? r.nota + ' ' : '') + 'Considera alíquota cheia nas compras. Simulação educativa.';
  atualizar();
}

function atualizar() {
  const ano = doAno() || { cbs: 1, ibs: 2 };
  const r = calcularIva({ venda: ler('v-venda'), compra: ler('v-compra'), aliquota: ler('v-aliq'), reducao: ler('v-red'), cbs: ano.cbs, ibs: ano.ibs });
  mostrarNumero($('v-big'), r.pagar, brl);
  $('v-kv').innerHTML = linhas([
    ['Alíquota do seu setor', pct(r.efetiva)],
    ['Imposto sobre as vendas', brl(r.debito)],
    ['Crédito das compras', `− ${brl(r.credito)}`],
    [`CBS (${pct(r.fracaoCbs * 100, 0)} do total)`, brl(r.cbs)],
    [`IBS (${pct((1 - r.fracaoCbs) * 100, 0)} do total)`, brl(r.ibs)],
    ['Preço final ao cliente', brl(r.precoFinal)],
  ].concat(r.saldo > 0 ? [['Crédito que sobra para o mês seguinte', brl(r.saldo)]] : []));
  mostrarLeitura('v-leitura', {
    tom: 'ok',
    texto: r.saldo > 0
      ? `O imposto das suas compras (${brl(r.credito)}) é maior que o das vendas (${brl(r.debito)}). Neste mês não há IBS nem CBS a pagar, e ${brl(r.saldo)} ficam de crédito para o mês seguinte.`
      : `O imposto sobre as vendas é de ${brl(r.debito)}, mas você desconta ${brl(r.credito)} que já vieram nas compras com nota. Quanto mais das suas compras tiver nota fiscal, menos sobra para pagar.`,
    passo: { texto: 'Rever o preço com esse imposto', href: 'custeio.html#preco' },
  });

}

['v-venda', 'v-compra', 'v-aliq', 'v-red'].forEach(id => $(id).addEventListener('input', atualizar));
$('v-ano').addEventListener('input', trocarAno);
aoMudarTaxas(trocarAno);

registrarTour('iva', { painel: 'p-iva', passos: [
  { alvo: 'v-ano', titulo: 'Ano da simulação', texto: 'A reforma entra aos poucos. Escolha o ano para ver a alíquota daquela fase.' },
  { alvo: 'v-venda', titulo: 'Vendas sem imposto', texto: 'O valor das suas vendas antes de somar o imposto.' },
  { alvo: 'v-compra', titulo: 'Compras com nota', texto: 'O que você comprou com nota fiscal. O imposto que veio nessas notas vira crédito e é descontado do que você deve.' },
  { alvo: 'v-red', titulo: 'Seu setor', texto: 'Alguns setores têm alíquota reduzida. Escolha o que mais se parece com a sua atividade.' },
  { alvo: 'v-big', titulo: 'Como ler o resultado', texto: 'O número grande é o que sobra para pagar depois de descontar o crédito das compras.' },
]});
