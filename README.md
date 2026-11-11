# Lastrion

Site com calculadoras gratuitas para MEIs, pequenas empresas e pessoas físicas:
impostos da reforma tributária (IBS/CBS), Simples Nacional, custeio por absorção e ABC,
margem de contribuição, orçamento e metas, e investimentos contra a inflação.

O repositório e a pasta ainda se chamam `lucro-claro`, que era o nome provisório.

## Onde fica cada coisa

### Páginas

| Arquivo | O que tem |
|---|---|
| `index.html` | Página inicial: apresentação, taxas do dia, os quatro setores, reforma, dúvidas e vídeos |
| `impostos.html` | Setor 1: MEI, Simples Nacional e IBS/CBS |
| `custeio.html` | Setor 2: absorção × ABC, margem e ponto de equilíbrio |
| `metas.html` | Setor 3: metas do mês, fluxo de caixa e orçamento base zero |
| `planejamento.html` | Setor 4: simulador de carteira, taxas de hoje e investimento × inflação |
| `comece.html` | Trilha "Comece por aqui": diagnóstico, 7 etapas com um negócio de exemplo e progresso salvo no navegador |
| `logo-preview.html` | Temporária: as 3 propostas de logo para escolher |

O topo (menu) e o rodapé são iguais nas cinco páginas. Ao mudar um deles, mude nas cinco.

### Visual (`css/`)

| Arquivo | O que tem |
|---|---|
| `tokens.css` | Cores, fontes, espaçamentos e tempos de animação. Para mudar a identidade visual, mexa só aqui |
| `base.css` | Regras gerais: texto, títulos, largura da página, entrada dos elementos na rolagem |
| `componentes.css` | Peças usadas em várias páginas: menu, botões, cartões, campos, abas, resultados, rodapé |
| `paginas.css` | O que é próprio de cada página: apresentação, linha do tempo, painel de metas, gráfico |

### Funcionamento (`js/`)

Cada calculadora é dividida em dois arquivos com o mesmo nome:

| Pasta | O que tem |
|---|---|
| `js/calculo/` | Só as contas. Recebe números, devolve números. Não mexe na tela |
| `js/telas/` | Lê os campos da página, chama a conta e escreve o resultado |
| `js/ui/` | O que todas as páginas usam: tema claro/escuro, abas, gráfico, formatação de números, taxas |

Exemplo: para mudar a regra do Simples Nacional, edite `js/calculo/simples.js`.
Para mudar o texto que aparece no resultado, edite `js/telas/simples.js`.

### Dados e automação

| Arquivo | O que tem |
|---|---|
| `data/taxas.json` | Selic, CDI, IPCA, TR e salário mínimo (atualizado sozinho) e alíquotas da reforma (editadas à mão) |
| `scripts/atualizar-taxas.mjs` | Programa que busca as taxas no Banco Central |
| `.github/workflows/atualizar-taxas.yml` | Faz o GitHub rodar o programa acima todo dia útil |
| `notas/` | Cofre do Obsidian: ideias, roteiros, fontes e tarefas |

## Taxas em tempo real

Todo dia útil às 08:17 (Brasília) o GitHub busca as taxas no Banco Central e salva em
`data/taxas.json`. Para rodar na hora: aba **Actions** → **Atualizar taxas** → **Run workflow**.
Se o Banco Central estiver fora do ar, o valor anterior é mantido.

## Ver o site no seu computador

Abrir o `index.html` com dois cliques não funciona: o navegador bloqueia os arquivos de `js/`
e o `data/taxas.json` quando a página não vem de um servidor.

No VS Code, instale a extensão **Live Server**, abra o `index.html` e clique em **Go Live**,
no canto inferior direito. O site abre no navegador e atualiza sozinho a cada vez que você salva.

## Aviso

As calculadoras são simulações educativas e não substituem um contador.
