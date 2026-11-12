/* CÁLCULO: simulador de carteira (vários investimentos, aporte mensal, IR no resgate). */
import { aliquotaRegressiva } from './investimento.js';

/* ir: 'isento' | 'regressivo' | 'acoes' */
export const ATIVOS = [
  { k: 'poup',  ir: 'isento' },
  { k: 'selic', ir: 'regressivo' },
  { k: 'cdb',   ir: 'regressivo' },
  { k: 'lci',   ir: 'isento' },
  { k: 'ipca',  ir: 'regressivo' },
  { k: 'fii',   ir: 'isento' },
  { k: 'acoes', ir: 'acoes' },
];

/* Carteiras prontas, em % de cada ativo */
export const CARTEIRAS = {
  conservadora: { poup: 0, selic: 40, cdb: 20, lci: 20, ipca: 20, fii: 0,  acoes: 0 },
  moderada:     { poup: 0, selic: 20, cdb: 15, lci: 15, ipca: 25, fii: 10, acoes: 15 },
  arrojada:     { poup: 0, selic: 10, cdb: 10, lci: 0,  ipca: 20, fii: 20, acoes: 40 },
};

/* Hipóteses de rendimento anual (%) para o que não tem taxa oficial */
export const HIPOTESES = { ipcaReal: 7, fii: 12, acoes: 14 };

export const aliquotaDoAtivo = (ir, meses) => ir === 'isento' ? 0 : ir === 'acoes' ? 15 : aliquotaRegressiva(meses);

/* pesos somam 1; taxas em % ao ano; devolve o valor líquido no fim de cada ano */
export function simular(pesos, taxas, inicial, aporte, meses) {
  const st = ATIVOS.map((a, i) => ({ a, w: pesos[i], rm: Math.pow(1 + taxas[i] / 100, 1 / 12) - 1, bal: inicial * pesos[i], inv: inicial * pesos[i] }));
  const liquidoEm = m => st.reduce((s, x) => s + x.bal - Math.max(0, x.bal - x.inv) * aliquotaDoAtivo(x.a.ir, m) / 100, 0);
  const porAno = [liquidoEm(0)];
  for (let m = 1; m <= meses; m++) {
    st.forEach(x => { x.bal = x.bal * (1 + x.rm) + aporte * x.w; x.inv += aporte * x.w; });
    if (m % 12 === 0 || m === meses) porAno.push(liquidoEm(m));
  }
  return { porAno, bruto: st.reduce((s, x) => s + x.bal, 0), investido: st.reduce((s, x) => s + x.inv, 0), liquido: liquidoEm(meses) };
}

/* percentuais e taxas: listas na ordem de ATIVOS */
export function calcularCarteira({ inicial, aporte, anos, inflacao, percentuais, taxas }) {
  anos = Math.max(1, Math.min(50, Math.round(anos)));
  const meses = anos * 12;
  const p = percentuais.map(v => Math.max(0, v));
  const soma = p.reduce((a, b) => a + b, 0);
  const pesos = p.map(v => soma ? v / soma : 0);
  const carteira = simular(pesos, taxas, inicial, aporte, meses);
  const poupanca = simular(ATIVOS.map(a => a.k === 'poup' ? 1 : 0), taxas, inicial, aporte, meses);
  const serie = carteira.porAno.map((v, i) => ({
    ano: Math.min(i, anos), cart: v, poup: poupanca.porAno[i], inv: inicial + aporte * Math.min(i * 12, meses),
    cartHoje: v / Math.pow(1 + inflacao / 100, Math.min(i, anos)),
  }));
  return {
    anos, soma, somaOk: Math.abs(soma - 100) <= 0.01, carteira, poupanca, serie,
    fator: Math.pow(1 + inflacao / 100, anos),
    taxaMedia: pesos.reduce((s, w, i) => s + w * taxas[i], 0),
  };
}
