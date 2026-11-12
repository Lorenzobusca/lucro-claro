/* CÁLCULO: termômetro do limite do MEI.
   Quanto do limite do ano já foi usado e, mantendo o ritmo, como o ano deve fechar. */
import { VALORES_LEGAIS, limiteMeiDoAno } from '../../config/valores-legais.js';

/* faturado: quanto vendeu no ano até agora (R$)
   mesAtual: 1 a 12 (meses do ano já contados, incluindo o atual)
   mesAbertura: 1 a 12 se o MEI abriu neste ano; 0 ou vazio se já existia antes
   ano: ano-calendário (para usar o limite certo) */
export function calcularLimite({ faturado, mesAtual, mesAbertura, ano }) {
  const limiteAnual = limiteMeiDoAno(ano);
  /* Quem abre no meio do ano tem limite proporcional: limite ÷ 12 × meses de atividade */
  const abriuNoAno = mesAbertura >= 1 && mesAbertura <= 12;
  const mesesAtivos = abriuNoAno ? 13 - mesAbertura : 12;
  const limite = limiteAnual / 12 * mesesAtivos;
  const mesesPassados = abriuNoAno ? Math.max(1, mesAtual - mesAbertura + 1) : Math.max(1, mesAtual);

  const uso = limite ? faturado / limite * 100 : NaN;
  const projecao = faturado / mesesPassados * mesesAtivos;
  const sobraNoAno = limite - faturado;
  const mesesRestantes = Math.max(0, mesesAtivos - mesesPassados);
  const tolerancia = 1 + VALORES_LEGAIS.toleranciaMei;

  const situacaoDe = v => v <= limite * 0.8 ? 'dentro' : v <= limite ? 'perto' : v <= limite * tolerancia ? 'acima' : 'muito-acima';
  return {
    limiteAnual, limite, mesesAtivos, mesesPassados, mesesRestantes,
    uso, projecao, sobraNoAno,
    porMesAteOFim: mesesRestantes > 0 ? Math.max(0, sobraNoAno) / mesesRestantes : NaN,
    situacao: situacaoDe(faturado),
    situacaoProjetada: situacaoDe(projecao),
    limiteProximoAno: limiteMeiDoAno((ano || new Date().getFullYear()) + 1),
  };
}
