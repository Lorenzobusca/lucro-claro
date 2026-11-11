/* TELA: "Comece por aqui" (comece.html). Diagnóstico, as sete etapas, o progresso e a tela de parabéns.
   Os números da Padaria Pão da Esquina vêm de js/calculo/trilha.js, calculados pelas mesmas funções das ferramentas. */
import { $, brl, pct, numeroDe } from '../ui/numero.js';
import { TOTAL_ETAPAS, PADARIA, etapaInicial, resultadosPadaria } from '../calculo/trilha.js';
import { lerTrilha, salvarTrilha, novaTrilha, proximaPendente, trilhaCompleta, feitas } from '../ui/trilha.js';

const SETA = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const inteiro = v => Math.round(v).toLocaleString('pt-BR');
const r = resultadosPadaria();
const P = PADARIA;
const [pao, bolo, refri] = r.antes.itens;
const margemSeguranca = (r.antes.faturamento - r.antes.faturamentoEquilibrio) / r.antes.faturamento * 100;

/* ---------- As etapas ---------- */
/* Cada etapa: fazer (uma frase), porque (+ exemplo), onde (achar os números), campos (como usar), ler (o resultado), ferramenta e exemplo (links) */
const ETAPAS = [
  {
    n: 1, titulo: 'Separe o dinheiro da casa do dinheiro do negócio',
    fazer: 'Defina um valor fixo para tirar por mês e pare de pagar as contas de casa com o dinheiro do caixa.',
    porque: `Quando tudo sai da mesma gaveta, você nunca sabe se a loja dá lucro ou se está comendo o seu salário. Com uma retirada fixa, o que sobrar depois dela é lucro de verdade. E a retirada entra na lista de contas do mês, como o aluguel.`,
    exemplo: `A ${P.dona} tirava "o que dava" e achava que a padaria ia bem. Quando fixou ${brl(P.retirada)} por mês e colocou esse valor na lista de contas, descobriu que o lucro real era de ${brl(r.lucroAntes)} por mês. Esse é o número que a trilha vai melhorar.`,
    onde: ['Extrato do banco e da maquininha dos últimos três meses: some tudo o que você tirou para a casa. Esse é o seu ponto de partida.', 'Se a empresa é MEI ou tem CNPJ, abra uma conta só para ela (muitos bancos oferecem conta PJ gratuita) e um Pix separado.'],
    semFerramenta: true,
    ler: 'Se o negócio não consegue pagar a sua retirada todo mês, isso é um prejuízo, mesmo que o caixa tenha dinheiro no fim do mês. As próximas etapas mostram onde está o problema.',
  },
  {
    n: 2, titulo: 'Liste seus custos fixos e variáveis',
    fazer: 'Anote tudo o que você paga todo mês, venda ou não, e decida o que manter, reduzir ou cortar.',
    porque: `Custo fixo é o que vem todo mês de qualquer jeito: aluguel, salários, luz, internet, contador, assinaturas e a sua retirada. Custo variável é o que cresce junto com a venda: mercadoria, embalagem, taxa da maquininha. Sem saber o total dos fixos, nenhuma outra conta fecha.`,
    exemplo: `A ${P.dona} listou ${P.gastos.length} contas e chegou a ${brl(r.fixosAntes)} por mês. Revendo a energia e as assinaturas, cortou ${brl(r.baseZero.economiaMes)} por mês: ${brl(r.baseZero.economiaAno)} no ano, sem vender um pão a mais.`,
    onde: ['Extrato do banco dos últimos três meses: o que se repete todo mês é custo fixo.', 'Boletos e contas de consumo (luz, água, gás, internet).', 'Os custos variáveis ficam para a próxima etapa, produto por produto, usando as notas dos fornecedores.'],
    ferramenta: { href: 'metas.html#zero', nome: 'Orçamento base zero', exemplo: 'metas.html?ex=padaria#zero' },
    campos: [
      ['Gasto', 'Uma conta por linha', 'Aluguel, ajudante, energia…'],
      ['Valor por mês', 'Quanto sai hoje', brl(3000) + ' (aluguel)'],
      ['Decisão', 'Manter, reduzir ou cortar', 'energia: reduzir'],
      ['Novo valor', 'Só para "reduzir": quanto vai ficar', brl(1000)],
    ],
    ler: `A linha "Gasto por mês hoje" é o total dos seus custos fixos (${P.dona}: ${brl(r.fixosAntes)}). Anote esse número, ele volta nas etapas 3, 4 e 5. O número grande é quanto sobra no ano com as suas decisões. Se der zero, pergunte de cada item: eu contrataria isto de novo hoje, por este valor?`,
  },
  {
    n: 3, titulo: 'Descubra a margem de cada produto',
    fazer: 'Veja quanto sobra de cada produto depois de pagar o que ele custa e as taxas da venda.',
    porque: `O produto que mais vende nem sempre é o que mais deixa dinheiro. A margem de contribuição diz quanto de cada R$ 100 vendidos sobra para pagar as contas fixas. Produto de margem alta merece destaque na vitrine; produto de margem baixa só vale a pena se trouxer cliente.`,
    exemplo: `Na padaria, o pão francês é o que mais vende, mas deixa ${pct(pao.margemPct, 1)} de margem. O bolo de pote deixa ${pct(bolo.margemPct, 1)}. O refrigerante, só ${pct(refri.margemPct, 1)}. Somando tudo, sobram ${brl(r.antes.contribuicao)} por mês para pagar ${brl(r.fixosAntes)} de contas fixas: lucro de ${brl(r.lucroAntes)}.`,
    onde: ['Preço: a sua etiqueta ou o cardápio.', 'Custo por unidade: as notas dos fornecedores. Para quem produz, some os ingredientes de uma receita e divida pelo que ela rende.', 'Vendas no mês: caderno de vendas, sistema ou relatório da maquininha.', 'Impostos e taxas: a taxa da maquininha (no contrato ou no app dela) mais o imposto sobre a venda, se houver.'],
    ferramenta: { href: 'custeio.html#produtos', nome: 'Margem por produto', exemplo: 'custeio.html?ex=padaria#produtos' },
    campos: [
      ['Produto', 'Comece pelos 3 ou 4 que mais vendem', 'Pão francês (kg)'],
      ['Preço', 'Quanto você cobra', brl(pao.preco)],
      ['Custo por unidade', 'Mercadoria ou matéria-prima', brl(P.produtos[0].custoVariavel)],
      ['Impostos e taxas', 'Maquininha + imposto, em %', pct(P.taxaCartao, 0)],
      ['Vendas no mês', 'Quantas unidades saíram', inteiro(P.produtos[0].quantidade)],
      ['Custos fixos do mês', 'O total da etapa 2', brl(r.fixosAntes)],
    ],
    ler: `Olhe a coluna "Margem": quanto maior, mais vale vender. Se algum produto aparecer em vermelho, ele dá prejuízo a cada venda: o preço precisa subir ou o custo cair (etapa 5). A linha "Faturamento de equilíbrio" diz quanto você precisa vender no mês para pagar as contas fixas (${P.dona}: ${brl(r.antes.faturamentoEquilibrio)}).`,
  },
  {
    n: 4, titulo: 'Calcule seu ponto de equilíbrio',
    fazer: 'Descubra quantas vendas pagam todas as contas do mês. Abaixo disso é prejuízo; acima, lucro.',
    porque: `Saber o ponto de equilíbrio tira a angústia do "será que este mês vai dar?". Você passa a ter um número para perseguir: a partir dele, cada venda a mais é lucro. E a margem de segurança diz quanto as vendas podem cair antes de doer.`,
    exemplo: `Se a padaria vendesse só pão francês, precisaria de ${inteiro(r.soPao.equilibrio)} kg por mês para pagar as contas, e vende ${inteiro(P.produtos[0].quantidade)}: só com pão, ela teria prejuízo de ${brl(-r.soPao.lucro)}. São o bolo e o refrigerante que fecham a conta. A padaria inteira precisa vender ${brl(r.antes.faturamentoEquilibrio)} por mês e vende ${brl(r.antes.faturamento)}: margem de segurança de ${pct(margemSeguranca, 0)}.`,
    onde: ['Os mesmos números da etapa 3. Esta calculadora olha um produto por vez: use o seu carro-chefe, ou o preço e o custo de uma venda típica.', 'Para a loja inteira, use a linha "Faturamento de equilíbrio" da etapa 3.'],
    ferramenta: { href: 'custeio.html#margem', nome: 'Margem e equilíbrio', exemplo: 'custeio.html?ex=padaria#margem' },
    campos: [
      ['Preço de venda', 'Do produto escolhido', brl(pao.preco)],
      ['Custo variável por unidade', 'Mercadoria ou matéria-prima', brl(P.produtos[0].custoVariavel)],
      ['Impostos, taxas e comissões', 'Em % do preço', pct(P.taxaCartao, 0)],
      ['Custos fixos do mês', 'O total da etapa 2', brl(r.fixosAntes)],
      ['Unidades vendidas no mês', 'Do último mês', inteiro(P.produtos[0].quantidade)],
    ],
    ler: `O número grande é quanto sobrou (ou faltou) no mês com esse produto. "Ponto de equilíbrio" é quantas unidades pagam as contas. Se o resultado vier vermelho, como no exemplo do pão, não se assuste: é o sinal de que esse produto não paga a loja sozinho e os outros precisam ajudar. A "margem de segurança" é a sua folga; abaixo de 10%, qualquer semana fraca vira prejuízo.`,
  },
  {
    n: 5, titulo: 'Revise seus preços',
    fazer: 'Calcule o preço que paga o produto, as taxas, a parte das contas fixas e ainda deixa o lucro que você quer.',
    porque: `Muita gente copia o preço do vizinho ou "dobra o custo" sem saber se isso fecha a conta. O preço certo cobre quatro coisas: o custo do produto, as despesas da venda, uma fatia das contas fixas e o seu lucro. Faltou uma, você trabalha de graça.`,
    exemplo: `O refrigerante da padaria custa ${brl(P.produtos[2].custoVariavel)} e era vendido a ${brl(P.produtos[2].preco)}. Para deixar ${pct(P.lucroDesejado, 0)} de lucro, o preço seria ${brl(r.preco.preco)}. O concorrente cobra ${brl(P.precoConcorrente)}; a ${P.dona} subiu para ${brl(P.precoNovoRefri)}. A sobra por lata foi de ${brl(refri.margem)} para ${brl(r.refriDepois.margem)}. Com os cortes da etapa 2, o lucro do mês foi de ${brl(r.lucroAntes)} para ${brl(r.lucroDepois)}.`,
    onde: ['Custo do produto: nota do fornecedor.', 'Despesas da venda: taxa da maquininha e imposto sobre a venda, em %.', 'Parte dos custos fixos: divida o total da etapa 2 pelas vendas do mês (etapa 3). Padaria: ' + brl(r.fixosAntes) + ' ÷ ' + brl(r.antes.faturamento) + ' = ' + pct(r.pctFixos, 0) + '.', 'Preço do concorrente: uma volta no quarteirão.'],
    ferramenta: { href: 'custeio.html#preco', nome: 'Formação de preço', exemplo: 'custeio.html?ex=padaria#preco' },
    campos: [
      ['Custo do produto', 'Por unidade', brl(P.produtos[2].custoVariavel)],
      ['Despesas da venda', 'Em % do preço', pct(P.taxaCartao, 0)],
      ['Parte dos custos fixos', 'Fixos ÷ vendas do mês', pct(r.pctFixos, 0)],
      ['Lucro que você quer', 'Em % do preço', pct(P.lucroDesejado, 0)],
      ['Preço do concorrente', 'Opcional', brl(P.precoConcorrente)],
    ],
    ler: `O número grande é o preço que fecha a conta. Se o concorrente cobra menos, a leitura mostra quanto sobra copiando o preço dele; se der vermelho, você paga para vender. Comece revisando os produtos de margem mais baixa da etapa 3. Subir o preço em ${brl(P.precoNovoRefri - P.produtos[2].preco)} numa lata parece pouco, mas em ${inteiro(P.produtos[2].quantidade)} latas são ${brl(r.refriDepois.contribuicao - refri.contribuicao)} a mais por mês.`,
  },
  {
    n: 6, titulo: 'Monte o orçamento do mês',
    fazer: 'Preveja quanto vai entrar e sair nos próximos seis meses e veja se o dinheiro falta em algum deles.',
    porque: `Uma empresa pode dar lucro e quebrar por falta de caixa: o dinheiro sai antes de entrar. O fluxo de caixa mostra, mês a mês, se vai faltar, e com quanta antecedência. Sabendo antes, dá para negociar prazo, adiar um gasto ou guardar uma folga.`,
    exemplo: `Na padaria, o forno quebra no mês 2 e custa ${brl(P.caixa.forno)}. Pagando à vista, o caixa fica negativo em ${brl(-r.caixa.pior.saldo)} nesse mês, mesmo com o semestre fechando positivo. Parcelando em três vezes de ${brl(r.parcela)}, o menor saldo passa a ser ${brl(r.caixaParcelado.pior.saldo)}, e o fim do semestre é o mesmo: ${brl(r.caixaParcelado.saldoFinal)}.`,
    onde: ['Dinheiro em caixa: saldo do banco mais o da gaveta, hoje.', 'Entradas: as vendas dos últimos meses (maquininha, caderno), ajustadas para datas fortes e fracas.', 'Saídas: mercadoria (notas dos fornecedores) mais os custos fixos da etapa 2, sem a sua retirada, mais qualquer gasto grande previsto.'],
    ferramenta: { href: 'metas.html#caixa', nome: 'Fluxo de caixa', exemplo: 'metas.html?ex=padaria#caixa' },
    campos: [
      ['Dinheiro em caixa hoje', 'Banco + gaveta', brl(P.caixa.saldoInicial)],
      ['Sua retirada por mês', 'Da etapa 1', brl(P.retirada)],
      ['Entra (cada mês)', 'Vendas previstas', brl(r.antes.faturamento)],
      ['Sai (cada mês)', 'Mercadoria + fixos + gastos previstos', brl(r.meses[0].saidas)],
    ],
    ler: `Olhe a coluna "Saldo no fim" mês a mês. Vermelho é mês em que o dinheiro acaba. A leitura diz quanto falta e quando: é o tamanho da folga que você precisa guardar ou negociar. O menor saldo positivo é a sua reserva de emergência mínima.`,
  },
  {
    n: 7, titulo: 'Acompanhe todo mês e compare com o planejado',
    fazer: 'Transforme os números das etapas anteriores em metas e lance o que acontece, toda semana.',
    porque: `Planejar uma vez não muda nada; comparar todo mês o planejado com o realizado, sim. O painel mostra se você está no ritmo e como o mês deve fechar, com tempo de reagir antes do dia 30.`,
    exemplo: `A ${P.dona} criou três metas: vender ${brl(r.depois.faturamento)} no mês (o faturamento depois do preço novo), não passar de ${brl(r.fixosDepois)} de gastos fixos (o total depois dos cortes) e vender ${inteiro(P.produtos[2].quantidade)} refrigerantes (para conferir se o preço novo não espantou ninguém). Toda sexta ela lança os números da semana.`,
    onde: ['Vendas: relatório da maquininha ou caderno, uma vez por semana.', 'Gastos: extrato do banco.', 'As metas em si vêm das etapas anteriores: faturamento de equilíbrio (3), custos fixos (2), preços novos (5).'],
    ferramenta: { href: 'metas.html#metas', nome: 'Metas do mês', exemplo: 'metas.html?ex=padaria#metas' },
    campos: [
      ['Nome da meta', 'Do seu jeito', 'Vendas do mês'],
      ['Tipo', '"Chegar a" para vendas; "não passar de" para gastos', 'Chegar a um valor'],
      ['Meta por mês', 'O número a bater', brl(r.depois.faturamento)],
      ['Medida', 'Reais, unidades, horas ou quilos', 'R$'],
    ],
    ler: `Cada cartão mostra quanto já foi feito e, no risquinho, onde você deveria estar hoje. "No ritmo" é bom; "Atrasada" pede ação ainda este mês. A linha "Nesse ritmo, fecha o mês em…" é a sua previsão. No fim do mês, compare com o planejado e ajuste as metas do mês seguinte.`,
  },
  {
    n: 8, bonus: true, titulo: 'Bônus: corte o desperdício',
    fazer: 'Meça o que estraga, vence ou some por mês e veja quanto isso custa em vendas.',
    porque: `O que se perde já foi pago: sai direto do lucro. E para repor R$ 1 de perda é preciso vender bem mais do que R$ 1, porque só a margem sobra de cada venda.`,
    exemplo: `A padaria joga fora ${brl(P.perdas.perdaMensal)} de pão e bolo por mês. Com margem média de ${pct(r.antes.margemMediaPct, 0)}, repor isso exige vender ${brl(r.perdas.vendasParaCompensar)} a mais. Evitando metade da perda, sobram ${brl(r.perdas.recuperadoMes)} por mês, ${brl(r.perdas.recuperadoAno)} no ano, sem vender nada a mais.`,
    onde: ['Anote por 30 dias tudo o que foi para o lixo, venceu ou sumiu, pelo custo.', 'A margem média está na etapa 3 ("Margem média da loja").'],
    ferramenta: { href: 'custeio.html#perdas', nome: 'Perdas', exemplo: 'custeio.html?ex=padaria#perdas' },
    campos: [
      ['Quanto se perde por mês', 'Pelo custo', brl(P.perdas.perdaMensal)],
      ['Sua margem média', 'Da etapa 3', pct(r.antes.margemMediaPct, 0)],
      ['Vendas do mês', 'Faturamento', brl(r.antes.faturamento)],
      ['Quanto dá para evitar', 'Um chute honesto', pct(P.perdas.reducao, 0)],
    ],
    ler: 'O número grande é quanto você precisa vender a mais só para repor a perda. Se for assustador, ótimo: é o argumento para produzir menos no fim do dia, girar o estoque e conferir as entregas.',
  },
];

