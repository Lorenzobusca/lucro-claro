/* CÁLCULO: fluxo de caixa projetado.
   Mostra o saldo no fim de cada mês e avisa quando o dinheiro falta,
   mesmo que o período inteiro feche no positivo. */

/* meses: [{ entradas, saidas }]
   retirada: valor fixo que o dono tira por mês (pró-labore), separado das contas da empresa */
export function calcularCaixa({ saldoInicial, retirada, meses }) {
  let saldo = saldoInicial;
  const linhas = meses.map((m, i) => {
    const resultado = m.entradas - m.saidas - retirada;
    saldo += resultado;
    return { mes: i + 1, entradas: m.entradas, saidas: m.saidas, retirada, resultado, saldo };
  });

  const negativos = linhas.filter(l => l.saldo < 0);
  const pior = linhas.reduce((a, l) => (l.saldo < a.saldo ? l : a), linhas[0]);
  const totalEntradas = linhas.reduce((s, l) => s + l.entradas, 0);
  const totalSaidas = linhas.reduce((s, l) => s + l.saidas + l.retirada, 0);
  return {
    linhas,
    saldoFinal: saldo,
    resultadoDoPeriodo: totalEntradas - totalSaidas,
    primeiroNegativo: negativos[0] || null,
    mesesNegativos: negativos.length,
    pior,                                               /* mês de menor saldo */
    folgaNecessaria: pior && pior.saldo < 0 ? -pior.saldo : 0,
  };
}
