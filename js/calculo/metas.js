/* CÁLCULO: orçamento e metas (ritmo, projeção e situação de cada meta). */

export const LIMITE_GRATIS = 5;

export const dataIso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const mesDe = d => dataIso(d).slice(0, 7);
export const mesVizinho = (mes, passo) => { const [a, b] = mes.split('-').map(Number); return mesDe(new Date(a, b - 1 + passo, 1)); };

/* Quanto do mês já passou: 0 (não começou) a 1 (fechado) */
export function ritmoDoMes(mes, hoje) {
  const atual = mesDe(hoje);
  if (mes < atual) return 1;
  if (mes > atual) return 0;
  const [a, b] = mes.split('-').map(Number);
  return hoje.getDate() / new Date(a, b, 0).getDate();
}

/* meta: { id, tipo: 'min' | 'max', alvo }. classe: 'ok' | 'warn' | 'bad' */
export function situacaoDaMeta(meta, lancamentos, mes, hoje) {
  const atual = mesDe(hoje);
  const real = lancamentos.filter(l => l.meta === meta.id && l.data.slice(0, 7) === mes).reduce((s, l) => s + l.valor, 0);
  const ritmo = ritmoDoMes(mes, hoje);
  const p = meta.alvo ? real / meta.alvo : 0;
  const fechado = mes < atual, futuro = mes > atual;
  const projecao = mes === atual && ritmo > 0 ? real / ritmo : null;
  let texto, classe;
  if (meta.tipo === 'min') {
    if (p >= 1) { texto = 'Meta atingida'; classe = 'ok'; }
    else if (fechado) { texto = 'Não atingida'; classe = 'bad'; }
    else if (futuro) { texto = 'Ainda não começou'; classe = 'warn'; }
    else if (p >= ritmo * .95) { texto = 'No ritmo'; classe = 'ok'; }
    else { texto = 'Atrasada'; classe = 'bad'; }
  } else {
    if (p > 1) { texto = 'Estourou o limite'; classe = 'bad'; }
    else if (fechado) { texto = 'Dentro do limite'; classe = 'ok'; }
    else if (futuro) { texto = 'Ainda não começou'; classe = 'warn'; }
    else if (p > ritmo * 1.05) { texto = 'Gastando rápido demais'; classe = 'warn'; }
    else { texto = 'Dentro do limite'; classe = 'ok'; }
  }
  return { real, p, ritmo, projecao, texto, classe };
}

/* Metas de demonstração, mostradas na primeira visita */
export function metasDeExemplo(hoje) {
  const dias = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const ritmo = hoje.getDate() / dias, d = dataIso(hoje);
  const metas = [
    { id: 'ex1', nome: 'Faturamento do mês', tipo: 'min', alvo: 60000, un: 'R$' },
    { id: 'ex2', nome: 'Mesas produzidas', tipo: 'min', alvo: 460, un: 'un' },
    { id: 'ex3', nome: 'Gasto com matéria-prima', tipo: 'max', alvo: 22000, un: 'R$' },
  ];
  const f = { ex1: 1.06, ex2: .78, ex3: 1.12 };
  return { exemplo: true, metas, lanc: metas.map(m => ({ id: 'l' + m.id, meta: m.id, data: d, valor: Math.round(m.alvo * ritmo * f[m.id]), obs: 'Exemplo' })) };
}
