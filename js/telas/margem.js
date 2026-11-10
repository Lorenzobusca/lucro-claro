/* TELA: margem de contribuição e ponto de equilíbrio (custeio.html, aba "Margem e equilíbrio"). */
import { $, ler, brl, pct, linhas, mostrarNumero } from '../ui/numero.js';
import { calcularMargem } from '../calculo/margem.js';

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
    ['Ponto de equilíbrio', temEquilibrio ? Math.ceil(r.equilibrio).toLocaleString('pt-BR') + ' un.' : 'não existe'],
    ['Faturamento de equilíbrio', temEquilibrio ? brl(r.faturamentoEquilibrio) : '—'],
    ['Margem de segurança', pct(r.seguranca, 1)],
  ]);
}

['m-preco', 'm-cv', 'm-dv', 'm-cf', 'm-q'].forEach(id => $(id).addEventListener('input', atualizar));
atualizar();
