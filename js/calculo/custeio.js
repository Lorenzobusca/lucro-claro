/* CÁLCULO: custeio por absorção × custeio ABC. */

/* produtos: [{ qtd, preco, direto, horas, setups, inspecoes }]
   custos:   { setup, inspecao, maquina }  (custos indiretos do mês) */
export function calcularCusteio(produtos, { setup, inspecao, maquina }) {
  const indiretos = setup + inspecao + maquina;
  const horasTotais = produtos.reduce((a, x) => a + x.qtd * x.horas, 0);
  const setupsTotais = produtos.reduce((a, x) => a + x.setups, 0);
  const inspecoesTotais = produtos.reduce((a, x) => a + x.inspecoes, 0);

  const itens = produtos.map(x => {
    const absorcao = x.direto + (horasTotais ? indiretos * x.horas / horasTotais : 0);
    const abc = x.direto + (x.qtd ? (
      (setupsTotais ? setup * x.setups / setupsTotais : 0) +
      (inspecoesTotais ? inspecao * x.inspecoes / inspecoesTotais : 0) +
      (horasTotais ? maquina * x.qtd * x.horas / horasTotais : 0)
    ) / x.qtd : 0);
    return { absorcao, abc, lucroAbsorcao: x.preco - absorcao, lucroAbc: x.preco - abc };
  });

  /* Qual produto a absorção mais subestima (comparação entre os dois primeiros) */
  const maisSubestimado = itens[1].abc - itens[1].absorcao > itens[0].abc - itens[0].absorcao ? 1 : 0;
  return {
    itens,
    totalAbsorcao: itens.reduce((a, r, j) => a + r.lucroAbsorcao * produtos[j].qtd, 0),
    totalAbc: itens.reduce((a, r, j) => a + r.lucroAbc * produtos[j].qtd, 0),
    maisSubestimado,
    diferenca: itens[maisSubestimado].abc - itens[maisSubestimado].absorcao,
  };
}