/* ---------- Estado ---------- */
let T = lerTrilha() || novaTrilha();
let aberta = null;
const salvar = () => salvarTrilha(T);

/* ---------- Montagem ---------- */
function htmlEtapa(e) {
  const feita = T.concluidas.includes(e.n);
  const campos = e.campos ? `<div class="bloco"><h3>Como preencher a ferramenta</h3><dl class="campos-lista">${e.campos.map(([c, o, ex]) => `<div><dt>${c}<small>${o}</small></dt><dd>${ex}</dd></div>`).join('')}</dl></div>` : '';
  const retirada = e.n === 1 ? `
    <div class="bloco"><h3>Faça agora</h3>
      <ul class="checklist">
        <li><label><input type="checkbox" data-check="conta"> Abrir (ou escolher) uma conta só para o negócio</label></li>
        <li><label><input type="checkbox" data-check="pix"> Receber as vendas só nessa conta ou na maquininha</label></li>
        <li><label><input type="checkbox" data-check="dia"> Escolher um dia fixo do mês para a sua retirada</label></li>
      </ul>
      <form class="retirada-form" id="retirada-form" novalidate>
        <label>Quanto você vai tirar por mês? (R$)<input id="retirada-valor" inputmode="decimal" placeholder="${P.retirada}" value="${T.retirada ?? ''}"></label>
        <button class="btn-mini" type="submit">Guardar</button>
        <span class="form-msg" id="retirada-msg" role="status"></span>
      </form>
      <p class="note">Esse valor fica só neste navegador. Ele entra como custo fixo nas próximas etapas.</p>
    </div>` : '';
  const botoes = e.semFerramenta ? '' : `
    <a class="btn primary" href="${e.ferramenta.href}">Fazer agora${SETA}</a>
    <a class="btn" href="${e.ferramenta.exemplo}">Testar com o exemplo da padaria</a>`;
  const proxima = e.n < TOTAL_ETAPAS ? `<a class="link" href="#etapa-${e.n + 1}">Ir para a etapa ${e.n + 1}</a>` : (e.n === TOTAL_ETAPAS ? `<a class="link" href="#etapa-8">Ver o bônus</a>` : '');
  return `<article class="etapa${feita ? ' feita' : ''}" id="etapa-${e.n}" data-n="${e.n}">
    <button class="etapa-topo" type="button" aria-expanded="false" aria-controls="corpo-${e.n}">
      <span class="etapa-num" aria-hidden="true">${e.bonus ? '+' : e.n}</span>
      <span><h2>${e.titulo}</h2><p class="fazer">${e.fazer}</p></span>
      ${feita ? '<span class="pill ok">Concluída</span>' : e.bonus ? '<span class="pill warn">Opcional</span>' : ''}
    </button>
    <div class="etapa-corpo" id="corpo-${e.n}" hidden>
      <div class="bloco"><h3>Por que isso aumenta o lucro</h3><p>${e.porque}</p>
        <div class="exemplo-caixa"><b>${P.nome}</b><p>${e.exemplo}</p></div></div>
      <div class="bloco"><h3>Onde achar os números</h3><ul>${e.onde.map(x => `<li>${x}</li>`).join('')}</ul></div>
      ${retirada}${campos}
      <div class="bloco"><h3>Como ler o resultado</h3><p>${e.ler}</p></div>
      <div class="etapa-acoes">${botoes}
        ${e.bonus ? '' : `<button class="btn concluir${feita ? ' feito' : ''}" type="button" data-concluir="${e.n}" aria-pressed="${feita}">${feita ? '✓ Etapa concluída' : 'Concluí esta etapa'}</button>`}
        ${proxima}
      </div>
    </div>
  </article>`;
}

