(function(){
const $=id=>document.getElementById(id);
const brl=v=>isFinite(v)?v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—';
const pct=(v,d=2)=>isFinite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})+'%':'—';
const n=id=>{const s=String($(id).value).trim().replace(/\s/g,'');const t=s.includes(',')?s.replace(/\./g,'').replace(',','.'):s;const v=parseFloat(t);return isFinite(v)?v:0};
const kv=rows=>rows.map(([k,v])=>`<div><span>${k}</span><span>${v}</span></div>`).join('');
const has=id=>!!$(id);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Taxas: valores de reserva, trocados pelos de data/taxas.json assim que ele carrega */
let T={atualizado_em:null,exemplo:true,taxas:{selic:{valor:15,data:null},cdi:{valor:14.9,data:null},ipca_12m:{valor:4.7,data:null},ipca_focus_12m:{valor:4.3,data:null},tr:{valor:0.17,data:null},salario_minimo:{valor:1621,data:null}},
  reforma:{"2026":{cbs:.9,ibs:.1,nota:""},"2027":{cbs:8.7,ibs:.1,nota:""},"2033":{cbs:8.8,ibs:17.7,nota:""}}};
const tx=k=>T.taxas[k]?.valor;
const dataBR=d=>{if(!d)return'';if(T.atualizado_em&&String(d).slice(0,10)>T.atualizado_em.slice(0,10))d=T.atualizado_em;const [y,m,dd]=String(d).slice(0,10).split('-');return dd?`${dd}/${m}/${y}`:`${m}/${y}`};
const setVal=(id,v)=>{if(has(id)&&v!=null&&isFinite(v))$(id).value=String(+v.toFixed(2))};
function aplicarTaxas(){
  document.querySelectorAll('[data-rate]').forEach(el=>{const k=el.dataset.rate,t=T.taxas[k];if(t)el.textContent=pct(t.valor,2)});
  document.querySelectorAll('[data-date]').forEach(el=>{const t=T.taxas[el.dataset.date];el.textContent=t?.data?'em '+dataBR(t.data):'exemplo'});
  document.querySelectorAll('.src[data-src]').forEach(el=>{const t=T.taxas[el.dataset.src];el.textContent=t?.data?`Banco Central, ${dataBR(t.data)}`:'valor de exemplo'});
  const src=$('rates-src');
  if(!src);else if(T.exemplo||!T.atualizado_em){src.textContent='Valores de exemplo: a atualização automática pelo Banco Central ainda não rodou.';src.classList.add('stale')}
  else{const dias=(Date.now()-new Date(T.atualizado_em))/864e5;src.textContent=`Fonte: Banco Central do Brasil. Atualizado em ${new Date(T.atualizado_em).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}.`;src.classList.toggle('stale',dias>5)}
  setVal('s-sm',tx('salario_minimo'));setVal('i-inf',tx('ipca_focus_12m'));
  if(has('v-ano'))ivaAno();if(has('s-tipo'))simples();if(has('i-tipo'))invest();if(has('w-ini')&&cartPronto){setVal('w-inf',tx('ipca_focus_12m'));carteiraTaxas()}
}


/* Abas */
const tabs=[...document.querySelectorAll('.tab')];
function sel(t){tabs.forEach(x=>{const on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;$(x.getAttribute('aria-controls')).hidden=!on});try{localStorage.setItem('lc-tab',t.id)}catch(e){}}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>sel(t));t.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const j=(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;sel(tabs[j]);tabs[j].focus()}})});
const porLink=()=>{const t=$('t-'+location.hash.slice(1));if(t&&tabs.includes(t)){sel(t);return true}return false};
addEventListener('hashchange',porLink);
if(tabs.length&&!porLink()){try{const s=localStorage.getItem('lc-tab');if(s&&$(s))sel($(s));else sel(tabs[0])}catch(e){sel(tabs[0])}}

