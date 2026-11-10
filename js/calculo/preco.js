/* CÁLCULO: formação de preço por markup.
   O preço precisa cobrir o custo do produto, as despesas que variam com a venda,
   a parte dos custos fixos e ainda deixar o lucro desejado. */

/* Todos os percentuais são sobre o preço de venda.
   custo: custo de comprar ou produzir uma unidade (R$) */
export function calcularPreco({ custo, despesasVariaveis, custosFixos, lucro, precoConcorrente }) {
  const soma = despesasVariaveis + custosFixos + lucro;
  const possivel = soma < 100 && custo > 0;
  const preco = possivel ? custo / (1 - soma / 100) : NaN;

  /* Quanto sobra se vender pelo preço do concorrente, com os mesmos percentuais de despesa e custo fixo */
  const temConcorrente = precoConcorrente > 0;
  const sobraNoConcorrente = temConcorrente
    ? precoConcorrente * (1 - (despesasVariaveis + custosFixos) / 100) - custo
    : NaN;

  return {
    possivel,
    soma,
    preco,
    markup: possivel ? preco / custo : NaN,              /* por quanto multiplicar o custo */
    emDespesas: possivel ? preco * despesasVariaveis / 100 : NaN,
    emFixos: possivel ? preco * custosFixos / 100 : NaN,
    emLucro: possivel ? preco * lucro / 100 : NaN,
    temConcorrente,
    sobraNoConcorrente,
    sobraNoConcorrentePct: temConcorrente ? sobraNoConcorrente / precoConcorrente * 100 : NaN,
  };
}
