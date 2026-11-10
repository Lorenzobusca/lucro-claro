/* TELA: margem por produto (custeio.html, aba "Margem por produto"). */
import { $, ler, brl, pct, mostrarNumero } from '../ui/numero.js';
import { aplicarExemplo, mostrarLeitura } from '../ui/apoio.js';
import { calcularProdutos } from '../calculo/produtos.js';

/* Cada produto é uma linha da tabela; os campos têm id "pr<número>-<campo>" */
const LINHAS = [1, 2, 3, 4];
const seguro = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const valor = v => `<span class="${v < 0 ? 'negativo' : ''}">${brl(v)}</span>`;

const EXEMPLOS = {
  padaria: {
    nome: 'uma padaria com três produtos',
    campos: {
      'pr1-nome': 'Pão francês (kg)', 'pr1-p': '18', 'pr1-cv': '11', 'pr1-dv': '5', 'pr1-q': '1500',
      'pr2-nome': 'Bolo de pote', 'pr2-p': '12', 'pr2-cv': '4', 'pr2-dv': '5', 'pr2-q': '400',
      'pr3-nome': 'Refrigerante (lata)', 'pr3-p': '6', 'pr3-cv': '4.5', 'pr3-dv': '5', 'pr3-q': '900',
      'pr4-nome': '', 'pr4-p': '', 'pr4-cv': '', 'pr4-dv': '', 'pr4-q': '',
      'pr-cf': '10000',
    },
  },
};

function atualizar() {
  const produtos = LINHAS
    .map(n => ({ nome: $(`pr${n}-nome`).value.trim(), preco: ler(`pr${n}-p`), custoVariavel: ler(`pr${n}-cv`), despesasVariaveis: ler(`pr${n}-dv`), quantidade: ler(`pr${n}-q`) }))
    .filter(p => p.nome && p.preco > 0);
  const r = calcularProdutos(produtos, ler('pr-cf'));

  mostrarNumero($('pr-big'), r.lucro, brl);
  $('pr-big').classList.toggle('negativo', r.lucro < 0);

  $('pr-out').innerHTML = !r.itens.length ? '' :
    '<thead><tr><th>Produto</th><th>Sobra por unidade</th><th>Margem</th><th>Parte das vendas</th><th>Deixa no mês</th><th>Parte do que sobra</th></tr></thead><tbody>' +
    r.itens.map(x => `<tr><td>${seguro(x.nome)}</td><td data-label="Sobra por unidade">${valor(x.margem)}</td><td data-label="Margem">${pct(x.margemPct, 1)}</td><td data-label="Parte das vendas">${pct(x.parteDoFaturamento, 0)}</td><td data-label="Deixa no mês">${valor(x.contribuicao)}</td><td data-label="Parte do que sobra">${pct(x.parteDaContribuicao, 0)}</td></tr>`).join('') +
    `<tr><td><b>Total</b></td><td></td><td></td><td data-label="Vendas do mês">${brl(r.faturamento)}</td><td data-label="Deixa no mês">${valor(r.contribuicao)}</td><td></td></tr></tbody>`;

  if (!r.itens.length) {
    mostrarLeitura('pr-leitura', { tom: 'warn', texto: 'Preencha o nome e o preço de pelo menos um produto.' });
  } else if (r.negativos.length) {
    const x = r.negativos[0];
    mostrarLeitura('pr-leitura', {
      tom: 'bad',
      texto: `<b>${seguro(x.nome)}</b> dá prejuízo a cada venda: custa ${brl(-x.margem)} a mais do que rende. Quanto mais vende, mais perde.`,
      passo: { texto: 'Recalcular o preço desse produto', href: '#preco' },
    });
  } else if (r.pior && r.melhor !== r.pior) {
    const fecha = r.lucro < 0 ? ' Hoje a soma do que os produtos deixam não paga os custos fixos do mês.' : '';
    mostrarLeitura('pr-leitura', {
      tom: r.lucro < 0 ? 'warn' : 'ok',
      texto: `De cada R$ 100 vendidos de <b>${seguro(r.melhor.nome)}</b>, sobram ${brl(r.melhor.margemPct)}. De <b>${seguro(r.pior.nome)}</b>, sobram ${brl(r.pior.margemPct)}. Vender mais do primeiro aumenta o lucro bem mais rápido do que vender mais do segundo.${fecha}`,
      passo: r.lucro < 0
        ? { texto: 'Ver quanto falta vender para pagar as contas', href: '#margem' }
        : { texto: `Revisar o preço de ${seguro(r.pior.nome)}`, href: '#preco' },
    });
  } else {
    mostrarLeitura('pr-leitura', {
      tom: r.lucro < 0 ? 'warn' : 'ok',
      texto: `Cada unidade vendida deixa ${brl(r.melhor.margem)} para pagar as contas fixas. Inclua mais produtos para comparar quais deixam mais.`,
      passo: { texto: 'Calcular o ponto de equilíbrio', href: '#margem' },
    });
  }
}

aplicarExemplo(EXEMPLOS, 'pr-ex');
LINHAS.forEach(n => ['nome', 'p', 'cv', 'dv', 'q'].forEach(c => $(`pr${n}-${c}`).addEventListener('input', atualizar)));
$('pr-cf').addEventListener('input', atualizar);
atualizar();
