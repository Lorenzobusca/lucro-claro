/* UI: mini glossário, aberto pelo botão "Glossário" no topo de qualquer página.
   Para incluir um termo, acrescente uma linha na lista abaixo (em ordem alfabética). */
import { $ } from './numero.js';

const TERMOS = [
  ['Capital de giro', 'O dinheiro que a empresa precisa ter em caixa para funcionar entre pagar os fornecedores e receber dos clientes.'],
  ['Custeio ABC', 'Jeito de calcular o custo em que cada atividade (preparar, inspecionar, entregar) é cobrada do produto ou cliente que a usa.'],
  ['Custeio por absorção', 'Jeito de calcular o custo em que todos os gastos da produção, fixos e variáveis, entram no custo do produto.'],
  ['Custeio variável', 'Jeito de calcular o custo em que só entram no produto os gastos que mudam com a quantidade vendida.'],
  ['Custo fixo', 'Gasto que vem todo mês, vendendo muito ou pouco: aluguel, salários, internet.'],
  ['Custo indireto', 'Gasto que serve a vários produtos ao mesmo tempo, como energia e manutenção, e por isso precisa ser dividido entre eles.'],
  ['Custo variável', 'Gasto que cresce junto com as vendas: mercadoria, matéria-prima, embalagem.'],
  ['Despesa variável', 'O que você paga só quando vende: imposto sobre a venda, taxa do cartão, comissão.'],
  ['Fluxo de caixa', 'O registro do dinheiro que entra e sai, mês a mês, e de quanto sobra no fim de cada um.'],
  ['Lucro', 'O que sobra das vendas depois de pagar todos os custos e despesas, fixos e variáveis.'],
  ['Margem de contribuição', 'O que sobra do preço depois de pagar os custos e despesas variáveis. É o que ajuda a pagar as contas fixas.'],
  ['Margem de segurança', 'Quanto as vendas podem cair antes de a empresa começar a ter prejuízo.'],
  ['Markup', 'O número pelo qual você multiplica o custo para chegar ao preço de venda.'],
  ['Orçamento', 'O plano de quanto a empresa pretende vender e gastar num período, para comparar depois com o que aconteceu.'],
  ['Orçamento base zero', 'Orçamento em que cada gasto precisa ser justificado de novo, em vez de repetir o valor do período anterior.'],
  ['Ponto de equilíbrio', 'Quanto é preciso vender para pagar todas as contas do mês. Abaixo dele é prejuízo; acima, lucro.'],
  ['Pró-labore', 'O valor fixo que o dono retira da empresa todo mês pelo seu trabalho, como se fosse um salário.'],
];

const botao = $('abrir-glossario');
let janela = null;

function montar() {
  janela = document.createElement('dialog');
  janela.className = 'glossario';
  janela.setAttribute('aria-labelledby', 'glossario-titulo');
  janela.innerHTML = `
    <div class="glossario-topo">
      <h2 id="glossario-titulo">Glossário</h2>
      <button class="btn-x" type="button" data-fechar aria-label="Fechar o glossário">×</button>
    </div>
    <p class="hint">Os termos que aparecem no site, cada um em uma linha.</p>
    <label class="sr-only" for="glossario-busca">Procurar um termo</label>
    <input id="glossario-busca" type="search" placeholder="Procurar um termo" autocomplete="off">
    <dl>${TERMOS.map(([termo, texto]) => `<div><dt>${termo}</dt><dd>${texto}</dd></div>`).join('')}</dl>
    <p class="vazio" hidden>Nenhum termo com esse nome.</p>`;
  document.body.append(janela);

  const linhas = [...janela.querySelectorAll('dl div')], vazio = janela.querySelector('.vazio');
  const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  janela.querySelector('input').addEventListener('input', e => {
    const busca = semAcento(e.target.value.trim());
    let achou = 0;
    linhas.forEach(l => { const mostra = semAcento(l.textContent).includes(busca); l.hidden = !mostra; if (mostra) achou++; });
    vazio.hidden = achou > 0;
  });
  /* Fecha no botão ou clicando fora da caixa */
  janela.addEventListener('click', e => { if (e.target === janela || e.target.closest('[data-fechar]')) janela.close(); });
}

botao?.addEventListener('click', () => {
  if (!janela) montar();
  if (typeof janela.showModal === 'function') janela.showModal(); else janela.setAttribute('open', '');
});
