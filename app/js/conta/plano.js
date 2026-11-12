/* CONTA: cadeados do plano grátis.
   - Ferramenta inteira do plano completo: a aba ganha um cadeado e o painel mostra a frase do ganho
     (texto em compartilhado/config/planos.js → FERRAMENTAS_PAGAS) com o botão para assinar.
   - Parte de uma ferramenta (linhas a mais de uma tabela, meses anteriores): o elemento tem o atributo
     data-pago="frase do ganho" e fica desligado, com um cadeado ao lado.
   O que o plano libera de verdade é conferido também no servidor (servidor/banco.sql). */
import { plano } from '../../../compartilhado/js/ui/plano-atual.js';
import { FERRAMENTAS_PAGAS, PLANOS } from '../../../compartilhado/config/planos.js';

const CADEADO = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
export const iconeCadeado = CADEADO;

export function aplicarCadeados() {
  if (plano.pago) return;

  /* Ferramentas inteiras */
  Object.entries(FERRAMENTAS_PAGAS).forEach(([id, ganho]) => {
    const painel = document.getElementById(id);
    if (!painel) return;
    const aba = document.querySelector(`[aria-controls="${id}"]`);
    if (aba && !aba.querySelector('.cadeado-ico')) {
      aba.insertAdjacentHTML('beforeend', `<span class="cadeado-ico">${CADEADO}</span>`);
      aba.setAttribute('aria-label', `${aba.textContent.trim()} (plano completo)`);
    }
    painel.classList.add('travado');
    [...painel.children].forEach(filho => filho.setAttribute('inert', ''));
    painel.insertAdjacentHTML('afterbegin', `
      <div class="cadeado-card">
        <span class="cadeado-selo">${CADEADO}Plano completo</span>
        <p>${ganho}</p>
        <a class="btn primary" href="assinatura.html">Ver o plano completo</a>
      </div>`);
  });

  /* Limites do plano grátis que vêm de compartilhado/config/planos.js */
  const { mesesDeCaixa, produtos } = PLANOS.gratis;
  document.querySelectorAll('#p-caixa tbody tr').forEach((tr, i) => {
    if (i >= mesesDeCaixa) tr.dataset.pago = `No plano grátis o caixa projeta ${mesesDeCaixa} meses. No completo, até 12.`;
  });
  document.querySelectorAll('#p-produtos tbody tr').forEach((tr, i) => {
    if (i >= produtos) tr.dataset.pago = `No plano grátis dá para comparar ${produtos} produtos. No completo, quantos quiser.`;
  });
  const anterior = document.getElementById('g-prev');
  if (anterior) {
    anterior.dataset.pago = 'Ver os meses anteriores das metas é do plano completo.';
    anterior.dataset.pagoOnde = 'g-placar';
  }

  /* Partes de ferramentas */
  document.querySelectorAll('[data-pago]').forEach(el => {
    el.classList.add('parte-travada');
    el.querySelectorAll('input, select, button').forEach(c => { c.disabled = true; });
    if (el.matches('input, select, button')) el.disabled = true;
    const aviso = document.createElement('a');
    aviso.className = 'cadeado-linha';
    aviso.href = 'assinatura.html';
    aviso.innerHTML = `${CADEADO}<span>${el.dataset.pago}</span>`;
    if (el.matches('tr')) {
      /* numa tabela, o aviso aparece uma vez, logo antes da primeira linha travada */
      if (el.previousElementSibling?.hasAttribute('data-pago')) return;
      const linha = document.createElement('tr');
      linha.className = 'cadeado-tr';
      linha.innerHTML = `<td colspan="${el.children.length}"></td>`;
      linha.firstChild.append(aviso);
      el.before(linha);
    } else if (el.dataset.pagoOnde) {
      /* botões pequenos: o aviso vai para um lugar com espaço, indicado em data-pago-onde */
      el.title = el.dataset.pago;
      document.getElementById(el.dataset.pagoOnde)?.after(aviso);
    } else {
      el.after(aviso);
    }
  });
}
