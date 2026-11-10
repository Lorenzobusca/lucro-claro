/* TELA: IBS e CBS no preço (impostos.html, aba "IBS/CBS no preço"). */
import { $, ler, preencher, brl, pct, linhas, mostrarNumero } from '../ui/numero.js';
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
}

['v-venda', 'v-compra', 'v-aliq', 'v-red'].forEach(id => $(id).addEventListener('input', atualizar));
$('v-ano').addEventListener('input', trocarAno);
aoMudarTaxas(trocarAno);
