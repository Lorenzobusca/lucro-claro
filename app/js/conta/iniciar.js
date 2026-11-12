/* CONTA: arranque de toda página do app.
   Uso: <script type="module" src="js/conta/iniciar.js" data-telas="margem,produtos"></script>
   1) Confere se a pessoa entrou (senão, manda para entrar.html).
   2) Lê o plano e traz da conta tudo o que ela já salvou.
   3) Coloca os cadeados do plano grátis e preenche os campos com os números salvos.
   4) Só então abre as ferramentas (compartilhado/js/telas/<nome>.js).
   5) Salva sozinho no servidor a cada mudança, e mostra "Salvo" no topo. */
import { configurado, lerRetorno, sessaoValida, lerAssinatura, baixarDados, salvarDado, usuario } from './supabase.js';
import { plano } from '../../../compartilhado/js/ui/plano-atual.js';
import { ajustarLinks } from '../../../compartilhado/js/ui/enderecos.js';
import { aplicarCadeados } from './plano.js';
import { lerChegada, aplicarChegada } from './chegada.js';

const meuScript = document.querySelector('script[data-telas]');
const telas = (meuScript?.dataset.telas || '').split(',').map(s => s.trim()).filter(Boolean);
const params = new URLSearchParams(location.search);
const emExemplo = params.has('ex');           /* aberto por um link de exemplo: não salva por cima dos dados da pessoa */

/* Coisas guardadas no navegador que também vão para a conta: chave local → nome no servidor */
const SINCRONIZADAS = { 'lc-metas-v1': 'metas', 'lc-trilha': 'trilha' };

/* Modo demonstração (sem Supabase configurado): os dados ficam só neste aparelho, em "lc-demo-dados" */
const demo = {
  ler() {
    try { return Object.entries(JSON.parse(localStorage.getItem('lc-demo-dados')) || {}).map(([ferramenta, conteudo]) => ({ ferramenta, conteudo })); }
    catch (e) { return []; }
  },
  gravar(ferramenta, conteudo) {
    try {
      const d = JSON.parse(localStorage.getItem('lc-demo-dados')) || {};
      d[ferramenta] = conteudo;
      localStorage.setItem('lc-demo-dados', JSON.stringify(d));
    } catch (e) {}
  },
};

/* ---------- Indicador "Salvo" no topo ---------- */
const nuvem = document.getElementById('nuvem');
function status(texto, tom = 'ok') {
  if (!nuvem) return;
  nuvem.dataset.tom = tom;
  nuvem.querySelector('span').textContent = texto;
}

/* ---------- Campos de cada ferramenta ---------- */
const PAINEIS_SEM_CAMPOS = new Set(['p-metas']);  /* as metas têm o próprio jeito de salvar */
const paineisComCampos = () => [...document.querySelectorAll('[role="tabpanel"][id]')].filter(p => !PAINEIS_SEM_CAMPOS.has(p.id));
const camposDo = painel => [...painel.querySelectorAll('input[id], select[id]')].filter(c => c.type !== 'search' && !c.readOnly);

function fotografar(painel) {
  return { campos: Object.fromEntries(camposDo(painel).map(c => [c.id, c.value])) };
}
function restaurar(painel, conteudo) {
  Object.entries(conteudo?.campos || {}).forEach(([id, valor]) => {
    const c = document.getElementById(id);
    if (c && painel.contains(c) && !c.readOnly) c.value = valor;
  });
}