function abrir(n, rolar = true) {
  document.querySelectorAll('.etapa').forEach(el => {
    const ativa = +el.dataset.n === n;
    el.classList.toggle('aberta', ativa);
    el.querySelector('.etapa-topo').setAttribute('aria-expanded', ativa);
    el.querySelector('.etapa-corpo').hidden = !ativa;
  });
  aberta = n;
  if (rolar) $('etapa-' + n)?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function progresso() {
  const f = feitas(T);
  $('prog-texto').textContent = `${f} de ${TOTAL_ETAPAS} etapas`;
  $('prog-barra').style.width = (f / TOTAL_ETAPAS * 100) + '%';
  const prox = proximaPendente(T, 1);
  const cont = $('continuar');
  cont.hidden = f === 0 || !prox;
  if (prox) { cont.href = '#etapa-' + prox; cont.querySelector('span').textContent = `Continuar da etapa ${prox}`; }
  $('parabens').hidden = !trilhaCompleta(T);
}

function montar() {
  $('etapas').innerHTML = ETAPAS.map(htmlEtapa).join('');
  progresso();
}

/* ---------- Parabéns ---------- */
$('parabens').innerHTML = `
  <span class="eyebrow">Trilha completa</span>
  <h2>Você fez as sete etapas. Agora é repetir todo mês.</h2>
  <p>O que você aprendeu com a ${P.nome}:</p>
  <ul>
    <li>Com a retirada fixa de ${brl(P.retirada)}, o lucro real era ${brl(r.lucroAntes)} por mês.</li>
    <li>Rever os gastos fixos economizou ${brl(r.baseZero.economiaMes)} por mês.</li>
    <li>Subir o refrigerante de ${brl(P.produtos[2].preco)} para ${brl(P.precoNovoRefri)} trouxe ${brl(r.refriDepois.contribuicao - refri.contribuicao)} a mais por mês.</li>
    <li>O lucro foi de ${brl(r.lucroAntes)} para ${brl(r.lucroDepois)}: ${brl(r.ganho)} a mais por mês, ${brl(r.ganho * 12)} no ano.</li>
    <li>Parcelar o forno evitou um caixa negativo de ${brl(-r.caixa.pior.saldo)}.</li>
  </ul>
  <p>Com os seus números, o caminho é o mesmo: todo mês, lance as vendas e os gastos nas metas, compare com o planejado e volte às etapas 3 e 5 quando um custo ou um preço mudar.</p>
  <div class="parabens-acoes">
    <a class="btn" href="metas.html#metas">Acompanhar este mês${SETA}</a>
    <button class="btn ghost" type="button" id="recomecar">Recomeçar a trilha</button>
  </div>`;
$('recomecar').addEventListener('click', () => { T = { ...novaTrilha(), retirada: T.retirada, diagnostico: T.diagnostico }; salvar(); montar(); abrir(1); });

/* ---------- Diagnóstico ---------- */
const respostas = { custos: null, margem: null, dor: null };
const TEXTO_ETAPA = n => ETAPAS[n - 1].titulo.toLowerCase();
document.querySelectorAll('.pergunta').forEach(p => {
  p.addEventListener('click', e => {
    const b = e.target.closest('.opcao'); if (!b) return;
    p.querySelectorAll('.opcao').forEach(x => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    respostas[p.dataset.pergunta] = b.dataset.valor;
    if (Object.values(respostas).every(Boolean)) {
      const n = etapaInicial(respostas);
      T.diagnostico = { ...respostas, etapa: n }; T.atual = n; salvar();
      const res = $('diag-resultado');
      res.hidden = false;
      res.innerHTML = `<span class="eyebrow">Seu ponto de partida</span><h3>Comece pela etapa ${n}: ${TEXTO_ETAPA(n)}</h3>
        <p>${n === 1 ? 'Antes de qualquer conta, separe o dinheiro. É a base de tudo o que vem depois.' : n === 2 ? 'Sem saber quanto a loja custa por mês, as outras contas não fecham. Comece listando os gastos.' : n === 3 ? 'Você já conhece os gastos; agora descubra quais produtos deixam dinheiro de verdade.' : 'Você já tem a base. Vá direto ao que mais incomoda e volte às outras etapas depois.'}</p>
        <a class="btn" href="#etapa-${n}">Ir para a etapa ${n}${SETA}</a>`;
      res.querySelector('a').addEventListener('click', ev => { ev.preventDefault(); abrir(n); history.replaceState(null, '', '#etapa-' + n); });
    }
  });
});
$('pular-diag').addEventListener('click', e => { e.preventDefault(); abrir(proximaPendente(T, 1) || 1); });

/* ---------- Ações nas etapas ---------- */
$('etapas').addEventListener('click', e => {
  const topo = e.target.closest('.etapa-topo');
  if (topo) { const n = +topo.closest('.etapa').dataset.n; abrir(aberta === n ? 0 : n, false); return; }
  const b = e.target.closest('[data-concluir]');
  if (b) {
    const n = +b.dataset.concluir;
    if (T.concluidas.includes(n)) T.concluidas = T.concluidas.filter(x => x !== n);
    else T.concluidas.push(n);
    T.atual = proximaPendente(T, n + 1) || n;
    salvar(); montar();
    if (trilhaCompleta(T)) { $('parabens').scrollIntoView({ block: 'start' }); return; }
    abrir(T.concluidas.includes(n) && n < TOTAL_ETAPAS ? n + 1 : n);
  }
});
$('etapas').addEventListener('submit', e => {
  if (e.target.id !== 'retirada-form') return;
  e.preventDefault();
  const v = numeroDe($('retirada-valor').value);
  if (!(v > 0)) { $('retirada-msg').textContent = 'Informe um valor maior que zero.'; return; }
  T.retirada = v; salvar();
  $('retirada-msg').textContent = `Guardado: ${brl(v)} por mês.`;
});
$('etapas').addEventListener('change', e => {
  const c = e.target.closest('[data-check]'); if (!c) return;
  T.checks = { ...(T.checks || {}), [c.dataset.check]: c.checked }; salvar();
});

/* Links #etapa-N dentro da página abrem a etapa */
function peloHash() {
  const m = location.hash.match(/^#etapa-(\d+)$/);
  if (m) { abrir(+m[1]); return true; }
  return false;
}
addEventListener('hashchange', peloHash);

/* ---------- Início ---------- */
montar();
Object.entries(T.checks || {}).forEach(([k, v]) => { const c = document.querySelector(`[data-check="${k}"]`); if (c) c.checked = v; });
if (!peloHash()) {
  if (feitas(T) > 0 && !trilhaCompleta(T)) abrir(proximaPendente(T, T.atual || 1), false);
  else if (T.diagnostico) abrir(T.diagnostico.etapa, false);
}
