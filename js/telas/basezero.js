/* TELA: orçamento base zero (metas.html, aba "Base zero"). */
import { $, ler, brl, pct, linhas, mostrarNumero } from '../ui/numero.js';
import { registrarTour } from '../ui/tour.js';
import { aplicarExemplo, mostrarLeitura } from '../ui/apoio.js';
import { calcularBaseZero } from '../calculo/basezero.js';

/* Cada gasto é uma linha da tabela; os campos têm id "bz<número>-<campo>" */
const LINHAS = [1, 2, 3, 4, 5, 6];

const EXEMPLOS = {
  padaria: {
    nome: 'a Padaria Pão da Esquina listando as contas fixas do mês',
    campos: {
      'bz1-nome': 'Retirada da dona (pró-labore)', 'bz1-v': '2000', 'bz1-d': 'manter', 'bz1-n': '',
      'bz2-nome': 'Aluguel', 'bz2-v': '3000', 'bz2-d': 'manter', 'bz2-n': '',
      'bz3-nome': 'Ajudante (salário e encargos)', 'bz3-v': '2600', 'bz3-d': 'manter', 'bz3-n': '',
      'bz4-nome': 'Energia e gás', 'bz4-v': '1200', 'bz4-d': 'reduzir', 'bz4-n': '1000',
      'bz5-nome': 'Contador, internet e sistema', 'bz5-v': '700', 'bz5-d': 'manter', 'bz5-n': '',
      'bz6-nome': 'Assinaturas, anúncios e tarifas', 'bz6-v': '500', 'bz6-d': 'reduzir', 'bz6-n': '200',
    },
  },
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

registrarTour('basezero', { painel: 'p-zero', etapa: 2, passos: [
  { alvo: 'bz1-nome', titulo: 'Um gasto por linha', termo: 'Custo fixo', texto: 'Tudo o que você paga todo mês, venda ou não: aluguel, salários, luz, internet, contador, assinaturas e a sua própria retirada.', exemplo: 'aluguel.' },
  { alvo: 'bz1-v', titulo: 'Valor por mês', texto: 'Quanto sai hoje. Pegue no extrato do banco dos últimos três meses: o que se repete é custo fixo.', exemplo: 'R$ 3.000.' },
  { alvo: 'bz1-d', titulo: 'Decisão', termo: 'Orçamento base zero', texto: 'Pergunte de cada item: se eu estivesse abrindo a loja hoje, contrataria isto de novo, por este valor? Manter, reduzir ou cortar.' },
  { alvo: 'bz1-n', titulo: 'Novo valor', texto: 'Só para "reduzir": quanto você acha que consegue pagar depois de negociar ou trocar de plano.', exemplo: 'energia de R$ 1.200 para R$ 1.000.' },
  { alvo: 'bz-big', titulo: 'Como ler o resultado', texto: 'O número grande é quanto sobra no ano com as suas decisões. A linha "Gasto por mês hoje" é o total dos seus custos fixos: anote, ele é usado nas outras ferramentas.' },
]});
