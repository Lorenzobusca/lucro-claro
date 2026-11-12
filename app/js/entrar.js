/* TELA: entrar ou criar conta (app/entrar.html). Sem senha: link + código por e-mail, ou Google. */
import { configurado, enviarAcesso, confirmarCodigo, entrarComGoogle, lerRetorno, sessaoValida } from './conta/supabase.js';
import { guardarChegadaDoEndereco } from './conta/chegada.js';
import { ajustarLinks } from '../../compartilhado/js/ui/enderecos.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
ajustarLinks();

/* Para onde ir depois de entrar. Só aceita páginas deste app (nada de endereço de fora). */
const voltaPedida = params.get('volta') || '';
const volta = /^[a-z-]+\.html([?#].*)?$/.test(voltaPedida) ? voltaPedida : 'index.html';

/* Cálculo trazido do site: fica no aparelho e vai junto no link do e-mail */
const chegada = guardarChegadaDoEndereco();
const pastaDoApp = location.href.replace(/[^/]*([?#].*)?$/, '');
const destinoDoLink = pastaDoApp + 'index.html' + (chegada ? '?' + chegada : '');

function avisar(texto, tom = 'erro') {
  const a = $('aviso');
  a.hidden = !texto;
  a.dataset.tom = tom;
  a.textContent = texto;
}
const ocupado = (botao, sim, texto) => { botao.disabled = sim; if (texto) botao.textContent = texto; };

async function comecar() {
  if (params.get('erro')) avisar(params.get('erro'));
  if (!configurado) {
    avisar('O login ainda não foi configurado neste endereço. Você pode testar as ferramentas no modo demonstração: os números ficam só neste aparelho.', 'aviso');
    $('form-email').hidden = true;
    $('botao-google').outerHTML = `<a class="btn primary largo" href="index.html${chegada ? '?' + chegada : ''}">Abrir em modo demonstração</a>`;
    document.querySelector('.ou').hidden = true;
    return;
  }
  try {
    if (await lerRetorno() || await sessaoValida()) { location.replace(volta); return; }
  } catch (e) { avisar(e.message); }
}

/* ---------- Passo 1: e-mail ---------- */
let email = '', espera;
async function mandar() {
  const botao = $('botao-email');
  ocupado(botao, true, 'Enviando…');
  try {
    await enviarAcesso(email, destinoDoLink);
    $('email-enviado').textContent = email;
    $('passo-email').hidden = true;
    $('passo-codigo').hidden = false;
    avisar('');
    $('codigo').focus();
    /* Reenviar só depois de 60 segundos */
    let s = 60;
    const reenviar = $('reenviar');
    reenviar.disabled = true;
    clearInterval(espera);
    espera = setInterval(() => {
      s--;
      reenviar.textContent = s > 0 ? `Reenviar em ${s}s` : 'Reenviar';
      if (s <= 0) { clearInterval(espera); reenviar.disabled = false; }
    }, 1000);
  } catch (e) {
    avisar(e.message);
  } finally {
    ocupado(botao, false, 'Receber link de acesso');
  }
}

$('form-email').addEventListener('submit', e => {
  e.preventDefault();
  email = $('email').value.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { avisar('Esse e-mail não parece certo. Confira e tente de novo.'); $('email').focus(); return; }
  mandar();
});
$('botao-google').addEventListener('click', () => entrarComGoogle(destinoDoLink));

/* ---------- Passo 2: código ---------- */
$('form-codigo').addEventListener('submit', async e => {
  e.preventDefault();
  const codigo = $('codigo').value.replace(/\D/g, '');
  if (codigo.length < 6) { avisar('O código tem 6 números. Confira no e-mail.'); return; }
  const botao = $('botao-codigo');
  ocupado(botao, true, 'Entrando…');
  try {
    await confirmarCodigo(email, codigo);
    location.replace(chegada && volta === 'index.html' ? 'index.html?' + chegada : volta);
  } catch (err) {
    avisar(err.message);
    ocupado(botao, false, 'Entrar');
  }
});
$('reenviar').addEventListener('click', mandar);
$('trocar').addEventListener('click', () => {
  $('passo-codigo').hidden = true;
  $('passo-email').hidden = false;
  avisar('');
  $('email').focus();
});

comecar();
