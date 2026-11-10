/* TELA: investimento × inflação (planejamento.html, aba "Investimento × inflação"). */
import { $, ler, preencher, brl, pct, linhas, mostrarNumero } from '../ui/numero.js';
import { aoMudarTaxas, taxas, taxa, dataBR } from '../ui/taxas.js';
import { taxaDoInvestimento, calcularInvestimento, trAoAno } from '../calculo/investimento.js';

function atualizar() {
  const valor = ler('i-v'), meses = ler('i-m'), tipo = $('i-tipo').value, pctDoCdi = ler('i-pct');
  $('i-pct-wrap').hidden = !(tipo === 'cdb' || tipo === 'lci');

  const selic = taxa('selic'), cdi = taxa('cdi'), trDoMes = taxa('tr');
  const { taxa: rendimento, regra } = taxaDoInvestimento({ tipo, selic, cdi, trDoMes, pctDoCdi });
  const origem = {
    'selic': `Selic meta ${pct(selic)}`,
    'poupanca-fixa': `0,5% ao mês + TR (${pct(trAoAno(trDoMes))} ao ano)`,
    'poupanca-selic': '70% da Selic + TR',
    'cdi': `${pct(pctDoCdi, 0)} do CDI de ${pct(cdi)}`,
  }[regra];
  $('i-t').value = rendimento.toFixed(2);
  $('i-t-src').textContent = origem + (taxas().exemplo ? ' · valores de exemplo' : ` · Banco Central, ${dataBR(taxas().taxas.cdi?.data)}`);

  const r = calcularInvestimento({ valor, meses, taxa: rendimento, inflacao: ler('i-inf'), tipo });
  mostrarNumero($('i-big'), r.ganhoReal, pct);
  $('i-big').classList.toggle('negativo', r.ganhoReal < 0);
  $('i-pill').innerHTML = r.ganhoReal >= 0 ? '<span class="pill ok">Vence a inflação</span>' : '<span class="pill bad">Perde para a inflação</span>';
  $('i-kv').innerHTML = linhas([
    ['Valor bruto no fim', brl(r.bruto)],
    ['Imposto de renda' + (r.ir ? ` (${pct(r.ir, 1)})` : ''), brl(r.imposto)],
    ['Valor líquido', brl(r.liquido)],
    ['Valor líquido em dinheiro de hoje', brl(r.liquidoHoje)],
  ]);

  /* Quanto o mesmo dinheiro vale se ficar parado */
  $('i-v2').textContent = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  $('i-bar').style.width = Math.max(0, Math.min(100, 100 / r.fator)) + '%';
  $('i-kv2').innerHTML = linhas([
    [`Daqui a ${meses} meses, em poder de compra`, brl(r.paradoHoje)],
    ['Perda por deixar parado', brl(r.perdaParado)],
  ]);
}

['i-v', 'i-m', 'i-pct', 'i-inf', 'i-tipo'].forEach(id => $(id).addEventListener('input', atualizar));
aoMudarTaxas(() => { preencher('i-inf', taxa('ipca_focus_12m')); atualizar(); });
