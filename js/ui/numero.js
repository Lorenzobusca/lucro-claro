/* UI: ler números dos campos, formatar em reais e porcentagem, e mostrar resultados com animação. */

export const $ = id => document.getElementById(id);

export const brl = v => isFinite(v) ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
export const pct = (v, casas = 2) => isFinite(v) ? v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + '%' : '—';

/* Aceita "1.234,56", "1234.56" e "R$ 1.234,56". Devolve NaN se não for número. */
export function numeroDe(texto) {
  const s = String(texto).trim().replace(/\s|R\$/g, '');
  const v = parseFloat(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
  return isFinite(v) ? v : NaN;
}

/* Valor de um campo pelo id; campo vazio ou inválido conta como zero */
export const ler = id => { const v = numeroDe($(id).value); return isFinite(v) ? v : 0; };

/* Preenche um campo com um número (até 2 casas) */
export const preencher = (id, v) => { const el = $(id); if (el && v != null && isFinite(v)) el.value = String(+v.toFixed(2)); };

/* Lista "rótulo: valor" dos cartões de resultado */
export const linhas = pares => pares.map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join('');

export const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Mostra um número "contando" do valor anterior até o novo.
   Leitores de tela recebem só o valor final (o texto animado fica escondido deles). */
export function mostrarNumero(el, valor, formatar) {
  const fim = formatar(valor);
  el.dataset.final = fim;
  if (!el._visivel) {
    el.innerHTML = '<span aria-hidden="true"></span><span class="sr-only"></span>';
    [el._visivel, el._leitor] = el.children;
  }
  el._leitor.textContent = fim;
  const de = el._valor;
  el._valor = valor;
  cancelAnimationFrame(el._quadro);
  if (semMovimento || !isFinite(valor) || !isFinite(de) || de === valor) { el._visivel.textContent = fim; return; }
  const inicio = performance.now(), duracao = 450;
  const passo = agora => {
    const k = Math.min(1, (agora - inicio) / duracao), suave = 1 - Math.pow(1 - k, 3);
    el._visivel.textContent = k < 1 ? formatar(de + (valor - de) * suave) : fim;
    if (k < 1) el._quadro = requestAnimationFrame(passo);
  };
  el._quadro = requestAnimationFrame(passo);
}
