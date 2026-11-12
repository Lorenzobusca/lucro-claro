/* TELA: orçamento e metas, versão grátis (metas.html).
   Os dados ficam salvos no navegador da pessoa (localStorage), sem servidor. */
import { $, numeroDe } from '../ui/numero.js';
import { registrarTour } from '../ui/tour.js';
import { PADARIA, resultadosPadaria } from '../calculo/trilha.js';
import { limite } from '../ui/plano-atual.js';
import { dataIso, mesDe, mesVizinho, situacaoDaMeta, metasDeExemplo } from '../calculo/metas.js';

const CHAVE = 'lc-metas-v1';
const hoje = new Date(), mesHoje = mesDe(hoje);
let mes = mesHoje;

const valorCom = (v, un) => un === 'R$' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' ' + un;
const porcento = v => isFinite(v) ? Math.round(v * 100) + '%' : '—';
const seguro = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const nomeDoMes = m => { const [a, b] = m.split('-').map(Number); const s = new Date(a, b - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };

/* ---------- Dados salvos ---------- */
let D;
try { D = JSON.parse(localStorage.getItem(CHAVE)); } catch (e) {}
if (!D || !Array.isArray(D.metas) || !Array.isArray(D.lanc)) D = metasDeExemplo(hoje);
/* O link metas.html?ex=padaria#metas (vindo da trilha) mostra as metas da padaria de exemplo,
   desde que a pessoa ainda não tenha criado as suas */
if (new URLSearchParams(location.search).get('ex') === 'padaria' && D.exemplo) {
  const r = resultadosPadaria();
  const metas = [
    { id: 'ex1', nome: 'Vendas do mês', tipo: 'min', alvo: Math.round(r.depois.faturamento), un: 'R$', ritmo: 1.02 },
    { id: 'ex2', nome: 'Gastos fixos do mês', tipo: 'max', alvo: Math.round(r.fixosDepois), un: 'R$', ritmo: 0.97 },
    { id: 'ex3', nome: 'Refrigerantes vendidos', tipo: 'min', alvo: PADARIA.produtos[2].quantidade, un: 'un', ritmo: 1.05 },
  ];
  /* lançamentos proporcionais ao que já passou do mês, como se a Célia lançasse toda semana */
  const dias = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate(), passado = hoje.getDate() / dias;
  D = { exemplo: true,
    metas: metas.map(({ ritmo, ...m }) => m),
    lanc: metas.map(m => ({ id: 'l' + m.id, meta: m.id, data: dataIso(hoje), valor: Math.round(m.alvo * passado * m.ritmo), obs: 'Exemplo' })) };
}
let salvou = true;
function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(D)); salvou = true; } catch (e) { salvou = false; } }
function sairDoExemplo() { if (D.exemplo) D = { metas: [], lanc: [] }; }
const aviso = texto => { $('g-msg').textContent = texto; };

/* ---------- Tela ---------- */
function cartaoDaMeta(m, s) {
  const largura = Math.min(100, s.p * 100), marca = Math.min(100, s.ritmo * 100);
  const cor = s.classe === 'bad' ? 'var(--bad)' : s.classe === 'warn' ? 'var(--warn)' : '';
  const projecao = s.projecao != null && s.real > 0 ? `<span>Nesse ritmo, fecha o mês em <b>${valorCom(s.projecao, m.un)}</b></span>` : '';
  return `<article class="meta" data-id="${m.id}">
    <div class="meta-head"><h3>${seguro(m.nome)}</h3><span class="pill ${s.classe}">${s.texto}</span></div>
    <div class="meta-nums"><span class="grande">${valorCom(s.real, m.un)}</span><span>de ${valorCom(m.alvo, m.un)} ${m.tipo === 'max' ? '(limite)' : ''} · <b>${porcento(s.p)}</b></span></div>
    <div class="meter" aria-hidden="true"><span style="width:${largura}%;${cor ? `background:${cor}` : ''}"></span>${mes === mesHoje ? `<i style="left:${marca}%"></i>` : ''}</div>
    <div class="meta-info">${mes === mesHoje ? `<span>Esperado até hoje: <b>${porcento(s.ritmo)}</b></span>` : ''}${projecao}</div>
    <form class="lancar" novalidate>
      <label>Valor<input name="valor" inputmode="decimal" placeholder="${m.un === 'R$' ? '1500' : '20'}" aria-label="Valor a lançar em ${seguro(m.nome)}"></label>
      <label>Data<input name="data" type="date" value="${mes === mesHoje ? dataIso(hoje) : mes + '-01'}" aria-label="Data do lançamento"></label>
      <button class="btn-mini" type="submit">Lançar</button>
      <button class="btn-mini apagar" type="button" data-acao="excluir">Excluir meta</button>
    </form></article>`;
}

