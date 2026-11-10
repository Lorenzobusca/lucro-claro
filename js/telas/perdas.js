/* TELA: perdas e desperdício (custeio.html, aba "Perdas"). */
import { $, ler, brl, pct, linhas, mostrarNumero } from '../ui/numero.js';
import { aplicarExemplo, mostrarLeitura } from '../ui/apoio.js';
import { calcularPerdas } from '../calculo/perdas.js';

const EXEMPLOS = {
  floricultura: {
    nome: 'uma floricultura que perde flores que murcham antes de vender',
    campos: { 'pe-perda': '800', 'pe-margem': '40', 'pe-fat': '20000', 'pe-red': '50' },
  },
};

function atualizar() {
  const perda = ler('pe-perda'), reducao = ler('pe-red');
  const r = calcularPerdas({ perdaMensal: perda, margemPct: ler('pe-margem'), faturamento: ler('pe-fat'), reducao });

  mostrarNumero($('pe-big'), r.vendasParaCompensar, brl);
  $('pe-kv').innerHTML = linhas([
    ['Perda no mês', brl(perda)],
    ['Perda no ano', brl(r.perdaAnual)],
    ['Perda sobre as vendas', pct(r.parteDoFaturamento, 1)],
    [`Evitando ${pct(reducao, 0)} da perda, sobra por mês`, brl(r.recuperadoMes)],
    ['No ano', brl(r.recuperadoAno)],
  ]);

  if (!(perda > 0)) {
    mostrarLeitura('pe-leitura', { tom: 'ok', texto: 'Sem perda informada. Vale anotar por um mês tudo o que estraga, vence ou some: é comum a soma ser maior do que parece.' });
  } else if (!isFinite(r.vendasParaCompensar)) {
    mostrarLeitura('pe-leitura', { tom: 'warn', texto: 'Informe a margem de contribuição para ver quanto é preciso vender a mais para repor a perda.', passo: { texto: 'Descobrir minha margem', href: '#margem' } });
  } else {
    mostrarLeitura('pe-leitura', {
      tom: 'warn',
      texto: `Para repor os ${brl(perda)} que se perdem por mês, é preciso vender ${brl(r.vendasParaCompensar)} a mais. Evitar ${pct(reducao, 0)} dessa perda coloca ${brl(r.recuperadoMes)} por mês direto no lucro, ${brl(r.recuperadoAno)} no ano, sem vender nada a mais.`,
      passo: { texto: 'Criar uma meta de redução de perdas', href: 'metas.html#metas' },
    });
  }
}

aplicarExemplo(EXEMPLOS, 'pe-ex');
['pe-perda', 'pe-margem', 'pe-fat', 'pe-red'].forEach(id => $(id).addEventListener('input', atualizar));
atualizar();
