/* PLANOS E ENDEREÇOS: preço, o que o plano grátis libera e os endereços dos dois sites.
   O preço aqui é só o que aparece na tela. O valor cobrado de verdade fica nas variáveis de ambiente
   PRECO_MENSAL e PRECO_ANUAL do Vercel (projeto do app). Mantenha os dois iguais. */

export const PLANOS = {
  /* null = preço ainda não definido: o site mostra "em breve" e o botão de assinar fica desligado */
  precoMensal: null,      /* ex.: 19.90 */
  precoAnual: null,       /* ex.: 199.00 */

  /* Dias de teste grátis sem cartão, ao criar a conta.
     Se mudar aqui, mude também em servidor/banco.sql (função criar_assinatura_inicial). */
  diasDeTeste: 14,

  /* O que o plano grátis libera */
  gratis: {
    metas: 2,              /* quantas metas ao mesmo tempo */
    mesesDeCaixa: 3,       /* quantos meses o fluxo de caixa projeta */
    produtos: 3,           /* quantos produtos na margem por produto */
  },
};

/* Ferramentas só do plano pago: id do painel → a frase que explica o ganho (aparece junto do cadeado) */
export const FERRAMENTAS_PAGAS = {
  'p-iva':      'Simule o IBS e a CBS de cada ano da reforma e saiba antes quanto o imposto vai mudar no seu preço.',
  'p-custeio':  'Descubra se o produto que parece dar lucro está, na verdade, dando prejuízo quando paga o que consome.',
  'p-perdas':   'Veja quanto o que estraga ou se perde tira do seu lucro, e quanto volta para o bolso evitando metade disso.',
  'p-zero':     'Reveja cada conta fixa do zero e descubra quanto dá para economizar no ano sem vender nada a mais.',
  'p-carteira': 'Veja quanto o dinheiro que você guarda todo mês pode valer daqui a alguns anos.',
};

/* Endereços. Em teste no computador (localhost), os links são trocados para as pastas /site e /app. */
export const ENDERECOS = {
  site: 'https://lastrion.com.br',
  app: 'https://app.lastrion.com.br',
};

/* WhatsApp de atendimento, só números com DDI e DDD (ex.: '5511999999999').
   Vazio = o botão de WhatsApp não aparece. */
export const WHATSAPP = '';
