/* CONTA: login e banco de dados, falando direto com o Supabase (sem biblioteca externa).
   Login sem senha: a pessoa recebe por e-mail um link e um código de 6 dígitos (o código serve
   quando o link abre em outro navegador, como o do aplicativo de e-mail). Também há "Entrar com Google". */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const configurado = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const CHAVE = 'lc-sessao';
let sessao = lerSessao();

function lerSessao() { try { return JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { return null; } }
function gravarSessao(s) {
  sessao = s;
  try { s ? localStorage.setItem(CHAVE, JSON.stringify(s)) : localStorage.removeItem(CHAVE); } catch (e) {}
}

/* Mensagens de erro em português, sem jargão */
function mensagem(dados, status) {
  const t = String(dados?.msg || dados?.error_description || dados?.message || dados?.error || '').toLowerCase();
  if (status === 429 || t.includes('rate limit') || t.includes('security purposes')) return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
  if (t.includes('expired') || t.includes('invalid') && t.includes('otp') || t.includes('token has expired')) return 'Código errado ou vencido. Peça um novo.';
  if (t.includes('email') && t.includes('invalid')) return 'Esse e-mail não parece certo. Confira e tente de novo.';
  if (t.includes('plano')) return dados.message;
  if (status >= 500) return 'O servidor não respondeu. Tente de novo em alguns minutos.';
  return 'Algo deu errado. Tente de novo.';
}

async function pedir(caminho, { metodo = 'GET', corpo, token, cabecalhos = {}, manter = false } = {}) {
  let r;
  try {
    r = await fetch(SUPABASE_URL + caminho, {
      method: metodo,
      keepalive: manter,
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...cabecalhos },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch (e) {
    throw Object.assign(new Error('Sem internet agora. Tente de novo quando a conexão voltar.'), { semRede: true });
  }
  const texto = await r.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch (e) { dados = texto; }
  if (!r.ok) throw Object.assign(new Error(mensagem(dados, r.status)), { status: r.status, dados });
  return dados;
}

function guardar(d) {
  const u = d.user || sessao?.usuario || {};
  gravarSessao({
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expira: Date.now() + (Number(d.expires_in) || 3600) * 1000,
    usuario: { id: u.id, email: u.email, nome: u.user_metadata?.full_name || u.user_metadata?.name || u.nome || '' },
  });
  return sessao;
}

/* ---------- Entrar ---------- */
export async function enviarAcesso(email, voltarPara) {
  await pedir('/auth/v1/otp?redirect_to=' + encodeURIComponent(voltarPara), { metodo: 'POST', corpo: { email, create_user: true } });
}

export async function confirmarCodigo(email, codigo) {
  return guardar(await pedir('/auth/v1/verify', { metodo: 'POST', corpo: { type: 'email', email, token: codigo } }));
}

export function entrarComGoogle(voltarPara) {
  location.href = SUPABASE_URL + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(voltarPara);
}

/* Quando a pessoa volta do link do e-mail ou do Google, o endereço traz a sessão depois do "#".
   Guarda a sessão e limpa o endereço. */
export async function lerRetorno() {
  if (!configurado || !location.hash) return null;
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('error_description')) {
    history.replaceState(null, '', location.pathname + location.search);
    throw new Error(h.get('error_code') === 'otp_expired' ? 'Esse link já foi usado ou venceu. Peça um novo.' : 'Não deu para entrar com esse link. Peça um novo.');
  }
  const token = h.get('access_token');
  if (!token) return null;
  history.replaceState(null, '', location.pathname + location.search);
  const user = await pedir('/auth/v1/user', { token });
  return guardar({ access_token: token, refresh_token: h.get('refresh_token'), expires_in: h.get('expires_in'), user });
}

/* Sessão em dia: renova sozinha quando está perto de vencer. Devolve null se a pessoa precisa entrar de novo. */
export async function sessaoValida() {
  if (!configurado || !sessao?.refresh_token) return null;
  if (Date.now() < sessao.expira - 60000) return sessao;
  try {
    return guardar(await pedir('/auth/v1/token?grant_type=refresh_token', { metodo: 'POST', corpo: { refresh_token: sessao.refresh_token } }));
  } catch (e) {
    if (e.semRede) return sessao;            /* sem internet: segue com a sessão guardada */
    gravarSessao(null);
    return null;
  }
}

export async function sair() {
  const s = sessao;
  gravarSessao(null);
  if (s) { try { await pedir('/auth/v1/logout', { metodo: 'POST', token: s.access_token }); } catch (e) {} }
}

export const usuario = () => sessao?.usuario || null;
export const tokenAtual = async () => (await sessaoValida())?.access_token || null;

/* ---------- Banco ---------- */
async function banco(caminho, opcoes = {}) {
  const s = await sessaoValida();
  if (!s) throw Object.assign(new Error('Sua sessão terminou. Entre de novo.'), { status: 401 });
  return pedir('/rest/v1/' + caminho, { ...opcoes, token: s.access_token });
}

/* Tudo o que a pessoa salvou: [{ ferramenta, conteudo, atualizado_em }] */
export const baixarDados = () => banco('dados?select=ferramenta,conteudo,atualizado_em');

/* Salva (ou substitui) o conteúdo de uma ferramenta */
export const salvarDado = (ferramenta, conteudo, manter = false) => banco('dados?on_conflict=usuario_id,ferramenta', {
  metodo: 'POST', manter,
  corpo: { usuario_id: usuario().id, ferramenta, conteudo },
  cabecalhos: { Prefer: 'resolution=merge-duplicates,return=minimal' },
});

/* Situação da assinatura (só leitura: quem muda é o servidor) */
export const lerAssinatura = async () => (await banco('assinaturas?select=status,plano,forma,acesso_ate,proximo_vencimento,link_pagamento,asaas_subscription_id'))[0] || null;