/* Simples / MEI */
const anexos={
 I:[[180e3,4,0],[360e3,7.3,5940],[720e3,9.5,13860],[1.8e6,10.7,22500],[3.6e6,14.3,87300],[4.8e6,19,378000]],
 II:[[180e3,4.5,0],[360e3,7.8,5940],[720e3,10,13860],[1.8e6,11.2,22500],[3.6e6,14.7,85500],[4.8e6,30,720000]],
 III:[[180e3,6,0],[360e3,11.2,9360],[720e3,13.5,17640],[1.8e6,16,35640],[3.6e6,21,125640],[4.8e6,33,648000]]};
function simples(){
  const tipo=$('s-tipo').value, mes=n('s-mes'), r12=n('s-12');
  const mei=tipo.startsWith('mei'); $('s-sm-wrap').hidden=!mei;
  if(mei){
    const inss=n('s-sm')*0.05, extra=tipo==='mei-com'?1:tipo==='mei-serv'?5:6, das=inss+extra, lim=81000;
    const uso=r12/lim*100;
    $('s-label').textContent='DAS fixo do MEI';
    $('s-big').textContent=brl(das);
    $('s-pill').innerHTML=r12<=lim*0.8?`<span class="pill ok">Dentro do limite</span>`:r12<=lim?`<span class="pill warn">Perto do limite anual</span>`:r12<=lim*1.2?`<span class="pill bad">Acima do limite: paga a diferença e vira ME</span>`:`<span class="pill bad">Mais de 20% acima: desenquadramento retroativo</span>`;
    $('s-kv').innerHTML=kv([['INSS (5% do salário mínimo)',brl(inss)],['ICMS / ISS',brl(extra)],['Limite anual do MEI',brl(lim)],['Você já usou',pct(uso,1)],['Peso do DAS sobre o mês',pct(mes?das/mes*100:NaN)]]);
    return;
  }
  const tab=anexos[tipo]; const base=Math.max(r12,1);
  let f=tab.findIndex(x=>base<=x[0]); const acima=f<0; if(acima)f=tab.length-1;
  const [,nom,ded]=tab[f]; const ef=r12>0?Math.max(0,(base*nom/100-ded)/base*100):nom;
  $('s-label').textContent='Imposto do mês (DAS)';
  $('s-big').textContent=brl(mes*ef/100);
  $('s-pill').innerHTML=acima?`<span class="pill bad">Acima de R$ 4,8 milhões: fora do Simples</span>`:`<span class="pill ok">Faixa ${f+1} de 6</span>`;
  $('s-kv').innerHTML=kv([['Alíquota nominal da faixa',pct(nom)],['Parcela a deduzir',brl(ded)],['Sua alíquota efetiva',pct(ef)],['Estimativa no ano',brl(r12*ef/100)]]);
}
['s-tipo','s-mes','s-12','s-sm'].forEach(id=>$(id)?.addEventListener('input',simples));

/* IBS/CBS */
function ivaAno(){const r=T.reforma[$('v-ano').value];if(!r)return;setVal('v-aliq',r.cbs+r.ibs);$('v-note').textContent=(r.nota?r.nota+' ':'')+'Considera alíquota cheia nas compras. Simulação educativa.';iva()}
function iva(){
  const venda=n('v-venda'),compra=n('v-compra'),al=n('v-aliq'),red=n('v-red');
  const r=T.reforma[$('v-ano').value]||{cbs:1,ibs:2}, fc=r.cbs/((r.cbs+r.ibs)||1);
  const efet=al*(1-red/100), deb=venda*efet/100, cred=compra*al/100, pagar=Math.max(0,deb-cred), saldo=Math.max(0,cred-deb);
  $('v-big').textContent=brl(pagar);
  $('v-kv').innerHTML=kv([['Alíquota do seu setor',pct(efet)],['Imposto sobre as vendas',brl(deb)],['Crédito das compras',`− ${brl(cred)}`],[`CBS (${pct(fc*100,0)} do total)`,brl(pagar*fc)],[`IBS (${pct((1-fc)*100,0)} do total)`,brl(pagar*(1-fc))],['Preço final ao cliente',brl(venda+deb)]].concat(saldo>0?[['Crédito que sobra para o mês seguinte',brl(saldo)]]:[]));
}
['v-venda','v-compra','v-aliq','v-red'].forEach(id=>$(id)?.addEventListener('input',iva));
$('v-ano')?.addEventListener('input',ivaAno);

