/* UI: taxas do Banco Central. Carrega data/taxas.json (atualizado todo dia útil pelo GitHub Actions)
   e avisa as telas quando os valores chegam. Enquanto isso, valem os valores de reserva abaixo. */

let T = {
  atualizado_em: null, exemplo: true,
  taxas: {
    selic: { valor: 15, data: null }, cdi: { valor: 14.9, data: null }, ipca_12m: { valor: 4.7, data: null },
    ipca_focus_12m: { valor: 4.3, data: null }, tr: { valor: 0.17, data: null }, salario_minimo: { valor: 1621, data: null },
  },
  reforma: { '2026': { cbs: .9, ibs: .1, nota: '' }, '2027': { cbs: 8.7, ibs: .1, nota: '' }, '2033': { cbs: 8.8, ibs: 17.7, nota: '' } },
};
let chegou = false;
const ouvintes = [];

export const taxas = () => T;
export const taxa = nome => T.taxas[nome]?.valor;
export const taxasChegaram = () => chegou;

/* "2026-11-06" vira "06/11/2026". Datas de vigência futura mostram o dia da atualização. */
export function dataBR(d) {
  if (!d) return '';
  if (T.atualizado_em && String(d).slice(0, 10) > T.atualizado_em.slice(0, 10)) d = T.atualizado_em;
  const [ano, mes, dia] = String(d).slice(0, 10).split('-');
  return dia ? `${dia}/${mes}/${ano}` : `${mes}/${ano}`;
}

/* Chama a função agora (com os valores de reserva) e de novo quando o arquivo chegar */
export function aoMudarTaxas(fn) { ouvintes.push(fn); fn(T); }

fetch(new URL('../../data/taxas.json', import.meta.url), { cache: 'no-cache' })
  .then(r => r.ok ? r.json() : Promise.reject())
  .then(j => { T = j; })
  .catch(() => {})
  .finally(() => { chegou = true; ouvintes.forEach(fn => fn(T)); });
