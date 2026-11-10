/* CÁLCULO: MEI e Simples Nacional. Só contas, sem tocar na tela. */

export const LIMITE_MEI = 81000;

/* Cada faixa: [receita máxima em 12 meses, alíquota nominal %, parcela a deduzir] (LC 123/2006) */
export const ANEXOS = {
  I:   [[180e3, 4, 0],   [360e3, 7.3, 5940],  [720e3, 9.5, 13860],  [1.8e6, 10.7, 22500], [3.6e6, 14.3, 87300],  [4.8e6, 19, 378000]],
  II:  [[180e3, 4.5, 0], [360e3, 7.8, 5940],  [720e3, 10, 13860],   [1.8e6, 11.2, 22500], [3.6e6, 14.7, 85500],  [4.8e6, 30, 720000]],
  III: [[180e3, 6, 0],   [360e3, 11.2, 9360], [720e3, 13.5, 17640], [1.8e6, 16, 35640],   [3.6e6, 21, 125640],   [4.8e6, 33, 648000]],
};

/* atividade: 'mei-com' | 'mei-serv' | 'mei-ambos' */
export function calcularMei({ atividade, salarioMinimo, receitaMes, receita12 }) {
  const inss = salarioMinimo * 0.05;
  const extra = atividade === 'mei-com' ? 1 : atividade === 'mei-serv' ? 5 : 6;
  const das = inss + extra;
  const situacao = receita12 <= LIMITE_MEI * 0.8 ? 'dentro'
    : receita12 <= LIMITE_MEI ? 'perto'
    : receita12 <= LIMITE_MEI * 1.2 ? 'acima'
    : 'muito-acima';
  return {
    inss, extra, das, situacao,
    limite: LIMITE_MEI,
    uso: receita12 / LIMITE_MEI * 100,
    peso: receitaMes ? das / receitaMes * 100 : NaN,
  };
}

/* anexo: 'I' | 'II' | 'III' */
export function calcularSimples({ anexo, receitaMes, receita12 }) {
  const tabela = ANEXOS[anexo];
  const base = Math.max(receita12, 1);
  let f = tabela.findIndex(x => base <= x[0]);
  const acima = f < 0;
  if (acima) f = tabela.length - 1;
  const [, nominal, deducao] = tabela[f];
  const efetiva = receita12 > 0 ? Math.max(0, (base * nominal / 100 - deducao) / base * 100) : nominal;
  return { faixa: f + 1, acima, nominal, deducao, efetiva, das: receitaMes * efetiva / 100, noAno: receita12 * efetiva / 100 };
}
