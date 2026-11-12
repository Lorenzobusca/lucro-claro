/* CÁLCULO: quanto o MEI pode tirar para si no mês sem deixar o negócio sem dinheiro.
   Usado na calculadora grátis do site e levado para o app quando a pessoa cria a conta. */
import { VALORES_LEGAIS } from '../../config/valores-legais.js';

/* DAS do MEI no mês. atividade: 'mei-com' | 'mei-serv' | 'mei-ambos' */
export function dasDoMei(atividade, salarioMinimo) {
  const { inssPct, icms, iss } = VALORES_LEGAIS.dasMei;
  const extra = atividade === 'mei-com' ? icms : atividade === 'mei-serv' ? iss : icms + iss;
  return salarioMinimo * inssPct / 100 + extra;
}

/* vendas: tudo o que entrou de vendas no mês (R$)
   gastos: o que o negócio gastou no mês, sem contar o DAS (mercadoria, material, aluguel, gasolina…)
   reservaPct: parte do que sobra que fica no negócio para emergência e para crescer (%) */
export function calcularRetirada({ vendas, gastos, atividade, salarioMinimo, reservaPct }) {
  const das = dasDoMei(atividade, salarioMinimo);
  const sobra = vendas - gastos - das;
  const reserva = Math.max(0, sobra) * reservaPct / 100;
  const podeTirar = Math.max(0, sobra - reserva);
  return {
    das,
    sobra,                 /* o que o negócio deixou no mês, depois de pagar tudo */
    reserva,               /* o que fica guardado no negócio */
    podeTirar,             /* o que dá para levar para casa */
    falta: sobra < 0 ? -sobra : 0,
    parteDasVendas: vendas > 0 ? podeTirar / vendas * 100 : NaN,
  };
}