/* Custeio */
function custeio(){
  const P=['a','b'].map(k=>({q:n(k+'-q'),p:n(k+'-p'),d:n(k+'-d'),h:n(k+'-h'),s:n(k+'-s'),i:n(k+'-i')}));
  const cs=n('c-setup'),ci=n('c-insp'),cm=n('c-maq'),cif=cs+ci+cm;
  const H=P.reduce((a,x)=>a+x.q*x.h,0),S=P.reduce((a,x)=>a+x.s,0),I=P.reduce((a,x)=>a+x.i,0);
  const names=['Mesa padrão','Mesa sob medida'];
  const res=P.map(x=>{const abs=x.d+(H?cif*x.h/H:0);const abc=x.d+(x.q?((S?cs*x.s/S:0)+(I?ci*x.i/I:0)+(H?cm*x.q*x.h/H:0))/x.q:0);return{abs,abc,la:x.p-abs,lb:x.p-abc}});
  const cell=v=>`<span style="color:${v<0?'var(--bad)':'inherit'}">${brl(v)}</span>`;
  $('c-out').innerHTML=`<thead><tr><th>Produto</th><th>Custo absorção</th><th>Lucro absorção</th><th>Custo ABC</th><th>Lucro ABC</th></tr></thead><tbody>`+
    res.map((r,j)=>`<tr><td>${names[j]}</td><td>${brl(r.abs)}</td><td>${cell(r.la)}</td><td>${brl(r.abc)}</td><td>${cell(r.lb)}</td></tr>`).join('')+
    `<tr><td><b>Total no mês</b></td><td></td><td>${cell(res.reduce((a,r,j)=>a+r.la*P[j].q,0))}</td><td></td><td>${cell(res.reduce((a,r,j)=>a+r.lb*P[j].q,0))}</td></tr></tbody>`;
  const j=res[1].abc-res[1].abs>res[0].abc-res[0].abs?1:0, dif=res[j].abc-res[j].abs;
  $('c-insight').innerHTML=Math.abs(dif)<0.5?'Os dois métodos chegam a custos parecidos com esses números.':
    `O ABC mostra que a <b>${names[j].toLowerCase()}</b> custa ${brl(dif)} a mais por unidade do que a absorção indica, porque usa mais preparações e inspeções. ${res[j].lb<0?'Com esse preço, ela dá prejuízo.':'Vale revisar o preço dela.'} O lucro total do mês é o mesmo nos dois métodos: o que muda é qual produto realmente gera esse lucro.`;
}
['a','b'].forEach(k=>['q','p','d','h','s','i'].forEach(f=>$(k+'-'+f)?.addEventListener('input',custeio)));
['c-setup','c-insp','c-maq'].forEach(id=>$(id)?.addEventListener('input',custeio));

