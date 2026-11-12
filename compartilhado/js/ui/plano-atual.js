/* UI: o plano de quem está usando agora (grátis ou completo).
   No app, js/conta/iniciar.js preenche isto antes de abrir as ferramentas.
   Fora do app (ou em modo demonstração), vale o plano completo. */
import { PLANOS } from '../../config/planos.js';

export const plano = {
  pago: true,
  situacao: 'demonstracao',   /* 'demonstracao' | 'teste' | 'ativa' | 'atrasada' | 'cancelada' | 'gratis' */
};

/* Limite do plano grátis para um recurso ('metas', 'mesesDeCaixa', 'produtos'); sem limite no completo */
export const limite = nome => plano.pago ? Infinity : PLANOS.gratis[nome];
