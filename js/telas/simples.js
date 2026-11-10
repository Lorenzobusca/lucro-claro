/* TELA: MEI e Simples Nacional (impostos.html, aba "MEI e Simples").
   Lê os campos, chama js/calculo/simples.js e escreve o resultado. */
import { $, ler, preencher, brl, pct, linhas, mostrarNumero } from '../ui/numero.js';
import { mostrarLeitura } from '../ui/apoio.js';
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
    const usado = pct(r.uso, 0);
    mostrarLeitura('s-leitura', r.situacao === 'dentro' ? {
      tom: 'ok',
      texto: `O MEI paga um valor fixo: quanto mais você vende, menos o imposto pesa. Você usou ${usado} do limite de ${brl(r.limite)} por ano.`,
      passo: { texto: 'Descobrir quanto sobra de cada venda', href: 'custeio.html#margem' },
    } : r.situacao === 'perto' ? {
      tom: 'warn',
      texto: `Você já usou ${usado} do limite anual do MEI. Se passar de ${brl(r.limite)}, o imposto muda. Vale simular o Simples Nacional aqui mesmo, trocando o regime no primeiro campo.`,
    } : {
      tom: 'bad',
      texto: `Com esse faturamento você passa do limite do MEI (${brl(r.limite)} por ano). Troque o regime no primeiro campo para ver quanto pagaria no Simples Nacional.`,
    });

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
  mostrarLeitura('s-leitura', r.acima ? {
    tom: 'bad',
    texto: 'Com mais de R$ 4,8 milhões por ano a empresa sai do Simples Nacional. A conta acima deixa de valer: converse com um contador sobre Lucro Presumido ou Lucro Real.',
  } : {
    tom: 'ok',
    texto: `De cada R$ 100 que você fatura, ${brl(r.efetiva)} vão para o imposto. Esse percentual precisa estar dentro do seu preço, junto com a taxa do cartão e as comissões.`,
    passo: { texto: 'Colocar esse imposto no preço', href: 'custeio.html#preco' },
  });

}

['s-tipo', 's-mes', 's-12', 's-sm'].forEach(id => $(id).addEventListener('input', atualizar));
aoMudarTaxas(() => { preencher('s-sm', taxa('salario_minimo')); atualizar(); });
