/* SERVIDOR: exclui a conta a pedido da pessoa (direito previsto na LGPD).
   Cancela a assinatura no Asaas e apaga o login; a assinatura e os dados somem junto (on delete cascade).
   O cadastro e as cobranças no Asaas ficam lá, porque são registros fiscais. */
import { faltando, responder, usuarioDoPedido, asaas, apagarUsuario, assinaturaDe } from './_lib/comum.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST.' });
  if (faltando('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY').length) return responder(res, 503, { erro: 'Serviço indisponível agora.' });

  const usuario = await usuarioDoPedido(req);
  if (!usuario) return responder(res, 401, { erro: 'Sua sessão terminou. Entre de novo.' });

  try {
    const a = await assinaturaDe(usuario.id);
    if (a?.asaas_subscription_id && a.status !== 'cancelada' && process.env.ASAAS_API_KEY) {
      try { await asaas(`/subscriptions/${a.asaas_subscription_id}`, { metodo: 'DELETE' }); }
      catch (e) { if (e.status !== 404) throw e; }
    }
    await apagarUsuario(usuario.id);
    return responder(res, 200, { ok: true });
  } catch (e) {
    console.error('excluir-conta:', e.message);
    return responder(res, 500, { erro: 'Não deu para excluir agora. Tente de novo em alguns minutos.' });
  }
}