/* Margem */
function margem(){
  const p=n('m-preco'),cv=n('m-cv'),dv=n('m-dv'),cf=n('m-cf'),q=n('m-q');
  const mc=p-cv-p*dv/100, mcp=p?mc/p*100:NaN, pe=mc>0?cf/mc:Infinity, lucro=mc*q-cf;
  $('m-big').textContent=brl(lucro); $('m-big').style.color=lucro<0?'var(--bad)':'';
  $('m-pill').innerHTML=mc<=0?`<span class="pill bad">Cada venda dá prejuízo</span>`:lucro>=0?`<span class="pill ok">Acima do ponto de equilíbrio</span>`:`<span class="pill warn">Abaixo do ponto de equilíbrio</span>`;
  const max=Math.max(q,isFinite(pe)?pe:0)*1.15||1;
  $('m-bar').style.width=Math.min(100,q/max*100)+'%'; $('m-mark').style.left=isFinite(pe)?Math.min(99,pe/max*100)+'%':'99%';
  $('m-kv').innerHTML=kv([['Margem de contribuição / un.',brl(mc)],['Margem de contribuição',pct(mcp,1)],['Ponto de equilíbrio',isFinite(pe)?Math.ceil(pe).toLocaleString('pt-BR')+' un.':'não existe'],['Faturamento de equilíbrio',isFinite(pe)?brl(Math.ceil(pe)*p):'—'],['Margem de segurança',isFinite(pe)&&q?pct((q-pe)/q*100,1):'—']]);
}
['m-preco','m-cv','m-dv','m-cf','m-q'].forEach(id=>$(id)?.addEventListener('input',margem));

/* Investimento */
function invest(){
  const v=n('i-v'),m=n('i-m'),inf=n('i-inf'),tipo=$('i-tipo').value,pc=n('i-pct');
  $('i-pct-wrap').hidden=!(tipo==='cdb'||tipo==='lci');
  const sel=tx('selic'),cdi=tx('cdi'),trA=(Math.pow(1+tx('tr')/100,12)-1)*100;
  let t,orig;
  if(tipo==='selic'){t=sel;orig=`Selic meta ${pct(sel)}`}
  else if(tipo==='poup'){t=sel>8.5?(Math.pow(1.005,12)-1)*100+trA:sel*0.7+trA;orig=sel>8.5?`0,5% ao mês + TR (${pct(trA)} ao ano)`:`70% da Selic + TR`}
  else{t=cdi*pc/100;orig=`${pct(pc,0)} do CDI de ${pct(cdi)}`}
  $('i-t').value=t.toFixed(2);$('i-t-src').textContent=orig+(T.exemplo?' · valores de exemplo':` · Banco Central, ${dataBR(T.taxas.cdi?.data)}`);
  const bruto=v*Math.pow(1+t/100,m/12), rend=bruto-v, d=m*30;
  const ir=tipo==='cdb'?(d<=180?22.5:d<=360?20:d<=720?17.5:15):0;
  const liq=v+rend*(1-ir/100), fator=Math.pow(1+inf/100,m/12), real=(liq/fator/v-1)*100;
  $('i-big').textContent=pct(real); $('i-big').style.color=real<0?'var(--bad)':'';
  $('i-pill').innerHTML=real>=0?`<span class="pill ok">Vence a inflação</span>`:`<span class="pill bad">Perde para a inflação</span>`;
  $('i-kv').innerHTML=kv([['Valor bruto no fim',brl(bruto)],['Imposto de renda'+(ir?` (${pct(ir,1)})`:''),brl(rend*ir/100)],['Valor líquido',brl(liq)],['Valor líquido em dinheiro de hoje',brl(liq/fator)]]);
  $('i-v2').textContent=v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  $('i-bar').style.width=Math.max(0,Math.min(100,100/fator))+'%';
  $('i-kv2').innerHTML=kv([[`Daqui a ${m} meses, em poder de compra`,brl(v/fator)],['Perda por deixar parado',brl(v-v/fator)]]);
}
['i-v','i-m','i-pct','i-inf','i-tipo'].forEach(id=>$(id)?.addEventListener('input',invest));

