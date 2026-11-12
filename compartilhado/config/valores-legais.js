/* VALORES LEGAIS: o único lugar com números que vêm da lei.
   Quando a lei mudar, altere aqui e atualize "conferido_em". Os dois sites e todas as calculadoras leem deste arquivo.
   O salário mínimo não fica aqui: ele chega sozinho do Banco Central (compartilhado/data/taxas.json). */

export const VALORES_LEGAIS = {
  conferido_em: '2026-11-12',

  /* Limite de faturamento do MEI por ano-calendário, em R$ */
  limiteMei: {
    2026: 81000,
    2027: 110000,
    2028: 140000,
  },
  limiteMeiFonte: 'LC 123/2006, art. 18-A, § 1º (R$ 81 mil). LC 238/2026, sancionada em 21/10/2026, eleva para R$ 110 mil em 2027 e R$ 140 mil em 2028.',
  /* [A CONFIRMAR] O texto do PLP 186/2026 no site do Planalto fala em vigência "1º de janeiro de 2028" para o art. 18-A,
     enquanto Senado e Agência Brasil dizem R$ 110 mil já em 2027. Confira no texto publicado no Diário Oficial antes de 1º/1/2027. */

  /* Quem passa do limite em até 20% paga a diferença e vira microempresa no ano seguinte;
     acima de 20%, o desenquadramento vale desde janeiro do ano em que passou. */
  toleranciaMei: 0.20,
  toleranciaFonte: 'LC 123/2006, art. 18-A, § 7º, III',

  /* DAS do MEI: 5% do salário mínimo (INSS) + R$ 1 de ICMS (comércio e indústria) e/ou R$ 5 de ISS (serviços) */
  dasMei: { inssPct: 5, icms: 1, iss: 5 },
  dasMeiFonte: 'LC 123/2006, art. 18-A, § 3º, V',

  /* Salário mínimo de reserva, usado só se o arquivo do Banco Central não carregar */
  salarioMinimoReserva: 1621,

  /* Limite do Simples Nacional (receita bruta em 12 meses) */
  limiteSimples: 4800000,
  limiteSimplesFonte: 'LC 123/2006, art. 3º, II',
};

/* Limite do MEI de um ano. Para anos sem valor cadastrado, usa o do ano mais recente. */
export function limiteMeiDoAno(ano = new Date().getFullYear()) {
  const anos = Object.keys(VALORES_LEGAIS.limiteMei).map(Number).sort((a, b) => a - b);
  const valido = anos.filter(a => a <= ano).pop() ?? anos[0];
  return VALORES_LEGAIS.limiteMei[valido];
}
