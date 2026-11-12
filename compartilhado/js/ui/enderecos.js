/* UI: links entre os dois sites.
   No ar, o site é lastrion.com.br e o app é app.lastrion.com.br.
   No computador (Live Server aberto na pasta do projeto), os dois viram as pastas /site e /app. */
import { ENDERECOS } from '../../config/planos.js';

export const local = ['localhost', '127.0.0.1', ''].includes(location.hostname);

/* Endereço completo de uma página do app ou do site. Ex.: endereco('app', 'entrar.html?calc=limite') */
export function endereco(qual, caminho = '') {
  const base = local ? `${location.origin}/${qual}` : ENDERECOS[qual];
  return `${base}/${caminho.replace(/^\//, '')}`;
}

/* Troca os links escritos com o endereço de produção pelos locais, quando estiver testando no computador */
export function ajustarLinks(raiz = document) {
  if (!local) return;
  raiz.querySelectorAll('a[href^="https://app.lastrion.com.br"], a[href^="https://lastrion.com.br"]').forEach(a => {
    a.href = a.getAttribute('href')
      .replace('https://app.lastrion.com.br', `${location.origin}/app`)
      .replace('https://lastrion.com.br', `${location.origin}/site`);
  });
}