if(has('a-q'))custeio();if(has('m-preco'))margem();aplicarTaxas();
fetch('data/taxas.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject()).then(j=>{T=j;aplicarTaxas()}).catch(()=>{});

/* Animações ligadas à rolagem */
const rc=$('receipt'),cb=$('chipCbs'),ib=$('chipIbs'),old=$('chipOld'),hero=document.querySelector('.hero');
const tl=$('tl'),fill=$('tlFill'),steps=[...document.querySelectorAll('.step')],reels=[...document.querySelectorAll('.reel')];
let ticking=false;
function frame(){
  ticking=false;
  const vh=innerHeight;
  if(!reduce&&rc){
    const p=Math.min(1,Math.max(0,scrollY/(hero.offsetHeight||1)));
    rc.style.transform=`translateY(${p*70}px) rotate(${-7+9*p}deg)`;
    cb.style.transform=`translate(${p*40}px,${-p*50}px) rotate(${4-8*p}deg)`;
    ib.style.transform=`translate(${p*20}px,${p*30}px) rotate(${-3+7*p}deg)`;
    old.style.transform=`translate(${-p*60}px,${p*40}px)`; old.style.opacity=1-p*.8;
    reels.forEach((r,i)=>{const b=r.getBoundingClientRect();const c=(b.top+b.height/2-vh/2)/vh;r.style.transform=`translateY(${c*(i%2?-40:40)}px)`});
  }
  if(!tl)return;
  const b=tl.getBoundingClientRect(), mark=vh*0.6;
  const prog=Math.min(1,Math.max(0,(mark-b.top)/b.height));
  fill.style.height=(prog*(b.height-12))+'px';
  steps.forEach(s=>{const r=s.getBoundingClientRect();s.classList.toggle('on',r.top<mark)});
}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(frame)}},{passive:true});
addEventListener('resize',frame); frame();

/* Cartões sobem ao entrar na tela (já visíveis em repouso) */
if(!reduce&&'IntersectionObserver'in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('pre');io.unobserve(e.target)}}),{threshold:.15});
  document.querySelectorAll('.reveal').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight){el.classList.add('pre');io.observe(el)}});
}


/* QR code e código de barras decorativos da nota de exemplo */
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
(function(){const c=$('qr');if(!c)return;const x=c.getContext('2d'),N=29,u=2;x.fillStyle='#FFFEFA';x.fillRect(0,0,58,58);x.fillStyle='#26302B';
  const finder=(a,b)=>{x.fillRect(a*u,b*u,7*u,7*u);x.fillStyle='#FFFEFA';x.fillRect((a+1)*u,(b+1)*u,5*u,5*u);x.fillStyle='#26302B';x.fillRect((a+2)*u,(b+2)*u,3*u,3*u)};
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){const inF=(i<8&&j<8)||(i>N-9&&j<8)||(i<8&&j>N-9);if(!inF&&rnd()>.52)x.fillRect(i*u,j*u,u,u)}
  finder(0,0);finder(N-7,0);finder(0,N-7)})();
(function(){const s=$('barcode');if(!s)return;let x=0,h='';while(x<236){const w=1+Math.floor(rnd()*3);if(rnd()>.4)h+=`<rect x="${x}" y="0" width="${w}" height="34"/>`;x+=w+1}s.innerHTML=h})();

/* ===== Simulador de carteira ===== */
var cartPronto=false;
const ATIVOS=[
  {k:'poup', ir:'isento'},
  {k:'selic',ir:'regressivo'},
  {k:'cdb',  ir:'regressivo'},
  {k:'lci',  ir:'isento'},
  {k:'ipca', ir:'regressivo', real:7},     // inflação + 7% ao ano (exemplo, editável)
  {k:'fii',  ir:'isento', hip:12},         // hipótese editável
  {k:'acoes',ir:'acoes',  hip:14}];        // hipótese editável
const CARTEIRAS={
  conservadora:{poup:0,selic:40,cdb:20,lci:20,ipca:20,fii:0,acoes:0},
  moderada:    {poup:0,selic:20,cdb:15,lci:15,ipca:25,fii:10,acoes:15},
  arrojada:    {poup:0,selic:10,cdb:10,lci:0, ipca:20,fii:20,acoes:40}};
