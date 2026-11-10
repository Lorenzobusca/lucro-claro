/* TELA: custeio por absorção × ABC (custeio.html, aba "Absorção × ABC"). */
import { $, ler, brl } from '../ui/numero.js';
import { aplicarExemplo, mostrarLeitura } from '../ui/apoio.js';
import { calcularCusteio } from '../calculo/custeio.js';

/* Cada produto é uma linha da tabela; os campos têm id "<letra>-<campo>" */
const PRODUTOS = [{ id: 'a', nome: 'Mesa padrão' }, { id: 'b', nome: 'Mesa sob medida' }];
const CAMPOS = { qtd: 'q', preco: 'p', direto: 'd', horas: 'h', setups: 's', inspecoes: 'i' };

/* No exemplo, a mesa sob medida sai por R$ 950: parece dar lucro na absorção e dá prejuízo no ABC */
const EXEMPLOS = {
  marcenaria: { nome: 'uma marcenaria com uma mesa de linha e uma sob medida', campos: { 'b-p': '950' } },
};

const valor = v => `<span class="${v < 0 ? 'negativo' : ''}">${brl(v)}</span>`;

function atualizar() {
  const produtos = PRODUTOS.map(p => Object.fromEntries(Object.entries(CAMPOS).map(([nome, sufixo]) => [nome, ler(`${p.id}-${sufixo}`)])));
  const r = calcularCusteio(produtos, { setup: ler('c-setup'), inspecao: ler('c-insp'), maquina: ler('c-maq') });

  $('c-out').innerHTML = '<thead><tr><th>Produto</th><th>Custo absorção</th><th>Lucro absorção</th><th>Custo ABC</th><th>Lucro ABC</th></tr></thead><tbody>' +
    r.itens.map((x, j) => `<tr><td>${PRODUTOS[j].nome}</td><td data-label="Custo absorção">${brl(x.absorcao)}</td><td data-label="Lucro absorção">${valor(x.lucroAbsorcao)}</td><td data-label="Custo ABC">${brl(x.abc)}</td><td data-label="Lucro ABC">${valor(x.lucroAbc)}</td></tr>`).join('') +
    `<tr><td><b>Total no mês</b></td><td></td><td data-label="Lucro absorção">${valor(r.totalAbsorcao)}</td><td></td><td data-label="Lucro ABC">${valor(r.totalAbc)}</td></tr></tbody>`;

  const pior = r.itens[r.maisSubestimado];
  $('c-insight').innerHTML = Math.abs(r.diferenca) < 0.5
    ? 'Os dois métodos chegam a custos parecidos com esses números.'
    : `O ABC mostra que a <b>${PRODUTOS[r.maisSubestimado].nome.toLowerCase()}</b> custa ${brl(r.diferenca)} a mais por unidade do que a absorção indica, porque usa mais preparações e inspeções. ${pior.lucroAbc < 0 ? 'Com esse preço, ela dá prejuízo.' : 'Vale revisar o preço dela.'} O lucro total do mês é o mesmo nos dois métodos: o que muda é qual produto realmente gera esse lucro.`;
  const nome = PRODUTOS[r.maisSubestimado].nome.toLowerCase();
  if (pior.lucroAbc < 0) {
    mostrarLeitura('c-leitura', {
      tom: 'bad',
      texto: `Na conta comum, a <b>${nome}</b> parece dar ${brl(pior.lucroAbsorcao)} de lucro por unidade. Cobrando dela o que ela realmente consome, dá prejuízo de ${brl(-pior.lucroAbc)}.`,
      passo: { texto: 'Recalcular o preço desse produto', href: '#preco' },
    });
  } else {
    const iguais = Math.abs(r.diferenca) < 0.5;
    mostrarLeitura('c-leitura', {
      tom: iguais ? 'ok' : 'warn',
      texto: iguais
        ? 'Os dois produtos consomem os custos indiretos na mesma proporção. Aqui a conta comum já basta.'
        : `A <b>${nome}</b> dá lucro, mas menos do que parece: ${brl(pior.lucroAbc)} por unidade, e não ${brl(pior.lucroAbsorcao)}.`,
      passo: { texto: 'Comparar a margem de cada produto', href: '#produtos' },
    });
  }
}

aplicarExemplo(EXEMPLOS, 'c-ex');
PRODUTOS.forEach(p => Object.values(CAMPOS).forEach(sufixo => $(`${p.id}-${sufixo}`).addEventListener('input', atualizar)));
['c-setup', 'c-insp', 'c-maq'].forEach(id => $(id).addEventListener('input', atualizar));
atualizar();
