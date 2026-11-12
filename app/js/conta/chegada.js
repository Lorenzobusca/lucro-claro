/* CONTA: o cálculo que a pessoa fez no site (lastrion.com.br) antes de criar a conta.
   O site manda os números pelo endereço do link (?calc=retirada&vendas=…). A página de entrar guarda
   em "lc-chegada" e também repassa no link do e-mail, para funcionar mesmo se o e-mail abrir em outro aparelho.
   Na primeira vez que o app abre com a conta, os números viram os campos das ferramentas certas. */
import { calcularRetirada } from '../../../compartilhado/js/calculo/retirada.js';
import { VALORES_LEGAIS } from '../../../compartilhado/config/valores-legais.js';

const CHAVE = 'lc-chegada';
const CAMPOS = ['calc', 'vendas', 'gastos', 'atividade', 'reserva', 'faturado', 'abertura', 'sm'];
const numero = v => { const n = Number(v); return isFinite(n) && n >= 0 ? n : 0; };

/* Lê os parâmetros do endereço; se houver um cálculo, guarda no aparelho. Devolve o texto para repassar no link. */
export function guardarChegadaDoEndereco() {
  const p = new URLSearchParams(location.search);
  if (!['retirada', 'limite'].includes(p.get('calc'))) return '';
  const c = Object.fromEntries(CAMPOS.filter(k => p.has(k)).map(k => [k, p.get(k)]));
  try { localStorage.setItem(CHAVE, JSON.stringify(c)); } catch (e) {}
  return new URLSearchParams(c).toString();
}

export function lerChegada() {
  guardarChegadaDoEndereco();
  let c = null;
  try { c = JSON.parse(localStorage.getItem(CHAVE)); } catch (e) {}
  return c && ['retirada', 'limite'].includes(c.calc) ? c : null;
}

/* Junta o cálculo aos dados da conta, sem apagar nada que a pessoa já tenha salvo naquela ferramenta.
   Devolve os dados atualizados; chegada.novos guarda o que foi criado, para salvar na conta em seguida. */
export function aplicarChegada(c, dados) {
  const tem = id => dados.some(d => d.ferramenta === 'campos-' + id);
  const novos = [];
  const atividade = ['mei-com', 'mei-serv', 'mei-ambos'].includes(c.atividade) ? c.atividade : 'mei-com';

  if (c.calc === 'retirada' && !tem('p-caixa')) {
    const vendas = numero(c.vendas), gastos = numero(c.gastos);
    const r = calcularRetirada({ vendas, gastos, atividade, salarioMinimo: numero(c.sm) || VALORES_LEGAIS.salarioMinimoReserva, reservaPct: numero(c.reserva) });
    /* No fluxo de caixa, "sai" é sem a retirada: os gastos do negócio mais o DAS.
       Os outros meses e o saldo começam vazios, para não misturar com os números do exemplo da página. */
    const campos = { 'cx-saldo': '', 'cx-retirada': String(Math.floor(r.podeTirar)), 'cx1-e': String(vendas), 'cx1-s': String(Math.round((gastos + r.das) * 100) / 100) };
    for (let m = 2; m <= 12; m++) { campos[`cx${m}-e`] = ''; campos[`cx${m}-s`] = ''; }
    novos.push({ ferramenta: 'campos-p-caixa', conteudo: { campos } });
  }
  if (c.calc === 'limite' && !tem('p-simples')) {
    const faturado = numero(c.faturado), mes = Math.max(1, new Date().getMonth() + 1);
    const abertura = numero(c.abertura), meses = abertura >= 1 && abertura <= mes ? mes - abertura + 1 : mes;
    novos.push({ ferramenta: 'campos-p-simples', conteudo: { campos: {
      's-tipo': atividade, 's-12': String(faturado), 's-mes': String(Math.round(faturado / meses)),
    } } });
  }

  try { localStorage.removeItem(CHAVE); localStorage.setItem('lc-chegada-feita', c.calc); } catch (e) {}
  c.novos = novos;
  return dados.concat(novos);
}
