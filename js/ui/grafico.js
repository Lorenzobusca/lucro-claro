/* UI: gráfico de linhas ano a ano, com valor ao passar o mouse ou o dedo.
   serie: [{ ano, cart, poup, inv }]. As cores vêm de --chart-1 e --chart-2 (css/tokens.css). */
import { brl } from './numero.js';

const valorCurto = v => v >= 1e6 ? 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi'
  : v >= 1e3 ? 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil'
  : 'R$ ' + Math.round(v);

const PASSOS = [1, 2, 5].flatMap(m => [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8].map(e => m * e)).sort((a, b) => a - b);

export function desenharLinhas(caixa, serie) {
  if (!caixa || !serie.length || !caixa.clientWidth) return;
  const W = Math.max(280, caixa.clientWidth), H = caixa.clientHeight || 300;
  const esq = 66, dir = W < 520 ? 16 : 112, topo = 14, base = 28;
  const maxY = Math.max(...serie.map(r => Math.max(r.cart, r.poup, r.inv))) * 1.06 || 1, fim = serie.length - 1 || 1;
  const passo = PASSOS.find(s => maxY / s <= 5);
  const X = i => esq + (W - esq - dir) * i / fim, Y = v => topo + (H - topo - base) * (1 - v / maxY);
  const caminho = k => serie.map((r, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(r[k]).toFixed(1)}`).join('');

  let fundo = '';
  for (let v = 0; v <= maxY; v += passo) fundo += `<line class="grid" x1="${esq}" x2="${W - dir}" y1="${Y(v)}" y2="${Y(v)}"/><text class="axis" x="${esq - 8}" y="${Y(v) + 4}" text-anchor="end">${v ? valorCurto(v) : 'R$ 0'}</text>`;
  const pulo = Math.ceil(serie.length / (W < 520 ? 5 : 10));
  serie.forEach((r, i) => { if ((i % pulo === 0 && fim - i >= pulo * 0.6) || i === fim) fundo += `<text class="axis" x="${X(i)}" y="${H - 8}" text-anchor="middle">${r.ano === 0 ? 'Hoje' : r.ano + 'a'}</text>`; });

  const ultimo = serie[fim], rotulos = [['cart', 'Sua carteira'], ['poup', 'Poupança']];
  let pontas = '';
  if (W >= 520) {
    let ys = rotulos.map(([k]) => Y(ultimo[k]));
    if (Math.abs(ys[0] - ys[1]) < 16) { const m = (ys[0] + ys[1]) / 2, s = ys[0] < ys[1] ? -1 : 1; ys = [m + 8 * s, m - 8 * s]; }
    rotulos.forEach(([, t], j) => pontas += `<text class="lbl" x="${X(fim) + 12}" y="${ys[j] + 4}">${t}</text>`);
  }
  const bolinha = (extra, cor) => `<circle ${extra} r="4.5" fill="var(--chart-${cor})" stroke="var(--out-bg)" stroke-width="2"/>`;

  caixa.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${fundo}
    <path d="${caminho('inv')}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 3"/>
    <path class="linha" pathLength="1" d="${caminho('poup')}" fill="none" stroke="var(--chart-2)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <path class="linha" pathLength="1" d="${caminho('cart')}" fill="none" stroke="var(--chart-1)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${bolinha(`cx="${X(fim)}" cy="${Y(ultimo.poup)}"`, 2)}${bolinha(`cx="${X(fim)}" cy="${Y(ultimo.cart)}"`, 1)}
    ${pontas}<line class="cross" data-g="x" y1="${topo}" y2="${H - base}" visibility="hidden"/>
    ${bolinha('data-g="p1" visibility="hidden"', 1)}${bolinha('data-g="p2" visibility="hidden"', 2)}
    <rect data-g="area" x="${esq}" y="0" width="${W - esq - dir}" height="${H}" fill="transparent"/></svg><div class="tip" hidden></div>`;

  const g = n => caixa.querySelector(`[data-g="${n}"]`);
  const area = g('area'), linha = g('x'), p1 = g('p1'), p2 = g('p2'), dica = caixa.querySelector('.tip');
  const mostrar = e => {
    const cx = e.clientX - caixa.getBoundingClientRect().left;
    const i = Math.max(0, Math.min(fim, Math.round((cx - esq) / (W - esq - dir) * fim))), d = serie[i];
    linha.setAttribute('x1', X(i)); linha.setAttribute('x2', X(i));
    p1.setAttribute('cx', X(i)); p1.setAttribute('cy', Y(d.cart));
    p2.setAttribute('cx', X(i)); p2.setAttribute('cy', Y(d.poup));
    [linha, p1, p2].forEach(el => el.setAttribute('visibility', 'visible'));
    dica.innerHTML = `<b>${d.ano === 0 ? 'Hoje' : 'Daqui a ' + d.ano + (d.ano === 1 ? ' ano' : ' anos')}</b>
      <div><span><i style="background:var(--chart-1)"></i>Sua carteira</span><span class="num">${brl(d.cart)}</span></div>
      <div><span><i style="background:var(--chart-2)"></i>Poupança</span><span class="num">${brl(d.poup)}</span></div>
      <div><span><i style="background:var(--muted)"></i>Guardado</span><span class="num">${brl(d.inv)}</span></div>`;
    dica.hidden = false;
    let x = X(i) + 14;
    if (x + dica.offsetWidth > W) x = X(i) - dica.offsetWidth - 14;
    dica.style.left = Math.max(0, x) + 'px';
    dica.style.top = Math.max(0, Math.min(Y(d.cart), H - dica.offsetHeight) - 10) + 'px';
  };
  const esconder = () => { dica.hidden = true; [linha, p1, p2].forEach(el => el.setAttribute('visibility', 'hidden')); };
  area.addEventListener('pointermove', mostrar);
  area.addEventListener('pointerdown', mostrar);
  area.addEventListener('pointerleave', esconder);
}
