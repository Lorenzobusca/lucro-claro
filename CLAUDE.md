# Lastrion

Dois sites com a mesma marca, em português do Brasil, para o MEI e o pequeno negócio (público sem formação em finanças,
quase sempre no celular, desconfiado de sites que pedem dados):
- `site/` → lastrion.com.br: institucional, SEO, calculadora grátis sem cadastro.
- `app/` → app.lastrion.com.br: ferramentas com login (Supabase), dados no servidor e assinatura (Asaas).

O dono do projeto está aprendendo a programar: explique em linguagem simples e em português.
O repositório e a pasta continuam se chamando `lucro-claro` (nome provisório antigo). Passo a passo de publicação: `CONFIGURAR.md`.

## Estrutura

- `compartilhado/`: tudo o que os dois sites usam.
  - `config/valores-legais.js`: limite do MEI por ano, tolerância, DAS, limite do Simples, com fonte e data. Único lugar com números da lei.
  - `config/planos.js`: preço (null = "em breve"), dias de teste, limites do grátis, `FERRAMENTAS_PAGAS` (painel → frase do ganho),
    domínios e WhatsApp. Limites e ferramentas pagas precisam bater com `servidor/banco.sql` (função `verificar_plano`).
  - `css/`: `tokens.css` (cores, fontes; toda cor nova entra aqui), `base.css`, `componentes.css` (peças dos dois sites),
    `paginas.css` (só o app). O site carrega tokens + base + componentes + `site/css/site.css`.
  - `js/calculo/`: só contas, funções puras. `retirada.js` e `limite.js` são as calculadoras do site.
  - `js/telas/`: uma por ferramenta do app. Cada uma termina com `registrarTour(...)`.
  - `js/ui/`: `base.js` (tema, rolagem, taxas na tela), `abas.js`, `grafico.js`, `numero.js`, `taxas.js`, `glossario.js`,
    `apoio.js` (exemplo por `?ex=` e "O que isso quer dizer"), `tour.js`, `trilha.js`, `plano-atual.js` (plano de quem usa;
    `limite('metas')`), `enderecos.js` (links entre os sites; no localhost viram /site e /app).
  - `data/taxas.json`: taxas do Banco Central, atualizadas todo dia útil pelo GitHub Actions (`scripts/atualizar-taxas.mjs`).
- `site/`: `index.html` (hero com a dor + calculadora, "é pra você se", como funciona, história da Rita, ferramentas pelo
  problema, preço, confiança, dúvidas, CTA, WhatsApp fixo), `privacidade.html` e `termos.html` (rascunhos para revisão jurídica).
- `app/`: `index.html` (painel), `entrar.html`, `assinatura.html`, e as ferramentas `comece`, `impostos`, `custeio`, `metas`, `planejamento`.
  - Toda página carrega um só script: `js/conta/iniciar.js` com `data-telas="..."`. Ele confere o login, lê o plano, baixa os dados,
    aplica os cadeados (`js/conta/plano.js`), preenche os campos e só então importa as telas. Salva sozinho (campos de cada painel
    em `campos-<id do painel>`, metas em `metas`, trilha em `trilha`) e mostra o status em `#nuvem`.
  - `js/conta/supabase.js`: login e banco via fetch, sem biblioteca. `config.js` tem só a URL e a chave pública.
  - `js/conta/chegada.js`: o cálculo feito no site chega por parâmetros no link (`?calc=retirada&vendas=…`).
  - `api/`: funções Node do Vercel (`assinar`, `cancelar`, `excluir-conta`, `webhook-asaas`). Segredos só em variáveis de ambiente.
- `servidor/banco.sql`: tabelas `assinaturas`, `dados`, `eventos_asaas`, RLS e gatilhos (teste de 14 dias na conta nova; limite do grátis).
  O plano completo vale enquanto `assinaturas.acesso_ate` estiver no futuro.
- `scripts/montar.sh`: monta `dist/` de cada site (arquivos da pasta + `compartilhado/`). As páginas usam `../compartilhado/…`.
- `rascunhos/`: não vai para o ar (página inicial antiga, propostas de logo, páginas de teste em `rascunhos/teste/`).

Sem build e sem dependências no navegador: módulos ES puros.

Chaves do localStorage: `lc-tema`, `lc-tab`, `lc-metas-v1`, `lc-trilha`, `lc-tour-<ferramenta>`, `lc-sessao`, `lc-chegada`,
`lc-chegada-feita`, `lc-demo-dados`, `lc-site-calc` (esta no domínio do site). Não renomear.

## Como testar

Precisa de servidor local (Live Server do VS Code, aberto na raiz do projeto). Sem Supabase configurado, o app roda em modo
demonstração (`?plano=gratis` mostra os cadeados). Não há Node nem Python nesta máquina: o teste é pelo Chrome sem janela,
com as páginas de `rascunhos/teste/` (contas, largura a 360px, valores dos campos, internet lenta, funções da API).

## Visual

Conceito "painel vivo": fundo neutro, tinta grafite e uma cor forte por setor (início amarelo, impostos coral, custeio azul,
metas verde, planejamento roxo), via `data-setor`. Tema claro e escuro. Cartão de resultado sempre escuro.
Identidade "base firme": símbolo do "L" com a base na cor do setor (`compartilhado/img/simbolo.svg`), tagline
"Base firme para lucrar mais.". No app, menu em pílula no topo; no celular, barra fixa embaixo. Nada pode depender de animação para aparecer.

## Decisões já tomadas

- É gestão (custos, preço, metas, caixa), não contabilidade oficial. Não usar "contábil" nem prometer substituir contador.
- Calculadoras são simulações educativas; manter os avisos e as fontes (LC 214/2025, LC 123/2006, LC 238/2026, Banco Central).
- Grátis × pago: as contas são grátis; o pago é guardar mais, ferramentas extras e avisos. Ferramentas pagas: base zero, perdas,
  ABC, IBS/CBS e carteira. Grátis: 2 metas, 3 meses de caixa, 3 produtos, sem meses anteriores das metas.
- Hospedagem: Vercel (dois projetos, Root Directory `site` e `app`). Gateway: Asaas. Login: Supabase (link mágico + código, Google).
- Preço ainda não definido. Depoimentos: só reais, com autorização; o bloco fica `hidden` até existirem.

## Linguagem

Frases curtas, falando com "você", sem jargão. Termo técnico vem com explicação de uma linha na primeira vez.
Não inventar estatísticas, depoimentos, números de usuários nem selos; dado externo só com fonte ou marcado [FONTE A CONFIRMAR].
Exemplos numéricos são fictícios, marcados como exemplo, e as contas precisam fechar.

## Ideias na fila

Login por WhatsApp, avisos (meta atrasando, caixa faltando, perto do limite), agente de metas, DRE gerencial,
controle de receitas do MEI, Simples "por dentro" × IBS/CBS "por fora", custo de funcionário.