const IR_TXT={isento:'Isento',regressivo:'Tabela regressiva (15% após 2 anos)',acoes:'15% sobre o lucro na venda'};
const irAliq=(tipo,meses)=>tipo==='isento'?0:tipo==='acoes'?15:(meses*30<=180?22.5:meses*30<=360?20:meses*30<=720?17.5:15);
const fmtCurto=v=>v>=1e6?'R$ '+(v/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mi':v>=1e3?'R$ '+Math.round(v/1e3).toLocaleString('pt-BR')+' mil':'R$ '+Math.round(v);
function poupAno(){const sel=tx('selic'),trA=(Math.pow(1+tx('tr')/100,12)-1)*100;return sel>8.5?(Math.pow(1.005,12)-1)*100+trA:sel*0.7+trA}
function carteiraTaxas(){
  const inf=n('w-inf'),cdi=tx('cdi'),sel=tx('selic'),ex=T.exemplo?' (exemplo)':'';
  const set=(k,v,o,ro)=>{const el=$('w-r-'+k);if(ro||!el.dataset.mexeu)el.value=v.toFixed(2);el.readOnly=!!ro;$('w-o-'+k).textContent=o};
  set('poup',poupAno(),'Regra oficial da poupança'+ex,true);
  set('selic',sel,'Selic de hoje'+ex,true);
  set('cdb',cdi,'CDI de hoje'+ex,true);
  set('lci',cdi*.9,'90% do CDI de hoje'+ex,true);
  set('ipca',(1+inf/100)*(1.07)*100-100,'Inflação + 7% ao ano (exemplo, pode editar)');
  set('fii',12,'Hipótese de média histórica (pode editar)');
  set('acoes',14,'Hipótese de média histórica (pode editar)');
  ATIVOS.forEach(a=>$('w-i-'+a.k).textContent=IR_TXT[a.ir]);
  carteira();
}
function aplicarPreset(nome){const c=CARTEIRAS[nome];ATIVOS.forEach(a=>$('w-p-'+a.k).value=c[a.k]);document.querySelectorAll('.preset').forEach(b=>b.setAttribute('aria-pressed',b.dataset.preset===nome));carteira()}
let serie=[];
function simular(pesos,taxas,ini,apt,meses){
  const st=ATIVOS.map((a,i)=>({a,w:pesos[i],rm:Math.pow(1+taxas[i]/100,1/12)-1,bal:ini*pesos[i],inv:ini*pesos[i]}));
  const out=[];const liq=m=>st.reduce((s,x)=>s+x.bal-Math.max(0,x.bal-x.inv)*irAliq(x.a.ir,m)/100,0);
  out.push(liq(0));
  for(let m=1;m<=meses;m++){st.forEach(x=>{x.bal=x.bal*(1+x.rm)+apt*x.w;x.inv+=apt*x.w});if(m%12===0||m===meses)out.push(liq(m))}
  const bruto=st.reduce((s,x)=>s+x.bal,0),inv=st.reduce((s,x)=>s+x.inv,0);
  return{out,bruto,inv,liq:liq(meses)};
}
function carteira(){
  const ini=n('w-ini'),apt=n('w-apt'),anos=Math.max(1,Math.min(50,Math.round(n('w-anos')))),inf=n('w-inf'),meses=anos*12;
  const p=ATIVOS.map(a=>Math.max(0,n('w-p-'+a.k))),soma=p.reduce((a,b)=>a+b,0);
  const pesos=p.map(v=>soma?v/soma:0),taxas=ATIVOS.map(a=>n('w-r-'+a.k));
  $('w-sum').textContent=pct(soma,0);$('w-sum').classList.toggle('bad',Math.abs(soma-100)>.01);
  const c=simular(pesos,taxas,ini,apt,meses);
  const pp=simular(ATIVOS.map(a=>a.k==='poup'?1:0),taxas,ini,apt,meses);
  const fator=Math.pow(1+inf/100,anos),taxaMedia=pesos.reduce((s,w,i)=>s+w*taxas[i],0);
  $('w-label').textContent=`Sua carteira daqui a ${anos} ${anos===1?'ano':'anos'}`;
  $('w-big').textContent=brl(c.liq);
  $('w-real').textContent=`Equivale a ${brl(c.liq/fator)} em dinheiro de hoje`;
  $('w-pill').innerHTML=Math.abs(soma-100)>.01?`<span class="pill warn">A carteira soma ${pct(soma,0)}; ajuste para 100%</span>`:c.liq>pp.liq?`<span class="pill ok">${brl(c.liq-pp.liq)} a mais que a poupança</span>`:`<span class="pill bad">Rende menos que a poupança</span>`;
  $('w-kv').innerHTML=kv([['Dinheiro que você guardou',brl(c.inv)],['Rendimento bruto',brl(c.bruto-c.inv)],['Imposto de renda estimado',brl(c.bruto-c.liq)],['Rendimento médio da carteira',pct(taxaMedia)+' ao ano'],['Se deixasse tudo na poupança',brl(pp.liq)]]);
  serie=c.out.map((v,i)=>({ano:Math.min(i,anos),cart:v,poup:pp.out[i],inv:ini+apt*Math.min(i*12,meses)}));
  $('w-tab').innerHTML='<thead><tr><th>Ano</th><th>Guardado</th><th>Sua carteira</th><th>Poupança</th><th>Carteira em dinheiro de hoje</th></tr></thead><tbody>'+
    serie.map(r=>`<tr><td>${r.ano}</td><td>${brl(r.inv)}</td><td>${brl(r.cart)}</td><td>${brl(r.poup)}</td><td>${brl(r.cart/Math.pow(1+inf/100,r.ano))}</td></tr>`).join('')+'</tbody>';
  desenhar();
}
function desenhar(){
  const box=$('w-chart');if(!box||!serie.length)return;
  const W=Math.max(280,box.clientWidth),H=box.clientHeight||300,pl=66,pr=W<520?16:112,pt=14,pb=28;
  const maxY=Math.max(...serie.map(r=>Math.max(r.cart,r.poup,r.inv)))*1.06||1,n0=serie.length-1||1;
  const step=[1,2,5].flatMap(m=>[1,10,100,1e3,1e4,1e5,1e6,1e7,1e8].map(e=>m*e)).sort((a,b)=>a-b).find(s=>maxY/s<=5);
  const X=i=>pl+(W-pl-pr)*i/n0,Y=v=>pt+(H-pt-pb)*(1-v/maxY);
  const path=k=>serie.map((r,i)=>`${i?'L':'M'}${X(i).toFixed(1)},${Y(r[k]).toFixed(1)}`).join('');
  let g='';for(let v=0;v<=maxY;v+=step)g+=`<line class="grid" x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}"/><text class="axis" x="${pl-8}" y="${Y(v)+4}" text-anchor="end">${v?fmtCurto(v):'R$ 0'}</text>`;
  const xs=Math.ceil(serie.length/(W<520?5:10));
  serie.forEach((r,i)=>{if((i%xs===0&&n0-i>=xs*0.6)||i===n0)g+=`<text class="axis" x="${X(i)}" y="${H-8}" text-anchor="middle">${r.ano===0?'Hoje':r.ano+'a'}</text>`});
  const last=serie[n0],lbl=[['cart','Sua carteira','var(--chart-1)'],['poup','Poupança','var(--chart-2)']];
  let ends='';if(W>=520){let ys=lbl.map(([k])=>Y(last[k]));if(Math.abs(ys[0]-ys[1])<16){const m=(ys[0]+ys[1])/2,s=ys[0]<ys[1]?-1:1;ys=[m+8*s,m-8*s]}lbl.forEach(([k,t],j)=>ends+=`<text class="lbl" x="${X(n0)+12}" y="${ys[j]+4}">${t}</text>`)}
  box.innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${g}
    <path d="${path('inv')}" fill="none" stroke="color-mix(in srgb,var(--band-ink) 55%,transparent)" stroke-width="1.5" stroke-dasharray="4 3"/>
    <path d="${path('poup')}" fill="none" stroke="var(--chart-2)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="${path('cart')}" fill="none" stroke="var(--chart-1)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${X(n0)}" cy="${Y(last.poup)}" r="4.5" fill="var(--chart-2)" stroke="var(--band)" stroke-width="2"/>
    <circle cx="${X(n0)}" cy="${Y(last.cart)}" r="4.5" fill="var(--chart-1)" stroke="var(--band)" stroke-width="2"/>
    ${ends}<line class="cross" id="w-x" y1="${pt}" y2="${H-pb}" visibility="hidden"/>
    <circle id="w-d1" r="4.5" fill="var(--chart-1)" stroke="var(--band)" stroke-width="2" visibility="hidden"/><circle id="w-d2" r="4.5" fill="var(--chart-2)" stroke="var(--band)" stroke-width="2" visibility="hidden"/>
    <rect x="${pl}" y="0" width="${W-pl-pr}" height="${H}" fill="transparent" id="w-hit"/></svg><div class="tip" id="w-tip" hidden></div>`;
  const hit=$('w-hit'),tip=$('w-tip'),xl=$('w-x'),d1=$('w-d1'),d2=$('w-d2');
  const show=e=>{const r=box.getBoundingClientRect(),cx=(e.touches?e.touches[0].clientX:e.clientX)-r.left;const i=Math.max(0,Math.min(n0,Math.round((cx-pl)/(W-pl-pr)*n0))),d=serie[i];
    xl.setAttribute('x1',X(i));xl.setAttribute('x2',X(i));d1.setAttribute('cx',X(i));d1.setAttribute('cy',Y(d.cart));d2.setAttribute('cx',X(i));d2.setAttribute('cy',Y(d.poup));[xl,d1,d2].forEach(el=>el.setAttribute('visibility','visible'));
    tip.innerHTML=`<b>${d.ano===0?'Hoje':'Daqui a '+d.ano+(d.ano===1?' ano':' anos')}</b><div><span><i style="background:var(--chart-1)"></i>Sua carteira</span><span class="num">${brl(d.cart)}</span></div><div><span><i style="background:var(--chart-2)"></i>Poupança</span><span class="num">${brl(d.poup)}</span></div><div><span><i style="background:var(--muted)"></i>Guardado</span><span class="num">${brl(d.inv)}</span></div>`;
    tip.hidden=false;const tw=tip.offsetWidth;let left=X(i)+14;if(left+tw>W)left=X(i)-tw-14;tip.style.left=Math.max(0,left)+'px';tip.style.top=Math.max(0,Math.min(Y(d.cart),H-tip.offsetHeight)-10)+'px'};
  const hide=()=>{tip.hidden=true;[xl,d1,d2].forEach(el=>el.setAttribute('visibility','hidden'))};
  hit.addEventListener('pointermove',show);hit.addEventListener('pointerdown',show);hit.addEventListener('pointerleave',hide);
}
if(has('w-ini')){
  ['w-ini','w-apt','w-anos'].forEach(id=>$(id).addEventListener('input',carteira));
  $('w-inf').addEventListener('input',carteiraTaxas);
  ATIVOS.forEach(a=>{$('w-p-'+a.k).addEventListener('input',()=>{document.querySelectorAll('.preset').forEach(b=>b.setAttribute('aria-pressed','false'));carteira()});
    $('w-r-'+a.k).addEventListener('input',e=>{e.target.dataset.mexeu='1';carteira()})});
  document.querySelectorAll('.preset').forEach(b=>b.addEventListener('click',()=>aplicarPreset(b.dataset.preset)));
  cartPronto=true;setVal('w-inf',tx('ipca_focus_12m'));
  aplicarPreset('moderada');carteiraTaxas();
  let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(desenhar,120)});
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>requestAnimationFrame(desenhar)));
}
})();
