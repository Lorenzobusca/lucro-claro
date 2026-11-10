# Lastrion

Site estático em português do Brasil com calculadoras gratuitas para MEIs, pequenas empresas e pessoas físicas.
O dono do projeto está aprendendo a programar: explique em linguagem simples e em português.

O nome do site é Lastrion. O repositório e a pasta continuam se chamando `lucro-claro` (nome provisório antigo).

## Estrutura

Páginas (topo e rodapé são repetidos nas cinco; ao mudar um, mude em todas):
- `index.html`: apresentação, faixa de taxas do dia, 4 setores, linha do tempo da reforma, dúvidas, vídeos
- `impostos.html`: MEI, Simples Nacional, IBS/CBS por ano da reforma
- `custeio.html`: absorção × ABC, margem de contribuição e ponto de equilíbrio
- `metas.html`: orçamento e metas, versão grátis salva no navegador (localStorage, até 5 metas)
- `planejamento.html`: simulador de carteira, investimento × inflação, taxas do dia

Estilo, carregado nesta ordem:
- `css/tokens.css`: cores, fontes, espaçamentos e tempos de animação. Toda cor nova entra aqui
- `css/base.css`: reset, tipografia, `.wrap`, `.secao`, entrada na rolagem (`.revelar`), transição entre páginas
- `css/componentes.css`: peças compartilhadas (menu, botões, cartões, campos, abas, resultado, rodapé)
- `css/paginas.css`: o que é próprio de cada página

JavaScript em módulos ES (`<script type="module">`), sem build e sem dependências:
- `js/calculo/*.js`: só as contas, sem tocar na tela (funções puras)
- `js/telas/*.js`: uma por ferramenta; lê os campos, chama `calculo/` e escreve o resultado
- `js/ui/*.js`: compartilhado. `base.js` (tema, rolagem, taxas na tela), `abas.js`, `grafico.js`,
  `numero.js` (ler e formatar números), `taxas.js` (carrega `data/taxas.json`)

Dados:
- `data/taxas.json`: taxas do Banco Central, atualizadas todo dia útil pelo GitHub Actions
  (`scripts/atualizar-taxas.mjs`); o bloco `reforma` é editado à mão
- `notas/`: notas do Obsidian

Chaves do localStorage: `lc-tema`, `lc-tab`, `lc-metas-v1`. Não renomear: quem já usa o site perderia as metas salvas.

## Como testar

Módulos ES não funcionam abrindo o arquivo direto (`file://`): é preciso um servidor local,
como a extensão Live Server do VS Code. Neste computador não há Node nem Python instalados.

## Visual

Conceito "painel vivo": fundo neutro, tinta grafite e uma cor forte por setor em blocos grandes
(início amarelo, impostos coral, custeio azul, metas verde, planejamento roxo). A cor vem do atributo
`data-setor` no `<html>` ou no bloco. Tema claro e escuro, com botão no topo. Cartão de resultado sempre escuro.
Menu em pílula no topo; no celular, barra fixa embaixo.

O nome precisa ficar bem aparente: marca grande no topo (quadrado com "L" na cor do setor + "Lastrion"),
selo com o nome acima do título da página inicial e o nome gigante fechando o rodapé (`.rodape-nome`).

Manter as animações de rolagem da página inicial: nota fiscal do topo, linha do tempo e celulares dos vídeos.
Nenhum conteúdo pode depender de animação para aparecer.

## Decisões já tomadas

- É gestão (custos, preço, metas, caixa), não contabilidade oficial. Não usar "contábil" nem prometer substituir contador.
- Calculadoras são simulações educativas; manter os avisos e as fontes (LC 214/2025, LC 123/2006, Banco Central).
- Versão paga "Fábrica ao vivo" (equipe lança pelo celular) ainda não existe: precisa de login, banco de dados, cobrança e LGPD.
- Hospedagem planejada: Vercel, ligado a este repositório. Cada envio para o `main` atualiza o site no ar.

## Ideias na fila

Formação de preço de venda, fluxo de caixa, DRE gerencial, controle de receitas do MEI,
Simples "por dentro" × IBS/CBS "por fora", custo de funcionário.
