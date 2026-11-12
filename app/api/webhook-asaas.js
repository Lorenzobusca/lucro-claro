/* SERVIDOR: avisos automáticos do Asaas (pagamento confirmado, atrasado, assinatura cancelada…).
   Configure no Asaas: Integrações → Webhooks → URL https://app.lastrion.com.br/api/webhook-asaas
   e o mesmo token da variável ASAAS_WEBHOOK_TOKEN. É isso que libera ou trava o plano completo. */
import { responder, banco, depoisDoCiclo } from './_lib/comum.js';

const FOLGA_DIAS = 3;   /* dias a mais depois do vencimento, para um pagamento que demora a compensar */

export default async function handler(req, res) {
  if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST.' });
  const segredo = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!segredo || req.headers['asaas-access-token'] !== segredo) return responder(res, 401, { erro: 'não autorizado' });

  const aviso = req.body || {};
  const pagamento = aviso.payment || null;
  const idAssinatura = pagamento?.subscription || aviso.subscription?.id;
  const idEvento = aviso.id || `${aviso.event}:${pagamento?.id || idAssinatura}:${pagamento?.status || ''}`;

  /* Cada aviso conta uma vez só (o Asaas pode mandar de novo) */
  const novo = await banco('eventos_asaas?on_conflict=id', {
    metodo: 'POST', prefer: 'resolution=ignore-duplicates,return=representation', corpo: { id: idEvento, evento: aviso.event },
  });
  if (Array.isArray(novo) && novo.length === 0) return responder(res, 200, { ok: true, repetido: true });

  try {
    if (!idAssinatura) return responder(res, 200, { ok: true, ignorado: 'sem assinatura' });
    const [a] = await banco(`assinaturas?asaas_subscription_id=eq.${encodeURIComponent(idAssinatura)}&select=*`);
    if (!a) return responder(res, 200, { ok: true, ignorado: 'assinatura desconhecida' });

    let mudar = null;
    switch (aviso.event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        /* Libera até o vencimento + um ciclo + folga, sem nunca encurtar o que já estava liberado */
        const ate = depoisDoCiclo(pagamento.dueDate, a.plano, FOLGA_DIAS);
        const atual = new Date(a.acesso_ate);
        mudar = {
          status: a.status === 'cancelada' ? 'cancelada' : 'ativa',
          acesso_ate: (ate > atual ? ate : atual).toISOString(),
          proximo_vencimento: depoisDoCiclo(pagamento.dueDate, a.plano).toISOString().slice(0, 10),
          link_pagamento: null,
        };
        break;
      }
      case 'PAYMENT_CREATED':
        /* Nova cobrança no Pix: guarda o link para aparecer no app como "Pagar agora" */
        if (a.forma === 'PIX' && pagamento?.invoiceUrl) mudar = { link_pagamento: pagamento.invoiceUrl };
        break;
      case 'PAYMENT_OVERDUE':
        mudar = { status: a.status === 'cancelada' ? 'cancelada' : 'atrasada', link_pagamento: pagamento?.invoiceUrl || a.link_pagamento };
        break;
      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_CHARGEBACK_REQUESTED':
        mudar = { status: 'cancelada', acesso_ate: new Date().toISOString() };
        break;
      case 'SUBSCRIPTION_DELETED':
      case 'SUBSCRIPTION_INACTIVATED':
        mudar = { status: 'cancelada', link_pagamento: null };
        break;
    }

    if (mudar) {
      await banco(`assinaturas?usuario_id=eq.${a.usuario_id}`, {
        metodo: 'PATCH', prefer: 'return=minimal', corpo: { ...mudar, atualizado_em: new Date().toISOString() },
      });
    }
    return responder(res, 200, { ok: true });
  } catch (e) {
    /* Deu erro: esquece este aviso para o Asaas poder mandar de novo */
    console.error('webhook-asaas:', e.message);
    await banco(`eventos_asaas?id=eq.${encodeURIComponent(idEvento)}`, { metodo: 'DELETE' }).catch(() => {});
    return responder(res, 500, { erro: 'falha ao processar' });
  }
}
