/* UI: progresso da trilha "Comece por aqui", salvo no navegador (chave lc-trilha).
   Formato: { concluidas: [1, 3], atual: 2, diagnostico: {...}, retirada: 2000, inicio: '2026-11-10' } */
import { TOTAL_ETAPAS } from '../calculo/trilha.js';

const CHAVE = 'lc-trilha';

export function lerTrilha() {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE));
    if (d && Array.isArray(d.concluidas)) return d;
  } catch (e) {}
  return null;
}

export function salvarTrilha(d) {
  try { localStorage.setItem(CHAVE, JSON.stringify(d)); return true; } catch (e) { return false; }
}

export const novaTrilha = () => ({ concluidas: [], atual: 1, diagnostico: null, retirada: null, inicio: new Date().toISOString().slice(0, 10) });

/* Próxima etapa ainda não concluída a partir de uma dada (ou null se acabou) */
export function proximaPendente(d, aPartirDe = 1) {
  for (let n = aPartirDe; n <= TOTAL_ETAPAS; n++) if (!d.concluidas.includes(n)) return n;
  for (let n = 1; n < aPartirDe; n++) if (!d.concluidas.includes(n)) return n;
  return null;
}

export const trilhaCompleta = d => d.concluidas.filter(n => n >= 1 && n <= TOTAL_ETAPAS).length >= TOTAL_ETAPAS;
export const feitas = d => d.concluidas.filter(n => n >= 1 && n <= TOTAL_ETAPAS).length;
