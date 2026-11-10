/* CÁLCULO: perdas e desperdício.
   O que estraga, vence ou some do estoque já foi pago: sai direto do lucro. */

/* perdaMensal: valor de custo do que se perde por mês (R$)
   margemPct: margem de contribuição média (% do preço)
   faturamento: vendas do mês (R$)
   reducao: quanto da perda a pessoa acha que consegue evitar (%) */
export function calcularPerdas({ perdaMensal, margemPct, faturamento, reducao }) {
  const temMargem = margemPct > 0;
  const recuperado = perdaMensal * reducao / 100;
  return {
    perdaAnual: perdaMensal * 12,
    parteDoFaturamento: faturamento ? perdaMensal / faturamento * 100 : NaN,
    /* Para repor R$ 1 de perda é preciso vender R$ 1 ÷ margem */
    vendasParaCompensar: temMargem ? perdaMensal / (margemPct / 100) : NaN,
    recuperadoMes: recuperado,
    recuperadoAno: recuperado * 12,
  };
}
