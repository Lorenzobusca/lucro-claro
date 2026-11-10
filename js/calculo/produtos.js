/* CÁLCULO: margem de contribuição de vários produtos (custeio variável).
   Mostra quais produtos realmente deixam dinheiro e quais só giram. */

/* produtos: [{ nome, preco, custoVariavel, despesasVariaveis (% do preço), quantidade }] */
export function calcularProdutos(produtos, custosFixos) {
  const itens = produtos.map(p => {
    const margem = p.preco - p.custoVariavel - p.preco * p.despesasVariaveis / 100;
    return {
      nome: p.nome,
      margem,                                           /* quanto sobra de cada unidade vendida */
      margemPct: p.preco ? margem / p.preco * 100 : NaN,
      faturamento: p.preco * p.quantidade,
      contribuicao: margem * p.quantidade,              /* quanto o produto deixa no mês */
    };
  });
  const faturamento = itens.reduce((s, x) => s + x.faturamento, 0);
  const contribuicao = itens.reduce((s, x) => s + x.contribuicao, 0);
  itens.forEach(x => {
    x.parteDoFaturamento = faturamento ? x.faturamento / faturamento * 100 : NaN;
    x.parteDaContribuicao = contribuicao > 0 ? x.contribuicao / contribuicao * 100 : NaN;
  });

  const validos = itens.filter(x => x.faturamento > 0);
  const porMargem = [...validos].sort((a, b) => b.margemPct - a.margemPct);
  return {
    itens,
    faturamento,
    contribuicao,
    lucro: contribuicao - custosFixos,
    melhor: porMargem[0] || null,                       /* maior margem por real vendido */
    pior: porMargem.length > 1 ? porMargem[porMargem.length - 1] : null,
    negativos: validos.filter(x => x.margem < 0),
  };
}
