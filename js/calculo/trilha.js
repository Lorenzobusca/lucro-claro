/* CÁLCULO: a trilha "Comece por aqui".
   1) Regra do diagnóstico: por qual etapa a pessoa deve começar.
   2) O negócio de exemplo (Padaria Pão da Esquina), com os resultados calculados pelas próprias
      ferramentas do site, para os números baterem em todas as etapas. */
import { calcularProdutos } from './produtos.js';
import { calcularMargem } from './margem.js';
import { calcularPreco } from './preco.js';
import { calcularBaseZero } from './basezero.js';
import { calcularCaixa } from './caixa.js';
import { calcularPerdas } from './perdas.js';

export const TOTAL_ETAPAS = 7;

/* respostas: { custos: 'sim'|'nao'|'maisoumenos', margem: 'sim'|'nao'|'maisoumenos', dor: 'sobra'|'preco'|'vendas'|'organizacao' }
   Devolve o número da etapa por onde começar. */
export function etapaInicial({ custos, margem, dor }) {
  if (dor === 'organizacao') return 1;
  if (custos !== 'sim') return 2;
  if (margem !== 'sim') return 3;
  return { sobra: 2, preco: 5, vendas: 3 }[dor] || 1;
}

/* ---------- Padaria Pão da Esquina ---------- */
export const PADARIA = {
  nome: 'Padaria Pão da Esquina',
  dona: 'Célia',
  retirada: 2000,                       /* o que a Célia tira por mês para a casa (pró-labore) */
  taxaCartao: 5,                        /* % de cada venda que fica com a maquininha */
  produtos: [
    { nome: 'Pão francês (kg)', preco: 18, custoVariavel: 11, quantidade: 1500 },
    { nome: 'Bolo de pote', preco: 12, custoVariavel: 4, quantidade: 400 },
    { nome: 'Refrigerante (lata)', preco: 6, custoVariavel: 4.5, quantidade: 900 },
  ],
  /* Custos fixos do mês. A retirada entra aqui: é uma conta fixa como as outras. */
  gastos: [
    { nome: 'Retirada da dona (pró-labore)', valor: 2000, decisao: 'manter', novoValor: 0 },
    { nome: 'Aluguel', valor: 3000, decisao: 'manter', novoValor: 0 },
    { nome: 'Ajudante (salário e encargos)', valor: 2600, decisao: 'manter', novoValor: 0 },
    { nome: 'Energia e gás', valor: 1200, decisao: 'reduzir', novoValor: 1000 },
    { nome: 'Contador, internet e sistema', valor: 700, decisao: 'manter', novoValor: 0 },
    { nome: 'Assinaturas, anúncios e tarifas', valor: 500, decisao: 'reduzir', novoValor: 200 },
  ],
  precoNovoRefri: 7,                    /* o preço que a Célia escolhe na etapa 5 */
  precoConcorrente: 7,
  lucroDesejado: 10,                    /* % do preço */
  caixa: { saldoInicial: 1000, forno: 12000, mesDoForno: 2 },
  perdas: { perdaMensal: 600, reducao: 50 },
};

