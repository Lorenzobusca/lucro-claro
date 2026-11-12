/* CONTA: frase curta sobre o plano, usada no painel e na página da conta. */
const dia = d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const diasAte = d => Math.max(0, Math.ceil((new Date(d) - Date.now()) / 864e5));

/* Devolve { texto, tom } para o selo do plano */
export function seloDoPlano(plano) {
  const a = plano.assinatura;
  switch (plano.situacao) {
    case 'demonstracao': return { texto: 'Modo demonstração: salvo só neste aparelho', tom: 'aviso' };
    case 'teste': {
      const n = diasAte(a.acesso_ate);
      return { texto: `Teste grátis do plano completo: ${n === 1 ? 'falta 1 dia' : `faltam ${n} dias`}`, tom: 'ok' };
    }
    case 'ativa': return { texto: 'Plano completo', tom: 'ok' };
    case 'atrasada': return { texto: `Pagamento em aberto. Plano completo até ${dia(a.acesso_ate)}`, tom: 'aviso' };
    case 'cancelada': return { texto: `Assinatura cancelada. Plano completo até ${dia(a.acesso_ate)}`, tom: 'aviso' };
    default: return { texto: 'Plano grátis', tom: 'neutro' };
  }
}

export { dia, diasAte };
