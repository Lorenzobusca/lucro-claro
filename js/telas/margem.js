/* TELA: margem de contribuição e ponto de equilíbrio (custeio.html, aba "Margem e equilíbrio"). */
import { $, ler, brl, pct, linhas, mostrarNumero } from '../ui/numero.js';
import { registrarTour } from '../ui/tour.js';
import { aplicarExemplo, mostrarLeitura } from '../ui/apoio.js';
import { calcularMargem } from '../calculo/margem.js';

const EXEMPLOS = {
  padaria: {
    nome: 'a Padaria Pão da Esquina olhando só o pão francês',
    campos: { 'm-preco': '18', 'm-cv': '11', 'm-dv': '5', 'm-cf': '10000', 'm-q': '1500' },
  },
  roupas: {
    nome: 'uma loja de roupas que vende 300 peças por mês',
    campos: { 'm-preco': '80', 'm-cv': '40', 'm-dv': '10', 'm-cf': '8000', 'm-q': '300' },
  },
};

const inteiro = v => Math.ceil(v).toLocaleString('pt-BR');

function atualizar() {
  const preco = ler('m-preco'), quantidade = ler('m-q');
  const r = calcularMargem({ preco, custoVariavel: ler('m-cv'), despesasVariaveis: ler('m-dv'), custosFixos: ler('m-cf'), quantidade });
  const temEquilibrio = isFinite(r.equilibrio);

  mostrarNumero($('m-big'), r.lucro, brl);
  $('m-big').classList.toggle('negativo', r.lucro < 0);
  $('m-pill').innerHTML = r.margem <= 0 ? '<span class="pill bad">Cada venda dá prejuízo</span>'
    : r.lucro >= 0 ? '<span class="pill ok">Acima do ponto de equilíbrio</span>'
    : '<span class="pill warn">Abaixo do ponto de equilíbrio</span>';

  /* Barra: vendas do mês; risco: ponto de equilíbrio */
  const escala = Math.max(quantidade, temEquilibrio ? r.equilibrio : 0) * 1.15 || 1;
  $('m-bar').style.width = Math.min(100, quantidade / escala * 100) + '%';
  $('m-mark').style.left = temEquilibrio ? Math.min(99, r.equilibrio / escala * 100) + '%' : '99%';

  $('m-kv').innerHTML = linhas([
    ['Margem de contribuição / un.', brl(r.margem)],
    ['Margem de contribuição', pct(r.margemPct, 1)],
    ['Ponto de equilíbrio', temEquilibrio ? inteiro(r.equilibrio) + ' un.' : 'não existe'],
    ['Faturamento de equilíbrio', temEquilibrio ? brl(r.faturamentoEquilibrio) : '—'],
    ['Margem de segurança', pct(r.seguranca, 1)],
  ]);

  if (r.margem <= 0) {
    mostrarLeitura('m-leitura', {
      tom: 'bad',
      texto: `Cada unidade custa ${brl(-r.margem)} a mais do que rende. Vender mais só aumenta o prejuízo: o preço precisa subir ou o custo cair.`,
      passo: { texto: 'Calcular um preço que feche a conta', href: '#preco' },
    });
  } else if (r.lucro < 0) {
    mostrarLeitura('m-leitura', {
      tom: 'warn',
      texto: `Você precisa vender ${inteiro(r.equilibrio)} unidades para pagar as contas do mês e hoje vende ${quantidade.toLocaleString('pt-BR')}. Faltam ${inteiro(r.equilibrio - quantidade)}. Cada unidade a mais reduz o prejuízo em ${brl(r.margem)}.`,
      passo: { texto: 'Ver quais produtos deixam mais margem', href: '#produtos' },
    });
  } else {
    mostrarLeitura('m-leitura', {
      tom: 'ok',
      texto: `As contas do mês estão pagas a partir de ${inteiro(r.equilibrio)} unidades. Daí em diante, cada venda deixa ${brl(r.margem)} de lucro. Suas vendas podem cair ${pct(r.seguranca, 0)} antes de dar prejuízo.`,
      passo: { texto: 'Transformar esse número em meta do mês', href: 'metas.html#metas' },
    });
  }
}

aplicarExemplo(EXEMPLOS, 'm-ex');
['m-preco', 'm-cv', 'm-dv', 'm-cf', 'm-q'].forEach(id => $(id).addEventListener('input', atualizar));
atualizar();

registrarTour('margem', { painel: 'p-margem', etapa: 4, passos: [
  { alvo: 'm-preco', titulo: 'Preço de venda', texto: 'Quanto o cliente paga por uma unidade. Se você vende vários produtos, use o preço de uma venda típica.', exemplo: 'o quilo do pão francês sai por R$ 18.' },
  { alvo: 'm-cv', titulo: 'Custo variável', termo: 'Custo variável', texto: 'O que você gasta para ter essa unidade: a mercadoria ou a matéria-prima. Está nas notas dos fornecedores.', exemplo: 'farinha, fermento e gás do quilo de pão: R$ 11.' },
  { alvo: 'm-dv', titulo: 'Impostos e taxas', termo: 'Despesa variável', texto: 'A parte do preço que vai embora em cada venda: taxa da maquininha, imposto sobre a venda, comissão. Some tudo em %.', exemplo: '5% da maquininha.' },
  { alvo: 'm-cf', titulo: 'Custos fixos do mês', termo: 'Custo fixo', texto: 'Tudo o que você paga todo mês mesmo sem vender: aluguel, salários, luz, internet e a sua retirada. Pegue no extrato do banco.', exemplo: 'R$ 10.000 por mês.' },
  { alvo: 'm-q', titulo: 'Unidades vendidas', texto: 'Quantas unidades saíram no último mês. Está no caderno de vendas ou no relatório da maquininha.', exemplo: '1.500 kg de pão.' },
  { alvo: 'm-big', titulo: 'Como ler o resultado', termo: 'Ponto de equilíbrio', texto: 'O número grande é quanto sobrou (ou faltou) no mês. Logo abaixo, o ponto de equilíbrio: quantas unidades pagam as contas. Vendendo menos que isso, é prejuízo.' },
]});