/* Tudo o que a história precisa, calculado pelas mesmas funções das ferramentas */
export function resultadosPadaria() {
  const P = PADARIA, dv = P.taxaCartao;
  const comTaxa = p => ({ ...p, despesasVariaveis: dv });
  const fixosAntes = P.gastos.reduce((s, g) => s + g.valor, 0);

  /* Etapa 2: custos fixos revistos */
  const baseZero = calcularBaseZero(P.gastos);
  const fixosDepois = baseZero.depois;

  /* Etapa 3: margem por produto, antes das mudanças */
  const antes = calcularProdutos(P.produtos.map(comTaxa), fixosAntes);
  const pctFixos = Math.round(fixosAntes / antes.faturamento * 100);   /* parte dos custos fixos no preço */

  /* Etapa 4: ponto de equilíbrio olhando só o pão francês */
  const pao = P.produtos[0];
  const soPao = calcularMargem({ preco: pao.preco, custoVariavel: pao.custoVariavel, despesasVariaveis: dv, custosFixos: fixosAntes, quantidade: pao.quantidade });

  /* Etapa 5: preço do refrigerante */
  const refri = P.produtos[2];
  const preco = calcularPreco({ custo: refri.custoVariavel, despesasVariaveis: dv, custosFixos: pctFixos, lucro: P.lucroDesejado, precoConcorrente: P.precoConcorrente });
  const produtosDepois = P.produtos.map((p, i) => comTaxa(i === 2 ? { ...p, preco: P.precoNovoRefri } : p));
  const depois = calcularProdutos(produtosDepois, fixosDepois);

  /* Etapa 6: caixa de seis meses. Mês 1 ainda do jeito antigo; do mês 2 em diante com preço novo e cortes;
     o forno quebra no mês 2. Saídas não incluem a retirada: a ferramenta a trata separada. */
  const saidasAntes = antes.faturamento - antes.contribuicao + (fixosAntes - P.retirada);
  const saidasDepois = depois.faturamento - depois.contribuicao + (fixosDepois - P.retirada);
  const meses = [1, 2, 3, 4, 5, 6].map(m => ({
    entradas: m === 1 ? antes.faturamento : depois.faturamento,
    saidas: (m === 1 ? saidasAntes : saidasDepois) + (m === P.caixa.mesDoForno ? P.caixa.forno : 0),
  }));
  const caixa = calcularCaixa({ saldoInicial: P.caixa.saldoInicial, retirada: P.retirada, meses });
  const parcela = P.caixa.forno / 3;
  const mesesParcelado = meses.map((m, i) => ({ entradas: m.entradas, saidas: (i === 0 ? saidasAntes : saidasDepois) + (i >= 1 && i <= 3 ? parcela : 0) }));
  const caixaParcelado = calcularCaixa({ saldoInicial: P.caixa.saldoInicial, retirada: P.retirada, meses: mesesParcelado });

  /* Bônus: perdas */
  const perdas = calcularPerdas({ perdaMensal: P.perdas.perdaMensal, margemPct: Math.round(antes.contribuicao / antes.faturamento * 100), faturamento: antes.faturamento, reducao: P.perdas.reducao });

  return {
    fixosAntes, fixosDepois, baseZero, pctFixos,
    antes, depois, soPao, preco,
    refriDepois: depois.itens[2],
    meses, caixa, mesesParcelado, caixaParcelado, parcela,
    perdas,
    /* números que aparecem em várias etapas, já arredondados como a tela mostra */
    lucroAntes: antes.lucro, lucroDepois: depois.lucro, ganho: depois.lucro - antes.lucro,
  };
}

/* Valores de cada campo das ferramentas, para o botão "Testar com exemplo" */
export function camposPadaria() {
  const P = PADARIA, r = resultadosPadaria(), dv = String(P.taxaCartao);
  const linha = (n, p) => ({ [`pr${n}-nome`]: p.nome, [`pr${n}-p`]: String(p.preco), [`pr${n}-cv`]: String(p.custoVariavel), [`pr${n}-dv`]: dv, [`pr${n}-q`]: String(p.quantidade) });
  const gasto = (n, g) => ({ [`bz${n}-nome`]: g.nome, [`bz${n}-v`]: String(g.valor), [`bz${n}-d`]: g.decisao, [`bz${n}-n`]: g.decisao === 'reduzir' ? String(g.novoValor) : '' });
  const mes = (n, m) => ({ [`cx${n}-e`]: String(m.entradas), [`cx${n}-s`]: String(m.saidas) });
  const pao = P.produtos[0], refri = P.produtos[2];
  return {
    produtos: Object.assign({ 'pr-cf': String(r.fixosAntes), 'pr4-nome': '', 'pr4-p': '', 'pr4-cv': '', 'pr4-dv': '', 'pr4-q': '' }, ...P.produtos.map((p, i) => linha(i + 1, p))),
    margem: { 'm-preco': String(pao.preco), 'm-cv': String(pao.custoVariavel), 'm-dv': dv, 'm-cf': String(r.fixosAntes), 'm-q': String(pao.quantidade) },
    preco: { 'pc-custo': String(refri.custoVariavel), 'pc-dv': dv, 'pc-cf': String(r.pctFixos), 'pc-lucro': String(P.lucroDesejado), 'pc-conc': String(P.precoConcorrente) },
    basezero: Object.assign({}, ...P.gastos.map((g, i) => gasto(i + 1, g))),
    caixa: Object.assign({ 'cx-saldo': String(P.caixa.saldoInicial), 'cx-retirada': String(P.retirada) }, ...r.meses.map((m, i) => mes(i + 1, m))),
    perdas: { 'pe-perda': String(P.perdas.perdaMensal), 'pe-margem': String(Math.round(r.antes.contribuicao / r.antes.faturamento * 100)), 'pe-fat': String(r.antes.faturamento), 'pe-red': String(P.perdas.reducao) },
  };
}