/* ---------- Arranque ---------- */
async function iniciar() {
  let dados = [];

  if (configurado) {
    try { await lerRetorno(); } catch (e) { location.replace('entrar.html?erro=' + encodeURIComponent(e.message)); return plano; }
    const s = await sessaoValida();
    if (!s) {
      const volta = location.pathname.split('/').pop() + location.search + location.hash;
      location.replace('entrar.html?volta=' + encodeURIComponent(volta || 'index.html'));
      return plano;
    }
    status('Carregando seus dados…', 'espera');
    try {
      const [assinatura, salvos] = await Promise.all([lerAssinatura(), baixarDados()]);
      dados = salvos || [];
      plano.assinatura = assinatura;
      plano.pago = Boolean(assinatura && new Date(assinatura.acesso_ate) > new Date());
      /* 'aguardando' = assinou durante o teste e o primeiro pagamento ainda não venceu: segue como teste */
      plano.situacao = !plano.pago ? 'gratis' : assinatura.status === 'aguardando' ? 'teste' : assinatura.status;
      status('Salvo na sua conta');
    } catch (e) {
      /* Sem internet: abre com o que estiver no aparelho, no plano grátis, e avisa */
      plano.pago = false;
      plano.situacao = 'gratis';
      status('Sem internet: o que você fizer fica só neste aparelho por enquanto', 'erro');
    }
    plano.usuario = usuario();
  } else {
    plano.pago = params.get('plano') !== 'gratis';
    plano.situacao = 'demonstracao';
    dados = demo.ler();
    status('Modo demonstração: salvo só neste aparelho', 'aviso');
  }

  /* Cálculo que a pessoa fez no site, antes de criar a conta */
  const chegada = lerChegada();
  if (chegada) dados = aplicarChegada(chegada, dados);

  /* Metas e trilha: o que está na conta vale; se só existe no aparelho, sobe para a conta */
  const doServidor = Object.fromEntries(dados.map(d => [d.ferramenta, d.conteudo]));
  for (const [chave, nome] of Object.entries(SINCRONIZADAS)) {
    if (doServidor[nome] != null) { try { localStorage.setItem(chave, JSON.stringify(doServidor[nome])); } catch (e) {} }
  }

  aplicarCadeados();
  if (!emExemplo) paineisComCampos().forEach(p => restaurar(p, doServidor['campos-' + p.id]));
  ajustarLinks();

  await import('../../../compartilhado/js/ui/base.js');
  for (const t of telas) await import(`../../../compartilhado/js/telas/${t}.js`);
  document.documentElement.classList.add('pronto');

  if (!configurado || usuario()) {
    ligarSalvamento(doServidor);
    /* O cálculo do site vai direto para a conta, mesmo que a ferramenta não esteja nesta página */
    if (chegada) chegada.novos.forEach(n => enviar(n.ferramenta, n.conteudo));
  }
  return plano;
}

/* ---------- Salvar sozinho ---------- */
const pendentes = new Map();
let ultimoLocal = {};

async function enviar(ferramenta, conteudo, manter = false) {
  if (!configurado) { demo.gravar(ferramenta, conteudo); status('Modo demonstração: salvo só neste aparelho', 'aviso'); return; }
  status('Salvando…', 'espera');
  try {
    await salvarDado(ferramenta, conteudo, manter);
    status('Salvo na sua conta');
  } catch (e) {
    if (e.status === 401) { status('Sua sessão terminou. Entre de novo para salvar.', 'erro'); return; }
    if (String(e.dados?.message || '').includes('plano')) { status('Esta ferramenta é do plano completo: o que você digitar aqui não fica salvo', 'aviso'); return; }
    status(e.semRede ? 'Sem internet: tentamos salvar de novo em seguida' : 'Não deu para salvar. Tentamos de novo em seguida', 'erro');
    setTimeout(() => enviar(ferramenta, conteudo), 15000);
  }
}

function salvarPainel(id, manter = false) {
  const painel = document.getElementById(id);
  if (painel) enviar('campos-' + id, fotografar(painel), manter);
}

function ligarSalvamento(doServidor) {
  if (emExemplo) {
    status('Exemplo aberto: estes números não são salvos na sua conta', 'aviso');
  } else {
    const aoMudar = e => {
      const painel = e.target.closest?.('[role="tabpanel"][id]');
      if (!painel || PAINEIS_SEM_CAMPOS.has(painel.id) || !e.target.id) return;
      clearTimeout(pendentes.get(painel.id));
      status('Salvando…', 'espera');
      pendentes.set(painel.id, setTimeout(() => { pendentes.delete(painel.id); salvarPainel(painel.id); }, 1200));
    };
    document.addEventListener('input', aoMudar);
    document.addEventListener('change', aoMudar);
  }

  /* Metas e trilha são guardadas pelo próprio código delas no navegador: a cada 2 segundos, sobe o que mudou */
  ultimoLocal = Object.fromEntries(Object.entries(SINCRONIZADAS).map(([chave, nome]) => [chave, JSON.stringify(doServidor[nome] ?? null)]));
  const conferirLocal = (manter = false) => {
    for (const [chave, nome] of Object.entries(SINCRONIZADAS)) {
      let atual = null;
      try { atual = localStorage.getItem(chave); } catch (e) {}
      if (atual == null || atual === ultimoLocal[chave]) continue;
      ultimoLocal[chave] = atual;
      try { enviar(nome, JSON.parse(atual), manter); } catch (e) {}
    }
  };
  setInterval(conferirLocal, 2000);

  /* Ao sair da página, manda na hora o que ainda estava esperando */
  addEventListener('pagehide', () => {
    pendentes.forEach((t, id) => { clearTimeout(t); salvarPainel(id, true); });
    pendentes.clear();
    conferirLocal(true);
  });
}

export const pronto = iniciar();
