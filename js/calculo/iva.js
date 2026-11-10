/* CÁLCULO: IBS e CBS (débito da venda menos crédito das compras). */

/* aliquota e reducao em %; cbs e ibs são as alíquotas do ano, usadas só para dividir o total entre os dois */
export function calcularIva({ venda, compra, aliquota, reducao, cbs, ibs }) {
  const fracaoCbs = cbs / ((cbs + ibs) || 1);
  const efetiva = aliquota * (1 - reducao / 100);
  const debito = venda * efetiva / 100;
  const credito = compra * aliquota / 100;
  const pagar = Math.max(0, debito - credito);
  const saldo = Math.max(0, credito - debito);
  return { efetiva, debito, credito, pagar, saldo, fracaoCbs, cbs: pagar * fracaoCbs, ibs: pagar * (1 - fracaoCbs), precoFinal: venda + debito };
}
