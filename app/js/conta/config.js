/* CONFIGURAÇÃO PÚBLICA DO APP: endereço do projeto no Supabase e a chave pública ("anon").
   Os dois ficam em Supabase → Project Settings → API. Podem ficar no navegador: são feitos para isso.
   Quem garante que cada pessoa só vê os próprios dados são as regras do banco (servidor/banco.sql).

   NUNCA coloque aqui a chave "service_role" nem a chave do Asaas: essas ficam só nas variáveis de ambiente do Vercel.

   Enquanto os dois campos estiverem vazios, o app abre em "modo demonstração": sem login e sem salvar nada no servidor.
   Para testar o plano grátis nesse modo, acrescente ?plano=gratis no endereço. */

export const SUPABASE_URL = '';        /* ex.: 'https://abcdefgh.supabase.co' */
export const SUPABASE_ANON_KEY = '';   /* começa com 'eyJ…' ou 'sb_publishable_…' */