function desenhar() {
  $('g-mes').textContent = nomeDoMes(mes);

  const faixa = $('g-aviso');
  if (D.exemplo) { faixa.hidden = false; faixa.innerHTML = 'Estas metas são um <b>exemplo</b> para você ver como funciona. <button class="link" id="g-limpar">Apagar o exemplo e começar as minhas</button>'; }
  else if (!salvou) { faixa.hidden = false; faixa.textContent = 'Seu navegador bloqueou o salvamento. As metas vão sumir quando você fechar a página.'; }
  else faixa.hidden = true;

  const lista = D.metas.map(m => ({ m, s: situacaoDaMeta(m, D.lanc, mes, hoje) }));
  const quantas = classe => lista.filter(x => x.s.classe === classe).length;
  $('g-placar').innerHTML = D.metas.length
    ? `<div><b>${quantas('ok')}</b><span>no caminho certo</span></div><div><b>${quantas('warn')}</b><span>pedem atenção</span></div><div><b>${quantas('bad')}</b><span>com problema</span></div>`
    : '';
  $('g-lista').innerHTML = lista.length ? lista.map(({ m, s }) => cartaoDaMeta(m, s)).join('') : '<p class="vazio">Nenhuma meta ainda. Crie a primeira no formulário abaixo.</p>';

  const ultimos = [...D.lanc].sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id)).slice(0, 8);
  $('g-lancs').innerHTML = ultimos.length ? ultimos.map(l => {
    const m = D.metas.find(x => x.id === l.meta);
    if (!m) return '';
    const [, mm, dd] = l.data.split('-');
    return `<div class="lanc"><span class="num">${dd}/${mm}</span><span class="lanc-nome">${seguro(m.nome)}${l.obs ? ` <small>${seguro(l.obs)}</small>` : ''}</span><span class="num">${valorCom(l.valor, m.un)}</span><button class="btn-x" data-lanc="${l.id}" aria-label="Apagar lançamento de ${valorCom(l.valor, m.un)}">×</button></div>`;
  }).join('') : '<p class="vazio">Os lançamentos aparecem aqui.</p>';

  const cheio = D.metas.length >= limite('metas') && !D.exemplo;
  $('g-form').querySelector('button[type=submit]').disabled = cheio;
  if (cheio) aviso(`O plano grátis guarda até ${limite('metas')} metas. Exclua uma para criar outra, ou passe para o plano completo.`);
}

/* ---------- Ações ---------- */
$('g-prev').addEventListener('click', () => { mes = mesVizinho(mes, -1); desenhar(); });
$('g-next').addEventListener('click', () => { mes = mesVizinho(mes, 1); desenhar(); });

$('g-aviso').addEventListener('click', e => {
  if (e.target.id !== 'g-limpar') return;
  sairDoExemplo(); salvar(); aviso(''); desenhar(); $('g-nome').focus();
});

$('g-form').addEventListener('submit', e => {
  e.preventDefault();
  const nome = $('g-nome').value.trim(), alvo = numeroDe($('g-alvo').value);
  if (!nome) return aviso('Dê um nome para a meta.');
  if (!(alvo > 0)) return aviso('Informe o valor da meta por mês, maior que zero.');
  sairDoExemplo();
  if (D.metas.length >= limite('metas')) return aviso(`O plano grátis guarda até ${limite('metas')} metas.`);
  D.metas.push({ id: novoId(), nome, tipo: $('g-tipo').value, alvo, un: $('g-un').value });
  salvar(); $('g-nome').value = ''; $('g-alvo').value = ''; aviso('Meta criada.'); desenhar();
});

$('g-lista').addEventListener('submit', e => {
  e.preventDefault();
  const cartao = e.target.closest('.meta'), valor = numeroDe(e.target.valor.value), data = e.target.data.value;
  if (!(valor > 0) || !data) { e.target.valor.focus(); return; }
  delete D.exemplo;   /* ao lançar, o exemplo passa a ser da pessoa */
  D.lanc.push({ id: novoId(), meta: cartao.dataset.id, data, valor });
  salvar(); desenhar();
});

/* Excluir pede um segundo clique para confirmar */
$('g-lista').addEventListener('click', e => {
  const botao = e.target.closest('[data-acao=excluir]');
  if (!botao) return;
  if (botao.dataset.certeza) {
    const id = botao.closest('.meta').dataset.id;
    D.metas = D.metas.filter(m => m.id !== id);
    D.lanc = D.lanc.filter(l => l.meta !== id);
    delete D.exemplo; salvar(); aviso(''); desenhar();
  } else {
    botao.dataset.certeza = '1';
    botao.textContent = 'Confirmar exclusão';
    setTimeout(() => { if (botao.isConnected) { delete botao.dataset.certeza; botao.textContent = 'Excluir meta'; } }, 4000);
  }
});

$('g-lancs').addEventListener('click', e => {
  const botao = e.target.closest('[data-lanc]');
  if (!botao) return;
  D.lanc = D.lanc.filter(l => l.id !== botao.dataset.lanc);
  delete D.exemplo; salvar(); desenhar();
});

desenhar();

registrarTour('metas', { painel: 'p-metas', etapa: 7, passos: [
  { alvo: 'g-lista', titulo: 'O painel do mês', termo: 'Orçamento', texto: 'Cada cartão é uma meta. A barra mostra quanto já foi feito; o risquinho, onde você deveria estar hoje. Use as setas para ver os meses anteriores.' },
  { alvo: 'g-nome', titulo: 'Nome da meta', texto: 'Diga o que você quer acompanhar, do seu jeito.', exemplo: '"Vendas do mês" ou "Gastos fixos".' },
  { alvo: 'g-tipo', titulo: 'Tipo', texto: '"Chegar a um valor" serve para vendas e produção. "Não passar de um valor" serve para gastos e perdas.' },
  { alvo: 'g-alvo', titulo: 'Meta por mês', texto: 'O número que você quer bater. Tire das outras ferramentas: o faturamento de equilíbrio, o total de custos fixos.', exemplo: 'vender R$ 38.100.' },
  { alvo: 'g-un', titulo: 'Medida', texto: 'Reais, unidades, horas ou quilos.' },
  { alvo: 'g-lancs', titulo: 'Como acompanhar', termo: 'Projeção', texto: 'Todo dia ou toda semana, lance o que aconteceu no cartão da meta. O painel calcula se você está no ritmo e como o mês deve fechar.' },
]});
