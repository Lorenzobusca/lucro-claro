# Lucro Claro (nome provisório)

Site estático em português do Brasil com calculadoras gratuitas para MEIs, pequenas empresas e pessoas físicas.
O dono do projeto está aprendendo a programar: explique em linguagem simples e em português.

## Estrutura
- `index.html`: página inicial (apresentação, 4 setores, linha do tempo da reforma, dúvidas, vídeos)
- `impostos.html`: MEI, Simples Nacional, IBS/CBS por ano da reforma
- `custeio.html`: absorção × ABC, margem de contribuição e ponto de equilíbrio
- `metas.html` + `js/metas.js`: orçamento e metas, versão grátis salva no navegador (localStorage, até 5 metas)
- `planejamento.html`: simulador de carteira, investimento × inflação, taxas do dia
- `css/estilo.css`: um único estilo para todas as páginas; cores no topo, em `:root`
- `js/app.js`: calculadoras, gráfico e animações de rolagem (serve todas as páginas)
- `data/taxas.json`: taxas do Banco Central, atualizadas todo dia útil pelo GitHub Actions
  (`scripts/atualizar-taxas.mjs`); o bloco `reforma` é editado à mão
- `notas/`: notas do Obsidian

Sem build e sem dependências. Para ver localmente: `python3 -m http.server 8000` ou a extensão Live Server.

## Visual
Conceito "caderno de contabilidade moderno": papel claro pautado, valores em azul (caneta), vermelho só
para negativo, marca-texto amarelo, avisos em carimbo, menu em abas de fichário (barra fixa embaixo no celular).
Manter as animações de rolagem: nota fiscal do topo, linha do tempo e celulares dos vídeos.

## Decisões já tomadas
- É gestão (custos, preço, metas, caixa), não contabilidade oficial. Não usar "contábil" no nome nem prometer substituir contador.
- Calculadoras são simulações educativas; manter os avisos e as fontes (LC 214/2025, LC 123/2006, Banco Central).
- Versão paga "Fábrica ao vivo" (equipe lança pelo celular) ainda não existe: precisa de login, banco de dados, cobrança e LGPD.
- Nome definitivo ainda em aberto. Hospedagem planejada: Vercel, ligado a este repositório.

## Ideias na fila
Formação de preço de venda, fluxo de caixa, DRE gerencial, controle de receitas do MEI,
Simples "por dentro" × IBS/CBS "por fora", custo de funcionário.
