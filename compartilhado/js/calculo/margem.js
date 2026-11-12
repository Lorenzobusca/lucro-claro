/* CÁLCULO: margem de contribuição e ponto de equilíbrio. */

/* despesasVariaveis em % do preço */
export function calcularMargem({ preco, custoVariavel, despesasVariaveis, custosFixos, quantidade }) {
  const margem = preco - custoVariavel - preco * despesasVariaveis / 100;
  const equilibrio = margem > 0 ? custosFixos / margem : Infinity;
  return {
    margem,
    margemPct: preco ? margem / preco * 100 : NaN,
    equilibrio,
    lucro: margem * quantidade - custosFixos,
    faturamentoEquilibrio: isFinite(equilibrio) ? Math.ceil(equilibrio) * preco : NaN,
    seguranca: isFinite(equilibrio) && quantidade ? (quantidade - equilibrio) / quantidade * 100 : NaN,
  };
}
