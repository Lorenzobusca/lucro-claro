/* UI: o que toda página usa. Tema claro/escuro, entrada de elementos na rolagem e taxas do dia na tela. */
import { $, pct, semMovimento } from './numero.js';
import { aoMudarTaxas, taxasChegaram, dataBR } from './taxas.js';
import './abas.js';
import './glossario.js';

/* ---------- Tema claro/escuro ---------- */
const raiz = document.documentElement, botaoTema = $('tema');
function rotuloDoTema() { botaoTema?.setAttribute('aria-label', raiz.dataset.theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'); }
botaoTema?.addEventListener('click', () => {
  raiz.dataset.theme = raiz.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('lc-tema', raiz.dataset.theme); } catch (e) {}
  rotuloDoTema();
});
/* Sem escolha salva, acompanha o tema do aparelho */
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  let salvo = null;
  try { salvo = localStorage.getItem('lc-tema'); } catch (err) {}
  if (!salvo) { raiz.dataset.theme = e.matches ? 'dark' : 'light'; rotuloDoTema(); }
});
rotuloDoTema();

/* ---------- Entrada na rolagem ---------- */
/* Só esconde o que está abaixo da tela; o que já aparece ao abrir fica parado. */
if (!semMovimento && 'IntersectionObserver' in window) {
  const olho = new IntersectionObserver(entradas => entradas.forEach(e => {
    if (e.isIntersecting) { e.target.classList.remove('pre'); olho.unobserve(e.target); }
  }), { threshold: .12 });
  document.querySelectorAll('.revelar').forEach(el => {
    const irmaos = [...el.parentElement.children].filter(x => x.classList.contains('revelar'));
    el.style.setProperty('--i', Math.min(irmaos.indexOf(el), 5));
    if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); olho.observe(el); }
  });
}

/* ---------- Taxas do dia na tela ---------- */
/* Qualquer elemento com data-rate="selic" recebe o valor; data-date recebe a data; .src[data-src] recebe a fonte. */
const camposDeTaxa = document.querySelectorAll('[data-rate]');
camposDeTaxa.forEach(el => el.classList.add('carregando'));
aoMudarTaxas(T => {
  if (taxasChegaram()) camposDeTaxa.forEach(el => el.classList.remove('carregando'));
  camposDeTaxa.forEach(el => { const t = T.taxas[el.dataset.rate]; if (t) el.textContent = pct(t.valor, 2); });
  document.querySelectorAll('[data-date]').forEach(el => { const t = T.taxas[el.dataset.date]; el.textContent = t?.data ? 'em ' + dataBR(t.data) : 'exemplo'; });
  document.querySelectorAll('.src[data-src]').forEach(el => { const t = T.taxas[el.dataset.src]; el.textContent = t?.data ? `Banco Central, ${dataBR(t.data)}` : 'valor de exemplo'; });
  const fonte = $('rates-src');
  if (!fonte) return;
  if (T.exemplo || !T.atualizado_em) {
    fonte.textContent = 'Valores de exemplo: a atualização automática pelo Banco Central ainda não rodou.';
    fonte.classList.add('stale');
  } else {
    const dias = (Date.now() - new Date(T.atualizado_em)) / 864e5;
    fonte.textContent = `Fonte: Banco Central do Brasil. Atualizado em ${new Date(T.atualizado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`;
    fonte.classList.toggle('stale', dias > 5);
  }
});
