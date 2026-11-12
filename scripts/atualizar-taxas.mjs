// Busca as taxas no Banco Central e grava em compartilhado/data/taxas.json.
// Roda sozinho todo dia pelo GitHub Actions (.github/workflows/atualizar-taxas.yml).
// Para testar no seu computador: node scripts/atualizar-taxas.mjs
import { readFile, writeFile } from "node:fs/promises";

const ARQUIVO = new URL("../compartilhado/data/taxas.json", import.meta.url);
const HEADERS = { "Accept": "application/json", "User-Agent": "lastrion-taxas/1.0" };

async function getJson(url, tentativas = 3) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (i === tentativas) throw e;
      await new Promise(res => setTimeout(res, 2000 * i));
    }
  }
}

// "04/11/2026" -> "2026-11-04"
const isoData = d => d.split("/").reverse().join("-");

async function serieSgs(codigo) {
  const json = await getJson(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/1?formato=json`);
  const ultimo = json.at(-1);
  return { valor: Number(String(ultimo.valor).replace(",", ".")), data: isoData(ultimo.data) };
}

async function focusIpca12m() {
  const filtro = encodeURIComponent("Indicador eq 'IPCA' and Suavizada eq 'S' and baseCalculo eq 0");
  const url = "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoInflacao12Meses"
    + `?$top=1&$orderby=Data%20desc&$filter=${filtro}&$format=json&$select=Data,Mediana`;
  const json = await getJson(url);
  const item = json.value[0];
  return { valor: Number(item.Mediana), data: item.Data };
}

const dados = JSON.parse(await readFile(ARQUIVO, "utf8"));
let ok = 0, falhas = [];

for (const [nome, info] of Object.entries(dados.taxas)) {
  try {
    const novo = info.serie_sgs ? await serieSgs(info.serie_sgs) : await focusIpca12m();
    if (!Number.isFinite(novo.valor)) throw new Error("valor inválido");
    Object.assign(info, novo);
    ok++;
    console.log(`✓ ${nome}: ${novo.valor} (${novo.data})`);
  } catch (e) {
    falhas.push(nome);
    console.warn(`✗ ${nome}: ${e.message} — mantido o valor anterior (${info.valor})`);
  }
}

if (ok > 0) {
  dados.atualizado_em = new Date().toISOString();
  dados.exemplo = false;
  await writeFile(ARQUIVO, JSON.stringify(dados, null, 2) + "\n");
}
console.log(`${ok} taxas atualizadas, ${falhas.length} falharam.`);
if (ok === 0) process.exit(1);
