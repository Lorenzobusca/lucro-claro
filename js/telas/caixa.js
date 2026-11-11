/* TELA: fluxo de caixa (metas.html, aba "Fluxo de caixa"). */
import { $, ler, brl, mostrarNumero } from '../ui/numero.js';
import { registrarTour } from '../ui/tour.js';
import { aplicarExemplo, mostrarLeitura } from '../ui/apoio.js';
import { calcularCaixa } from '../calculo/caixa.js';

/* Cada mês é uma linha da tabela; os campos têm id "cx<número>-e" (entradas) e "cx<número>-s" (saídas) */
const MESES = [1, 2, 3, 4, 5, 6];
const valor = v => `<span class="${v < 0 ? 'negativo' : ''}">${brl(v)}</span>`;

const EXEMPLOS = {
  padaria: {
    nome: 'a Padaria Pão da Esquina, cujo forno quebra no segundo mês',
    campos: {
      'cx-saldo': '1000', 'cx-retirada': '2000',
      'cx1-e': '37200', 'cx1-s': '32010', 'cx2-e': '38100', 'cx2-s': '43555', 'cx3-e': '38100', 'cx3-s': '31555',
      'cx4-e': '38100', 'cx4-s': '31555', 'cx5-e': '38100', 'cx5-s': '31555', 'cx6-e': '38100', 'cx6-s': '31555',
    },
  },
};

function atualizar() {
  const r = calcularCaixa({
    saldoInicial: ler('cx-saldo'), retirada: ler('cx-retirada'),
    meses: MESES.map(n => ({ entradas: ler(`cx${n}-e`), saidas: ler(`cx${n}-s`) })),
  });

  mostrarNumero($('cx-big'), r.saldoFinal, brl);
  $('cx-big').classList.toggle('negativo', r.saldoFinal < 0);
  $('cx-pill').innerHTML = r.primeiroNegativo
    ? `<span class="pill bad">Falta dinheiro em ${r.mesesNegativos} ${r.mesesNegativos === 1 ? 'mês' : 'meses'}</span>`
    : '<span class="pill ok">Caixa positivo o tempo todo</span>';

  $('cx-out').innerHTML = '<thead><tr><th>Mês</th><th>Entra</th><th>Sai (com a retirada)</th><th>Sobra do mês</th><th>Saldo no fim</th></tr></thead><tbody>' +
    r.linhas.map(l => `<tr><td>Mês ${l.mes}</td><td data-label="Entra">${brl(l.entradas)}</td><td data-label="Sai (com a retirada)">${brl(l.saidas + l.retirada)}</td><td data-label="Sobra do mês">${valor(l.resultado)}</td><td data-label="Saldo no fim">${valor(l.saldo)}</td></tr>`).join('') + '</tbody>';

  if (r.primeiroNegativo) {
    const motivo = r.resultadoDoPeriodo > 0
      ? `, mesmo com os seis meses fechando ${brl(r.resultadoDoPeriodo)} no positivo. Isso acontece quando o dinheiro sai antes de entrar`
      : '. No período, sai mais dinheiro do que entra';
    mostrarLeitura('cx-leitura', {
      tom: 'bad',
      texto: `O caixa fica negativo no mês ${r.primeiroNegativo.mes} e chega a faltar ${brl(r.folgaNecessaria)} no mês ${r.pior.mes}${motivo}. Sabendo disso agora, dá tempo de negociar prazos, adiar um gasto ou guardar essa folga antes.`,
      passo: { texto: 'Rever cada gasto do zero', href: '#zero' },
    });
  } else {
    mostrarLeitura('cx-leitura', {
      tom: 'ok',
      texto: `O caixa fica positivo nos seis meses. O menor saldo é ${brl(r.pior.saldo)}, no mês ${r.pior.mes}: essa é a sua folga se alguma venda atrasar.`,
      passo: { texto: 'Definir as metas do mês', href: '#metas' },
    });
  }
}

aplicarExemplo(EXEMPLOS, 'cx-ex');
['cx-saldo', 'cx-retirada'].forEach(id => $(id).addEventListener('input', atualizar));
MESES.forEach(n => ['e', 's'].forEach(c => $(`cx${n}-${c}`).addEventListener('input', atualizar)));
atualizar();

registrarTour('caixa', { painel: 'p-caixa', etapa: 6, passos: [
  { alvo: 'cx-saldo', titulo: 'Dinheiro em caixa hoje', termo: 'Saldo de caixa', texto: 'O que a empresa tem agora: conta do banco mais o dinheiro da gaveta.', exemplo: 'R$ 1.000.' },
  { alvo: 'cx-retirada', titulo: 'Sua retirada por mês', termo: 'Pró-labore', texto: 'Quanto você tira todo mês para a casa. Um valor fixo, combinado com você mesmo.', exemplo: 'R$ 2.000.' },
  { alvo: 'cx1-e', titulo: 'Entra', termo: 'Faturamento', texto: 'Quanto você espera vender no mês. Use os meses passados como base e ajuste para datas fortes ou fracas.', exemplo: 'R$ 37.200.' },
  { alvo: 'cx1-s', titulo: 'Sai', texto: 'Mercadoria, contas fixas e qualquer gasto grande previsto (reforma, equipamento, 13º). Sem a sua retirada, que já foi descontada.', exemplo: 'R$ 32.010 num mês normal; R$ 43.555 no mês do forno novo.' },
  { alvo: 'cx-big', titulo: 'Como ler o resultado', termo: 'Fluxo de caixa', texto: 'Olhe a coluna "Saldo no fim" mês a mês. Um número vermelho é um mês em que o dinheiro acaba antes de o próximo entrar, mesmo que o total do semestre seja positivo.' },
]});
