/* TELA: formação de preço por markup (custeio.html, aba "Formação de preço"). */
import { $, ler, brl, pct, linhas, mostrarNumero } from '../ui/numero.js';
import { aplicarExemplo, mostrarLeitura } from '../ui/apoio.js';
import { calcularPreco } from '../calculo/preco.js';

const EXEMPLOS = {
  floricultura: {
    nome: 'uma floricultura formando o preço de um buquê',
    campos: { 'pc-custo': '30', 'pc-dv': '12', 'pc-cf': '25', 'pc-lucro': '13', 'pc-conc': '45' },
  },
};

const vezes = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ×';

function atualizar() {
  const custo = ler('pc-custo'), lucro = ler('pc-lucro'), concorrente = ler('pc-conc');
  const r = calcularPreco({ custo, despesasVariaveis: ler('pc-dv'), custosFixos: ler('pc-cf'), lucro, precoConcorrente: concorrente });

  mostrarNumero($('pc-big'), r.preco, brl);
  $('pc-pill').innerHTML = !r.possivel ? '<span class="pill bad">Não fecha: os percentuais passam de 100%</span>'
    : `<span class="pill ok">Markup de ${vezes(r.markup)}</span>`;
  $('pc-kv').innerHTML = linhas([
    ['Custo do produto', brl(custo)],
    ['Despesas da venda (imposto, cartão, comissão)', brl(r.emDespesas)],
    ['Parte dos custos fixos', brl(r.emFixos)],
    ['Lucro', brl(r.emLucro)],
  ].concat(r.temConcorrente ? [['Sobra vendendo pelo preço do concorrente', `<span class="${r.sobraNoConcorrente < 0 ? 'negativo' : ''}">${brl(r.sobraNoConcorrente)}</span>`]] : []));

  if (!(custo > 0)) {
    mostrarLeitura('pc-leitura', { tom: 'warn', texto: 'Informe quanto custa comprar ou produzir uma unidade.' });
  } else if (!r.possivel) {
    mostrarLeitura('pc-leitura', {
      tom: 'bad',
      texto: `Despesas, custos fixos e lucro somam ${pct(r.soma, 0)} do preço. Com 100% ou mais não sobra nada para pagar o produto: nenhum preço fecha essa conta. Reduza algum dos percentuais.`,
      passo: { texto: 'Rever cada gasto do zero', href: 'metas.html#zero' },
    });
  } else if (r.temConcorrente && r.sobraNoConcorrente < 0) {
    mostrarLeitura('pc-leitura', {
      tom: 'bad',
      texto: `Copiando o preço do concorrente (${brl(concorrente)}), você perde ${brl(-r.sobraNoConcorrente)} em cada venda. Para pagar tudo e ficar com ${pct(lucro, 0)} de lucro, o preço precisa ser ${brl(r.preco)}.`,
      passo: { texto: 'Ver quantas vendas pagam as contas com esse preço', href: '#margem' },
    });
  } else if (r.temConcorrente && r.sobraNoConcorrentePct < lucro) {
    mostrarLeitura('pc-leitura', {
      tom: 'warn',
      texto: `Pelo preço do concorrente (${brl(concorrente)}) sobram ${brl(r.sobraNoConcorrente)} por venda, ${pct(r.sobraNoConcorrentePct, 1)} do preço. É menos do que os ${pct(lucro, 0)} que você quer. Para chegar lá, o preço é ${brl(r.preco)}, ou os custos precisam cair.`,
      passo: { texto: 'Procurar gastos para cortar', href: 'metas.html#zero' },
    });
  } else if (r.temConcorrente) {
    mostrarLeitura('pc-leitura', {
      tom: 'ok',
      texto: `Pelo preço do concorrente (${brl(concorrente)}) sobram ${brl(r.sobraNoConcorrente)} por venda, mais do que o lucro que você pediu. Você pode cobrar entre ${brl(r.preco)} e ${brl(concorrente)} e ainda sair no lucro.`,
      passo: { texto: 'Ver quantas vendas pagam as contas', href: '#margem' },
    });
  } else {
    mostrarLeitura('pc-leitura', {
      tom: 'ok',
      texto: `Multiplique o custo por ${vezes(r.markup).replace(' ×', '')} para chegar ao preço. Assim cada venda paga o produto, as despesas, a parte das contas fixas e ainda deixa ${brl(r.emLucro)} de lucro.`,
      passo: { texto: 'Ver quantas vendas pagam as contas', href: '#margem' },
    });
  }
}

aplicarExemplo(EXEMPLOS, 'pc-ex');
['pc-custo', 'pc-dv', 'pc-cf', 'pc-lucro', 'pc-conc'].forEach(id => $(id).addEventListener('input', atualizar));
atualizar();
