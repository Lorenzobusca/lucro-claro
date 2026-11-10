/* TELA: MEI e Simples Nacional (impostos.html, aba "MEI e Simples").
   Lê os campos, chama js/calculo/simples.js e escreve o resultado. */
import { $, ler, preencher, brl, pct, linhas, mostrarNumero } from '../ui/numero.js';
import { aoMudarTaxas, taxa } from '../ui/taxas.js';
import { calcularMei, calcularSimples } from '../calculo/simples.js';

const SELO_MEI = {
  'dentro': '<span class="pill ok">Dentro do limite</span>',
  'perto': '<span class="pill warn">Perto do limite anual</span>',
  'acima': '<span class="pill bad">Acima do limite: paga a diferença e vira ME</span>',
  'muito-acima': '<span class="pill bad">Mais de 20% acima: desenquadramento retroativo</span>',
};

function atualizar() {
  const tipo = $('s-tipo').value, receitaMes = ler('s-mes'), receita12 = ler('s-12');
  const mei = tipo.startsWith('mei');
  $('s-sm-wrap').hidden = !mei;

  if (mei) {
    const r = calcularMei({ atividade: tipo, salarioMinimo: ler('s-sm'), receitaMes, receita12 });
    $('s-label').textContent = 'DAS fixo do MEI';
    mostrarNumero($('s-big'), r.das, brl);
    $('s-pill').innerHTML = SELO_MEI[r.situacao];
    $('s-kv').innerHTML = linhas([
      ['INSS (5% do salário mínimo)', brl(r.inss)],
      ['ICMS / ISS', brl(r.extra)],
      ['Limite anual do MEI', brl(r.limite)],
      ['Você já usou', pct(r.uso, 1)],
      ['Peso do DAS sobre o mês', pct(r.peso)],
    ]);
    return;
  }

  const r = calcularSimples({ anexo: tipo, receitaMes, receita12 });
  $('s-label').textContent = 'Imposto do mês (DAS)';
  mostrarNumero($('s-big'), r.das, brl);
  $('s-pill').innerHTML = r.acima
    ? '<span class="pill bad">Acima de R$ 4,8 milhões: fora do Simples</span>'
    : `<span class="pill ok">Faixa ${r.faixa} de 6</span>`;
  $('s-kv').innerHTML = linhas([
    ['Alíquota nominal da faixa', pct(r.nominal)],
    ['Parcela a deduzir', brl(r.deducao)],
    ['Sua alíquota efetiva', pct(r.efetiva)],
    ['Estimativa no ano', brl(r.noAno)],
  ]);
}

['s-tipo', 's-mes', 's-12', 's-sm'].forEach(id => $(id).addEventListener('input', atualizar));
aoMudarTaxas(() => { preencher('s-sm', taxa('salario_minimo')); atualizar(); });
