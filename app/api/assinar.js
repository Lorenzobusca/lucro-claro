/* SERVIDOR: cria a assinatura no Asaas e devolve o link da página de pagamento.
   O app nunca vê número de cartão: a pessoa paga na página do próprio Asaas.
   Se a pessoa ainda está no teste grátis, a primeira cobrança vence no último dia do teste. */
import { faltando, responder, usuarioDoPedido, banco, asaas, diaEmSP, assinaturaDe } from './_lib/comum.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST.' });
  if (faltando('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ASAAS_API_KEY', 'PRECO_MENSAL', 'PRECO_ANUAL').length) {
    return responder(res, 503, { erro: 'As assinaturas ainda não estão abertas. Tente de novo em breve.' });
  }

  const usuario = await usuarioDoPedido(req);
  if (!usuario) return responder(res, 401, { erro: 'Sua sessão terminou. Entre de novo.' });

  const { plano, forma, nome, documento } = req.body || {};
  const doc = String(documento || '').replace(/\D/g, '');
  if (!['mensal', 'anual'].includes(plano) || !['PIX', 'CREDIT_CARD'].includes(forma)) return responder(res, 400, { erro: 'Escolha o plano e a forma de pagamento.' });
  if (String(nome || '').trim().length < 5) return responder(res, 400, { erro: 'Escreva o nome completo.' });
  if (!/^(\d{11}|\d{14})$/.test(doc)) return responder(res, 400, { erro: 'Digite o CPF ou CNPJ só com números.' });

  const valor = Number(plano === 'anual' ? process.env.PRECO_ANUAL : process.env.PRECO_MENSAL);
  if (!(valor > 0)) return responder(res, 503, { erro: 'As assinaturas ainda não estão abertas. Tente de novo em breve.' });

  try {
    const atual = await assinaturaDe(usuario.id);
    if (atual?.asaas_subscription_id && ['aguardando', 'ativa', 'atrasada'].includes(atual.status)) {
      return responder(res, 409, { erro: 'Você já tem uma assinatura. Para trocar a forma de pagamento, cancele e assine de novo.' });
    }

    /* Cliente no Asaas (um por conta) */
    let cliente = atual?.asaas_customer_id;
    if (!cliente) {
      const c = await asaas('/customers', { metodo: 'POST', corpo: { name: String(nome).trim(), cpfCnpj: doc, email: usuario.email, externalReference: usuario.id } });
      cliente = c.id;
    }

    /* Primeira cobrança: hoje, ou no fim do teste grátis se ele ainda estiver valendo */
    const hoje = diaEmSP();
    const fimDoTeste = atual?.acesso_ate ? diaEmSP(atual.acesso_ate) : hoje;
    const vencimento = fimDoTeste > hoje ? fimDoTeste : hoje;

    const corpo = {
      customer: cliente,
      billingType: forma,
      value: valor,
      nextDueDate: vencimento,
      cycle: plano === 'anual' ? 'YEARLY' : 'MONTHLY',
      description: `Lastrion - plano completo ${plano}`,
      externalReference: usuario.id,
    };
    if (process.env.ASAAS_URL_RETORNO) corpo.callback = { successUrl: process.env.ASAAS_URL_RETORNO, autoRedirect: true };
    const assinatura = await asaas('/subscriptions', { metodo: 'POST', corpo });

    const cobrancas = await asaas(`/subscriptions/${assinatura.id}/payments`);
    const link = cobrancas.data?.[0]?.invoiceUrl;
    if (!link) throw new Error('Asaas não devolveu o link da primeira cobrança');

    await banco('assinaturas?on_conflict=usuario_id', {
      metodo: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      corpo: {
        usuario_id: usuario.id,
        status: 'aguardando',
        plano, forma,
        asaas_customer_id: cliente,
        asaas_subscription_id: assinatura.id,
        proximo_vencimento: vencimento,
        link_pagamento: link,
        atualizado_em: new Date().toISOString(),
      },
    });

    return responder(res, 200, { link });
  } catch (e) {
    console.error('assinar:', e.message);
    const doAsaas = e.status >= 400 && e.status < 500;
    return responder(res, doAsaas ? 400 : 500, { erro: doAsaas ? `O sistema de pagamento recusou: ${e.message}` : 'Não deu certo agora. Tente de novo em alguns minutos.' });
  }
}
