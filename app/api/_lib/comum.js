/* SERVIDOR: peças usadas por todas as funções em app/api/.
   Roda no Vercel, nunca no navegador. As chaves vêm das variáveis de ambiente do projeto do app no Vercel:
     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (Supabase → Project Settings → API)
     ASAAS_API_KEY, ASAAS_API_URL              (Asaas → Integrações → Chave de API)
     ASAAS_WEBHOOK_TOKEN                       (um texto secreto que você inventa e repete no webhook do Asaas)
     PRECO_MENSAL, PRECO_ANUAL                 (ex.: 19.90 e 199.00)
     ASAAS_URL_RETORNO                         (opcional: página para onde o Asaas volta depois do pagamento) */

export const faltando = (...nomes) => nomes.filter(n => !process.env[n]);

export function responder(res, status, corpo) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(corpo);
}

/* Cabeçalhos com a chave secreta do Supabase. As chaves novas (sb_secret_…) vão só em "apikey";
   a antiga (service_role, um JWT) vai também em "Authorization". */
function cabecalhosSupabase(extra = {}) {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: chave,
    ...(chave.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${chave}` }),
    'Content-Type': 'application/json',
    ...extra,
  };
}

/* Quem está pedindo: confere o login enviado pelo app (Authorization: Bearer <token>) */
export async function usuarioDoPedido(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return null;
  const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` },
  });
  return r.ok ? r.json() : null;
}

/* Banco com a chave secreta (passa por cima das regras de acesso: use só aqui no servidor) */
export async function banco(caminho, { metodo = 'GET', corpo, prefer } = {}) {
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${caminho}`, {
    method: metodo,
    headers: cabecalhosSupabase(prefer ? { Prefer: prefer } : {}),
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`banco ${r.status}: ${texto}`);
  return texto ? JSON.parse(texto) : null;
}

/* Apaga uma conta de login (e, em cascata, assinatura e dados) */
export async function apagarUsuario(id) {
  const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: cabecalhosSupabase() });
  if (!r.ok && r.status !== 404) throw new Error(`apagar usuário ${r.status}: ${await r.text()}`);
}

/* API do Asaas. Sem ASAAS_API_URL, usa o ambiente de testes (sandbox). */
export async function asaas(caminho, { metodo = 'GET', corpo } = {}) {
  const base = process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';
  const r = await fetch(base + caminho, {
    method: metodo,
    headers: { access_token: process.env.ASAAS_API_KEY, 'Content-Type': 'application/json', 'User-Agent': 'lastrion' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(dados.errors?.map(x => x.description).join(' ') || `Asaas respondeu ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return dados;
}

/* Datas no fuso de Brasília, no formato do Asaas (AAAA-MM-DD) */
export const diaEmSP = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(d));

/* Soma um ciclo (mês ou ano) a uma data AAAA-MM-DD e devolve um instante, com dias de folga */
export function depoisDoCiclo(dia, plano, folgaDias = 0) {
  const d = new Date(`${dia}T12:00:00-03:00`);
  const meses = plano === 'anual' ? 12 : 1;
  /* 31/01 + 1 mês = 28 ou 29/02 (último dia do mês), e não 03/03 */
  const diaDoMes = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + meses);
  const ultimoDia = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(diaDoMes, ultimoDia) + folgaDias);
  return d;
}

export const assinaturaDe = async usuarioId => (await banco(`assinaturas?usuario_id=eq.${usuarioId}&select=*`))[0] || null;
