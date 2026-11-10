/* TELA: orçamento base zero (metas.html, aba "Base zero"). */
import { $, ler, brl, pct, linhas, mostrarNumero } from '../ui/numero.js';
import { aplicarExemplo, mostrarLeitura } from '../ui/apoio.js';
import { calcularBaseZero } from '../calculo/basezero.js';

/* Cada gasto é uma linha da tabela; os campos têm id "bz<número>-<campo>" */
const LINHAS = [1, 2, 3, 4, 5, 6];

const EXEMPLOS = {
  roupas: {
    nome: 'uma loja de roupas revendo os gastos fixos do mês',
    campos: {
      'bz1-nome': 'Aluguel', 'bz1-v': '3000', 'bz1-d': 'manter', 'bz1-n': '',
      'bz2-nome': 'Sistema de vendas', 'bz2-v': '250', 'bz2-d': 'manter', 'bz2-n': '',
      'bz3-nome': 'Anúncios', 'bz3-v': '900', 'bz3-d': 'reduzir', 'bz3-n': '500',
      'bz4-nome': 'Assinaturas e aplicativos', 'bz4-v': '320', 'bz4-d': 'cortar', 'bz4-n': '',
      'bz5-nome': 'Embalagens', 'bz5-v': '600', 'bz5-d': 'reduzir', 'bz5-n': '450',
      'bz6-nome': 'Tarifas do banco', 'bz6-v': '180', 'bz6-d': 'cortar', 'bz6-n': '',
    },
  },
};

function atualizar() {
  const gastos = LINHAS.map(n => {
    const decisao = $(`bz${n}-d`).value, novo = $(`bz${n}-n`);
    novo.disabled = decisao !== 'reduzir';          /* o novo valor só vale para "reduzir" */
    return { nome: $(`bz${n}-nome`).value.trim(), valor: ler(`bz${n}-v`), decisao, novoValor: ler(`bz${n}-n`) };
  }).filter(g => g.valor > 0);
  const r = calcularBaseZero(gastos);

  mostrarNumero($('bz-big'), r.economiaAno, brl);
  $('bz-kv').innerHTML = linhas([
    ['Gasto por mês hoje', brl(r.antes)],
    ['Gasto por mês depois da revisão', brl(r.depois)],
    ['Economia por mês', brl(r.economiaMes)],
    ['Redução', pct(r.economiaPct, 1)],
  ]);

  if (!gastos.length) {
    mostrarLeitura('bz-leitura', { tom: 'warn', texto: 'Liste os gastos fixos do mês e o valor de cada um.' });
  } else if (r.economiaMes > 0) {
    mostrarLeitura('bz-leitura', {
      tom: 'ok',
      texto: `Revendo ${r.revisados} ${r.revisados === 1 ? 'gasto' : 'gastos'}, sobram ${brl(r.economiaMes)} por mês, ${brl(r.economiaAno)} no ano. Esse dinheiro vai direto para o lucro, sem precisar vender mais.`,
      passo: { texto: 'Ver o efeito no fluxo de caixa', href: '#caixa' },
    });
  } else {
    mostrarLeitura('bz-leitura', {
      tom: 'warn',
      texto: 'Todos os gastos estão como "manter". Pergunte de cada um: se eu estivesse abrindo a empresa hoje, contrataria isto de novo, por este valor?',
    });
  }
}

aplicarExemplo(EXEMPLOS, 'bz-ex');
LINHAS.forEach(n => ['nome', 'v', 'd', 'n'].forEach(c => $(`bz${n}-${c}`).addEventListener('input', atualizar)));
atualizar();
