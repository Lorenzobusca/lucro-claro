/* CÁLCULO: orçamento base zero.
   Em vez de repetir os gastos do período anterior, cada gasto precisa se justificar de novo:
   manter, reduzir ou cortar. */

/* gastos: [{ nome, valor, decisao: 'manter' | 'reduzir' | 'cortar', novoValor }] */
export function calcularBaseZero(gastos) {
  const itens = gastos.map(g => {
    const depois = g.decisao === 'cortar' ? 0
      : g.decisao === 'reduzir' ? Math.min(g.valor, Math.max(0, g.novoValor))
      : g.valor;
    return { nome: g.nome, antes: g.valor, depois, economia: g.valor - depois, decisao: g.decisao };
  });
  const antes = itens.reduce((s, x) => s + x.antes, 0);
  const depois = itens.reduce((s, x) => s + x.depois, 0);
  return {
    itens,
    antes,
    depois,
    economiaMes: antes - depois,
    economiaAno: (antes - depois) * 12,
    economiaPct: antes ? (antes - depois) / antes * 100 : NaN,
    revisados: itens.filter(x => x.decisao !== 'manter' && x.antes > 0).length,
  };
}
