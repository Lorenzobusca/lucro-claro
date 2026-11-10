/* Orçamento e metas (versão grátis): tudo fica salvo no navegador da pessoa, sem servidor. */
(function(){
const $=id=>document.getElementById(id);
if(!$('g-lista'))return;
const CHAVE='lc-metas-v1', LIMITE=5;
const num=s=>{s=String(s).trim().replace(/\s|R\$/g,'');s=s.includes(',')?s.replace(/\./g,'').replace(',','.'):s;const v=parseFloat(s);return isFinite(v)?v:NaN};
const fmt=(v,un)=>un==='R$'?v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):v.toLocaleString('pt-BR',{maximumFractionDigits:1})+' '+un;
const pct=v=>isFinite(v)?Math.round(v*100)+'%':'—';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const hoje=new Date(), mesHoje=iso(hoje).slice(0,7);
const novoId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
let mes=mesHoje;

/* Dados */
function exemplo(){
  const dias=new Date(hoje.getFullYear(),hoje.getMonth()+1,0).getDate(), ritmo=hoje.getDate()/dias, d=iso(hoje);
  const metas=[{id:'ex1',nome:'Faturamento do mês',tipo:'min',alvo:60000,un:'R$'},{id:'ex2',nome:'Mesas produzidas',tipo:'min',alvo:460,un:'un'},{id:'ex3',nome:'Gasto com matéria-prima',tipo:'max',alvo:22000,un:'R$'}];
  const f={ex1:1.06,ex2:.78,ex3:1.12};
  return{exemplo:true,metas,lanc:metas.map(m=>({id:'l'+m.id,meta:m.id,data:d,valor:Math.round(m.alvo*ritmo*f[m.id]),obs:'Exemplo'}))};
}
let D;
try{D=JSON.parse(localStorage.getItem(CHAVE))}catch(e){}
if(!D||!Array.isArray(D.metas)||!Array.isArray(D.lanc))D=exemplo();
let salvou=true;
function salvar(){try{localStorage.setItem(CHAVE,JSON.stringify(D));salvou=true}catch(e){salvou=false}}

/* Contas */
function ritmoDo(m){if(m<mesHoje)return 1;if(m>mesHoje)return 0;const[a,b]=m.split('-').map(Number);return hoje.getDate()/new Date(a,b,0).getDate()}
function situacao(meta){
  const real=D.lanc.filter(l=>l.meta===meta.id&&l.data.slice(0,7)===mes).reduce((s,l)=>s+l.valor,0);
  const r=ritmoDo(mes), p=meta.alvo?real/meta.alvo:0, fechado=mes<mesHoje, proj=mes===mesHoje&&r>0?real/r:null;
  let st,cl;
  if(meta.tipo==='min'){
    if(p>=1){st='Meta atingida';cl='ok'}
    else if(fechado){st='Não atingida';cl='bad'}
    else if(mes>mesHoje){st='Ainda não começou';cl='warn'}
    else if(p>=r*.95){st='No ritmo';cl='ok'}
    else{st='Atrasada';cl='bad'}
  }else{
    if(p>1){st='Estourou o limite';cl='bad'}
    else if(fechado){st='Dentro do limite';cl='ok'}
    else if(mes>mesHoje){st='Ainda não começou';cl='warn'}
    else if(p>r*1.05){st='Gastando rápido demais';cl='warn'}
    else{st='Dentro do limite';cl='ok'}
  }
  return{real,p,r,proj,st,cl};
}

/* Tela */
const nomeMes=m=>{const[a,b]=m.split('-').map(Number);const s=new Date(a,b-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return s[0].toUpperCase()+s.slice(1)};
function desenhar(){
  $('g-mes').textContent=nomeMes(mes);
  const av=$('g-aviso');
  if(D.exemplo){av.hidden=false;av.innerHTML='Estas metas são um <b>exemplo</b> para você ver como funciona. <button class="link" id="g-limpar">Apagar o exemplo e começar as minhas</button>'}
  else if(!salvou){av.hidden=false;av.textContent='Seu navegador bloqueou o salvamento. As metas vão sumir quando você fechar a página.'}
  else av.hidden=true;
  const sit=D.metas.map(m=>({m,s:situacao(m)}));
  const cont=c=>sit.filter(x=>x.s.cl===c).length;
  $('g-placar').innerHTML=D.metas.length?`<div><b>${cont('ok')}</b><span>no caminho certo</span></div><div><b>${cont('warn')}</b><span>pedem atenção</span></div><div><b>${cont('bad')}</b><span>com problema</span></div>`:'';
  $('g-lista').innerHTML=sit.length?sit.map(({m,s})=>{
    const larg=Math.min(100,s.p*100), marca=Math.min(100,s.r*100), cor=s.cl==='bad'?'#FF9B86':s.cl==='warn'?'#F7C766':'';
    const proj=s.proj!=null&&s.real>0?`<span>Nesse ritmo, fecha o mês em <b>${fmt(s.proj,m.un)}</b></span>`:'';
    return `<article class="meta" data-id="${m.id}">
      <div class="meta-head"><h3>${esc(m.nome)}</h3><span class="pill ${s.cl}">${s.st}</span></div>
      <div class="meta-nums"><span class="num grande">${fmt(s.real,m.un)}</span><span>de ${fmt(m.alvo,m.un)} ${m.tipo==='max'?'(limite)':''} · <b>${pct(s.p)}</b></span></div>
      <div class="meter" aria-hidden="true"><span style="width:${larg}%;${cor?`background:${cor}`:''}"></span>${mes===mesHoje?`<i style="left:${marca}%"></i>`:''}</div>
      <div class="meta-info">${mes===mesHoje?`<span>Esperado até hoje: <b>${pct(s.r)}</b></span>`:''}${proj}</div>
      <form class="lancar" novalidate>
        <label>Valor<input name="valor" inputmode="decimal" placeholder="${m.un==='R$'?'1500':'20'}" aria-label="Valor a lançar em ${esc(m.nome)}"></label>
        <label>Data<input name="data" type="date" value="${mes===mesHoje?iso(hoje):mes+'-01'}" aria-label="Data do lançamento"></label>
        <button class="btn-mini" type="submit">Lançar</button>
        <button class="btn-mini apagar" type="button" data-acao="excluir">Excluir meta</button>
      </form></article>`}).join(''):'<p class="vazio">Nenhuma meta ainda. Crie a primeira no formulário abaixo.</p>';
  const ult=[...D.lanc].sort((a,b)=>b.data.localeCompare(a.data)||b.id.localeCompare(a.id)).slice(0,8);
  $('g-lancs').innerHTML=ult.length?ult.map(l=>{const m=D.metas.find(x=>x.id===l.meta);if(!m)return'';const[a,b,c]=l.data.split('-');
    return `<div class="lanc"><span class="num">${c}/${b}</span><span class="lanc-nome">${esc(m.nome)}${l.obs?` <small>${esc(l.obs)}</small>`:''}</span><span class="num">${fmt(l.valor,m.un)}</span><button class="btn-x" data-lanc="${l.id}" aria-label="Apagar lançamento de ${fmt(l.valor,m.un)}">×</button></div>`}).join(''):'<p class="vazio claro">Os lançamentos aparecem aqui.</p>';
  const cheio=D.metas.length>=LIMITE&&!D.exemplo;
  $('g-form').querySelector('button[type=submit]').disabled=cheio;
  if(cheio)msg('Você chegou às 5 metas da versão grátis. Exclua uma para criar outra.');
}
function msg(t){$('g-msg').textContent=t}
function sairDoExemplo(){if(D.exemplo){D={metas:[],lanc:[]}}}

/* Ações */
$('g-prev').addEventListener('click',()=>{const[a,b]=mes.split('-').map(Number);mes=iso(new Date(a,b-2,1)).slice(0,7);desenhar()});
$('g-next').addEventListener('click',()=>{const[a,b]=mes.split('-').map(Number);mes=iso(new Date(a,b,1)).slice(0,7);desenhar()});
$('g-aviso').addEventListener('click',e=>{if(e.target.id==='g-limpar'){sairDoExemplo();salvar();msg('');desenhar();$('g-nome').focus()}});
$('g-form').addEventListener('submit',e=>{
  e.preventDefault();
  const nome=$('g-nome').value.trim(), alvo=num($('g-alvo').value);
  if(!nome)return msg('Dê um nome para a meta.');
  if(!(alvo>0))return msg('Informe o valor da meta por mês, maior que zero.');
  sairDoExemplo();
  if(D.metas.length>=LIMITE)return msg('Você chegou às 5 metas da versão grátis.');
  D.metas.push({id:novoId(),nome,tipo:$('g-tipo').value,alvo,un:$('g-un').value});
  salvar();$('g-nome').value='';$('g-alvo').value='';msg('Meta criada.');desenhar();
});
$('g-lista').addEventListener('submit',e=>{
  e.preventDefault();
  const art=e.target.closest('.meta'), v=num(e.target.valor.value), d=e.target.data.value;
  if(!(v>0)||!d){e.target.valor.focus();return}
  if(D.exemplo){delete D.exemplo}   // ao lançar, o exemplo passa a ser da pessoa
  D.lanc.push({id:novoId(),meta:art.dataset.id,data:d,valor:v});
  salvar();desenhar();
});
$('g-lista').addEventListener('click',e=>{
  const b=e.target.closest('[data-acao=excluir]');if(!b)return;
  if(b.dataset.certeza){const id=b.closest('.meta').dataset.id;D.metas=D.metas.filter(m=>m.id!==id);D.lanc=D.lanc.filter(l=>l.meta!==id);delete D.exemplo;salvar();msg('');desenhar()}
  else{b.dataset.certeza='1';b.textContent='Confirmar exclusão';setTimeout(()=>{if(b.isConnected){delete b.dataset.certeza;b.textContent='Excluir meta'}},4000)}
});
$('g-lancs').addEventListener('click',e=>{const b=e.target.closest('[data-lanc]');if(!b)return;D.lanc=D.lanc.filter(l=>l.id!==b.dataset.lanc);delete D.exemplo;salvar();desenhar()});
desenhar();
})();
