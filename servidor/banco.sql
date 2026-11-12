-- LASTRION: banco de dados do app (Supabase).
-- Rode uma vez em Supabase → SQL Editor → New query → cole tudo → Run.
-- Pode rodar de novo sem estragar nada: cada parte confere se já existe.
--
-- Regra principal: cada pessoa só lê e grava os próprios dados (Row Level Security).
-- Quem mexe na assinatura é só o servidor (funções em app/api/, com a chave secreta).

-- ============ Tabelas ============

-- Situação da assinatura de cada pessoa. "acesso_ate" decide tudo: plano completo enquanto for no futuro.
create table if not exists public.assinaturas (
  usuario_id             uuid primary key references auth.users(id) on delete cascade,
  status                 text not null default 'teste'
                         check (status in ('teste', 'aguardando', 'ativa', 'atrasada', 'cancelada')),
  plano                  text check (plano in ('mensal', 'anual')),
  forma                  text check (forma in ('PIX', 'CREDIT_CARD')),
  acesso_ate             timestamptz not null default now(),
  proximo_vencimento     date,
  link_pagamento         text,
  asaas_customer_id      text,
  asaas_subscription_id  text unique,
  criado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now()
);

-- O que a pessoa salva em cada ferramenta. "ferramenta" é o nome do que foi salvo
-- (ex.: 'campos-p-margem' para os campos da margem, 'metas', 'trilha').
create table if not exists public.dados (
  usuario_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ferramenta     text not null check (char_length(ferramenta) between 1 and 60),
  conteudo       jsonb not null,
  atualizado_em  timestamptz not null default now(),
  primary key (usuario_id, ferramenta),
  constraint dados_tamanho check (pg_column_size(conteudo) < 200000)
);

-- Avisos do Asaas já processados (para não contar o mesmo pagamento duas vezes)
create table if not exists public.eventos_asaas (
  id           text primary key,
  evento       text,
  recebido_em  timestamptz not null default now()
);

-- ============ Quem pode o quê ============

alter table public.assinaturas   enable row level security;
alter table public.dados         enable row level security;
alter table public.eventos_asaas enable row level security;   -- sem regra = ninguém de fora acessa

revoke all on public.assinaturas, public.dados, public.eventos_asaas from anon, authenticated;
grant select on public.assinaturas to authenticated;
grant select, insert, update, delete on public.dados to authenticated;

drop policy if exists "ver a propria assinatura" on public.assinaturas;
create policy "ver a propria assinatura" on public.assinaturas
  for select to authenticated using (usuario_id = (select auth.uid()));

drop policy if exists "ver os proprios dados" on public.dados;
create policy "ver os proprios dados" on public.dados
  for select to authenticated using (usuario_id = (select auth.uid()));

drop policy if exists "criar os proprios dados" on public.dados;
create policy "criar os proprios dados" on public.dados
  for insert to authenticated with check (usuario_id = (select auth.uid()));

drop policy if exists "mudar os proprios dados" on public.dados;
create policy "mudar os proprios dados" on public.dados
  for update to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

drop policy if exists "apagar os proprios dados" on public.dados;
create policy "apagar os proprios dados" on public.dados
  for delete to authenticated using (usuario_id = (select auth.uid()));

-- ============ Plano ============

-- Plano completo liberado? (teste grátis, assinatura em dia ou período já pago)
create or replace function public.tem_plano_completo(uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.assinaturas a where a.usuario_id = uid and a.acesso_ate > now());
$$;
revoke all on function public.tem_plano_completo(uuid) from public, anon;

-- Antes de salvar: confere o que o plano grátis permite.
-- As ferramentas e o limite de metas devem bater com compartilhado/config/planos.js.
create or replace function public.verificar_plano()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  metas_novas int;
  metas_antes int := 0;
begin
  new.atualizado_em := now();
  if public.tem_plano_completo(new.usuario_id) then
    return new;
  end if;

  if new.ferramenta in ('campos-p-iva', 'campos-p-custeio', 'campos-p-perdas', 'campos-p-zero', 'campos-p-carteira') then
    raise exception 'Esta ferramenta é do plano completo' using errcode = 'P0001';
  end if;

  if new.ferramenta = 'metas' and coalesce((new.conteudo ->> 'exemplo')::boolean, false) = false then
    metas_novas := coalesce(jsonb_array_length(new.conteudo -> 'metas'), 0);
    if tg_op = 'UPDATE' then
      metas_antes := coalesce(jsonb_array_length(old.conteudo -> 'metas'), 0);
    end if;
    -- quem já tinha mais metas (do teste ou de uma assinatura antiga) não perde: só não cria novas
    if metas_novas > 2 and metas_novas > metas_antes then
      raise exception 'O plano grátis guarda até 2 metas' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists verificar_plano on public.dados;
create trigger verificar_plano before insert or update on public.dados
  for each row execute function public.verificar_plano();

-- Conta nova: começa com 14 dias de teste do plano completo, sem cartão.
-- Se mudar os dias aqui, mude também em compartilhado/config/planos.js (diasDeTeste).
create or replace function public.criar_assinatura_inicial()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.assinaturas (usuario_id, status, acesso_ate)
  values (new.id, 'teste', now() + interval '14 days')
  on conflict (usuario_id) do nothing;
  return new;
end;
$$;

drop trigger if exists criar_assinatura_inicial on auth.users;
create trigger criar_assinatura_inicial after insert on auth.users
  for each row execute function public.criar_assinatura_inicial();
