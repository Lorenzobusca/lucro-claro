/* TELA: minha conta e assinatura (app/assinatura.html).
   Assinar, pagar, cancelar sozinho, baixar os dados e excluir a conta.
   Quem fala com o Asaas é o servidor (app/api/), nunca o navegador. */
import { pronto } from './conta/iniciar.js';
import { tokenAtual, baixarDados, sair, configurado } from './conta/supabase.js';
import { seloDoPlano, dia } from './conta/situacao.js';
import { PLANOS } from '../../compartilhado/config/planos.js';
import { brl } from '../../compartilhado/js/ui/numero.js';
import { endereco } from '../../compartilhado/js/ui/enderecos.js';

const $ = id => document.getElementById(id);
const msg = (id, texto, tom = 'erro') => { $(id).textContent = texto; $(id).dataset.tom = tom; };

/* Chama uma função do servidor (app/api/<nome>.js) com o login da pessoa */
async function servidor(nome, corpo = {}) {
  const token = await tokenAtual();
  if (!token) throw new Error('Sua sessão terminou. Entre de novo.');
  let r;
  try {
    r = await fetch(`/api/${nome}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(corpo) });
  } catch (e) { throw new Error('Sem internet agora. Tente de novo quando a conexão voltar.'); }
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(dados.erro || 'Não deu certo agora. Tente de novo em alguns minutos.');
  return dados;
}

/* CPF (11 números) ou CNPJ (14), conferindo os dígitos verificadores */
function documentoValido(d) {
  d = d.replace(/\D/g, '');
  if (!/^(\d{11}|\d{14})$/.test(d) || /^(\d)\1+$/.test(d)) return false;
  const dv = (base, pesos) => { const s = pesos.reduce((a, p, i) => a + Number(base[i]) * p, 0) % 11; return s < 2 ? 0 : 11 - s; };
  if (d.length === 11) {
    const p1 = [10, 9, 8, 7, 6, 5, 4, 3, 2], p2 = [11, ...p1];
    return dv(d, p1) === Number(d[9]) && dv(d, p2) === Number(d[10]);
  }
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], p2 = [6, ...p1];
  return dv(d, p1) === Number(d[12]) && dv(d, p2) === Number(d[13]);
}

function desenhar(plano) {
  const a = plano.assinatura;
  const selo = seloDoPlano(plano);
  $('plano-chip').textContent = selo.texto;
  $('plano-chip').dataset.tom = selo.tom;
  $('email').textContent = plano.usuario?.email || '—';

  const textos = {
    demonstracao: 'Você está no modo demonstração. Quando o login estiver configurado, aqui aparecem a sua assinatura e os seus dados.',
    teste: a && `Você está no teste grátis do plano completo até ${dia(a.acesso_ate)}. Não pedimos cartão. Se não assinar, a conta volta para o plano grátis e os seus dados continuam guardados.`,
    ativa: a && `Plano completo ativo${a.forma === 'PIX' ? ', pago no Pix' : a.forma === 'CREDIT_CARD' ? ', no cartão' : ''}. Liberado até ${dia(a.acesso_ate)}${a.forma === 'CREDIT_CARD' ? ' e renovado sozinho' : ''}.`,
    atrasada: a && `O último pagamento ainda não chegou. O plano completo continua liberado até ${dia(a.acesso_ate)}.`,
    cancelada: a && `Assinatura cancelada. O plano completo continua liberado até ${dia(a.acesso_ate)}; depois, a conta passa para o plano grátis.`,
    gratis: `Você está no plano grátis: ${PLANOS.gratis.metas} metas, ${PLANOS.gratis.mesesDeCaixa} meses de caixa e ${PLANOS.gratis.produtos} produtos, e as ferramentas principais sem cadeado.`,
  };
  $('situacao-texto').textContent = textos[plano.situacao] || textos.gratis;

  /* Link para pagar uma cobrança em aberto */
  if (a?.link_pagamento && ['aguardando', 'atrasada'].includes(a.status)) {
    $('situacao-pagar').hidden = false;
    $('link-pagar').href = a.link_pagamento;
  }

  const assinado = a && ['ativa', 'atrasada', 'aguardando'].includes(a.status) && a.asaas_subscription_id;
  $('cancelar').hidden = !assinado;

  const temPreco = PLANOS.precoMensal != null && PLANOS.precoAnual != null;
  $('preco-breve').hidden = temPreco || assinado;
  $('form-assinar').hidden = !temPreco || assinado || plano.situacao === 'demonstracao';
  if (assinado) $('assinar').querySelector('.feat').insertAdjacentHTML('afterend', '<p class="hint">Você já tem uma assinatura. Para trocar a forma de pagamento, cancele e assine de novo.</p>');
  if (temPreco) {
    $('preco-mensal').textContent = `${brl(PLANOS.precoMensal)} por mês`;
    $('preco-anual').textContent = `${brl(PLANOS.precoAnual)} por ano (${brl(PLANOS.precoAnual / 12)} por mês)`;
  }
  if (plano.usuario?.nome) $('a-nome').value = plano.usuario.nome;
}

/* ---------- Ações ---------- */
$('form-assinar').addEventListener('submit', async e => {
  e.preventDefault();
  const nome = $('a-nome').value.trim(), documento = $('a-doc').value.replace(/\D/g, '');
  const [periodo, forma] = new FormData(e.target).get('opcao').split('-');
  if (nome.split(/\s+/).length < 2) return msg('msg-assinar', 'Escreva o nome completo, como no documento.');
  if (!documentoValido(documento)) return msg('msg-assinar', 'Esse CPF ou CNPJ não confere. Digite só os números.');
  const botao = $('botao-assinar');
  botao.disabled = true;
  msg('msg-assinar', 'Preparando o pagamento…', 'espera');
  try {
    const r = await servidor('assinar', { plano: periodo, forma: forma === 'pix' ? 'PIX' : 'CREDIT_CARD', nome, documento });
    location.href = r.link;   /* página de pagamento do Asaas */
  } catch (err) {
    msg('msg-assinar', err.message);
    botao.disabled = false;
  }
});

/* Botões perigosos pedem um segundo toque para confirmar */
function confirmarDuasVezes(botao, textoConfirmar, acao) {
  const original = botao.textContent;
  botao.addEventListener('click', async () => {
    if (!botao.dataset.certeza) {
      botao.dataset.certeza = '1';
      botao.textContent = textoConfirmar;
      setTimeout(() => { if (botao.dataset.certeza) { delete botao.dataset.certeza; botao.textContent = original; } }, 5000);
      return;
    }
    delete botao.dataset.certeza;
    botao.disabled = true;
    try { await acao(); } finally { botao.disabled = false; botao.textContent = original; }
  });
}

confirmarDuasVezes($('botao-cancelar'), 'Toque de novo para cancelar', async () => {
  try {
    await servidor('cancelar');
    msg('msg-cancelar', 'Assinatura cancelada. Nada mais será cobrado.', 'ok');
    setTimeout(() => location.reload(), 1500);
  } catch (e) { msg('msg-cancelar', e.message); }
});

confirmarDuasVezes($('botao-excluir'), 'Toque de novo para excluir tudo', async () => {
  try {
    await servidor('excluir-conta');
    await sair();
    location.href = endereco('site', '?conta=excluida');
  } catch (e) { msg('msg-excluir', e.message); }
});

/* Cópia dos dados (direito previsto na LGPD): um arquivo com tudo o que está guardado */
$('botao-baixar').addEventListener('click', async () => {
  try {
    const dados = configurado ? await baixarDados() : [];
    const arquivo = new Blob([JSON.stringify({ exportado_em: new Date().toISOString(), dados }, null, 2)], { type: 'application/json' });
    const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(arquivo), download: 'meus-dados-lastrion.json' });
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (e) { alert(e.message); }
});

$('botao-sair').addEventListener('click', async () => { await sair(); location.href = endereco('site'); });

const retorno = new URLSearchParams(location.search).get('pagamento');
pronto.then(plano => {
  desenhar(plano);
  if (retorno === 'ok') msg('msg-assinar', 'Pagamento enviado. Assim que o Asaas confirmar, o plano completo é liberado sozinho (no Pix, em segundos; no cartão, em alguns minutos).', 'ok');
});
