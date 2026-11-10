/* UI: apoio às ferramentas.
   1) Exemplo preenchido: um link como custeio.html?ex=padaria#produtos abre a ferramenta já com os números do exemplo.
   2) Leitura do resultado: uma frase em linguagem simples e o próximo passo, abaixo de cada cálculo. */
import { $ } from './numero.js';

const exemploPedido = new URLSearchParams(location.search).get('ex');

/* exemplos: { chave: { nome, campos: { idDoCampo: valor } } }
   Preenche os campos se o link pediu um desses exemplos e mostra a faixa "Exemplo ilustrativo".
   Chame antes do primeiro cálculo da tela. */
export function aplicarExemplo(exemplos, idDaFaixa) {
  const exemplo = exemplos[exemploPedido];
  if (!exemplo) return null;
  Object.entries(exemplo.campos).forEach(([id, valor]) => { const campo = $(id); if (campo) campo.value = valor; });
  const faixa = $(idDaFaixa);
  if (faixa) {
    faixa.hidden = false;
    faixa.innerHTML = `<b>Exemplo ilustrativo:</b> ${exemplo.nome}. Os números são inventados para mostrar a conta. Troque pelos seus.`;
  }
  return exemplo;
}

const SETA = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* Escreve a leitura do resultado.
   tom: 'ok' | 'warn' | 'bad' (sempre acompanhado do texto, nunca só a cor)
   passo: { texto, href } (opcional) */
export function mostrarLeitura(id, { tom = 'ok', texto, passo }) {
  const el = $(id);
  if (!el) return;
  el.dataset.tom = tom;
  el.innerHTML = `<span class="leitura-rotulo">O que isso quer dizer</span><p>${texto}</p>` +
    (passo ? `<a class="leitura-passo" href="${passo.href}">${passo.texto}${SETA}</a>` : '');
}
