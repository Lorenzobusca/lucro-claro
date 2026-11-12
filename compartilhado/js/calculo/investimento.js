/* CÁLCULO: rendimento de um investimento, imposto de renda e ganho acima da inflação. */

/* Tabela regressiva do IR da renda fixa, em % */
export const aliquotaRegressiva = meses => {
  const dias = meses * 30;
  return dias <= 180 ? 22.5 : dias <= 360 ? 20 : dias <= 720 ? 17.5 : 15;
};

export const trAoAno = trDoMes => (Math.pow(1 + trDoMes / 100, 12) - 1) * 100;

/* Regra oficial da poupança: 0,5% ao mês + TR se a Selic passa de 8,5%; senão 70% da Selic + TR */
export function rendimentoPoupanca(selic, trDoMes) {
  const tr = trAoAno(trDoMes);
  return selic > 8.5 ? (Math.pow(1.005, 12) - 1) * 100 + tr : selic * 0.7 + tr;
}

/* tipo: 'cdb' | 'lci' | 'selic' | 'poup'. Devolve a taxa anual e de qual regra ela veio. */
export function taxaDoInvestimento({ tipo, selic, cdi, trDoMes, pctDoCdi }) {
  if (tipo === 'selic') return { taxa: selic, regra: 'selic' };
  if (tipo === 'poup') return { taxa: rendimentoPoupanca(selic, trDoMes), regra: selic > 8.5 ? 'poupanca-fixa' : 'poupanca-selic' };
  return { taxa: cdi * pctDoCdi / 100, regra: 'cdi' };
}

export function calcularInvestimento({ valor, meses, taxa, inflacao, tipo }) {
  const bruto = valor * Math.pow(1 + taxa / 100, meses / 12);
  const rendimento = bruto - valor;
  /* PENDENTE: hoje só o CDB paga IR aqui; o Tesouro Selic também deveria. Mantido como estava. */
  const ir = tipo === 'cdb' ? aliquotaRegressiva(meses) : 0;
  const liquido = valor + rendimento * (1 - ir / 100);
  const fator = Math.pow(1 + inflacao / 100, meses / 12);
  return {
    bruto, rendimento, ir, imposto: rendimento * ir / 100, liquido, fator,
    liquidoHoje: liquido / fator,
    ganhoReal: (liquido / fator / valor - 1) * 100,
    paradoHoje: valor / fator,
    perdaParado: valor - valor / fator,
  };
}
