/* SERVIDOR: cancela a assinatura no Asaas, sem a pessoa precisar falar com ninguém.
   O plano completo continua liberado até o fim do período já pago (acesso_ate não muda). */
import { faltando, responder, usuarioDoPedido, banco, asaas, assinaturaDe } from './_lib/comum.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST.' });
  if (faltando('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ASAAS_API_KEY').length) return responder(res, 503, { erro: 'Serviço indisponível agora.' });

  const usuario = await usuarioDoPedido(req);
  if (!usuario) return responder(res, 401, { erro: 'Sua sessão terminou. Entre de novo.' });

  try {
    const a = await assinaturaDe(usuario.id);
    if (!a?.asaas_subscription_id || a.status === 'cancelada') return responder(res, 404, { erro: 'Você não tem assinatura para cancelar.' });

    try {
      await asaas(`/subscriptions/${a.asaas_subscription_id}`, { metodo: 'DELETE' });
    } catch (e) {
      if (e.status !== 404) throw e;   /* já não existia no Asaas: segue e marca como cancelada */
    }
    await banco(`assinaturas?usuario_id=eq.${usuario.id}`, {
      metodo: 'PATCH', prefer: 'return=minimal',
      corpo: { status: 'cancelada', link_pagamento: null, atualizado_em: new Date().toISOString() },
    });
    return responder(res, 200, { ok: true, acesso_ate: a.acesso_ate });
  } catch (e) {
    console.error('cancelar:', e.message);
    return responder(res, 500, { erro: 'Não deu para cancelar agora. Tente de novo em alguns minutos.' });
  }
}
