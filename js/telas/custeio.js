/* TELA: custeio por absorção × ABC (custeio.html, aba "Absorção × ABC"). */
import { $, ler, brl } from '../ui/numero.js';
import { calcularCusteio } from '../calculo/custeio.js';

/* Cada produto é uma linha da tabela; os campos têm id "<letra>-<campo>" */
const PRODUTOS = [{ id: 'a', nome: 'Mesa padrão' }, { id: 'b', nome: 'Mesa sob medida' }];
const CAMPOS = { qtd: 'q', preco: 'p', direto: 'd', horas: 'h', setups: 's', inspecoes: 'i' };

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
}

PRODUTOS.forEach(p => Object.values(CAMPOS).forEach(sufixo => $(`${p.id}-${sufixo}`).addEventListener('input', atualizar)));
['c-setup', 'c-insp', 'c-maq'].forEach(id => $(id).addEventListener('input', atualizar));
atualizar();
