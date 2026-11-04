# Lucro Claro

Site com calculadoras gratuitas para MEIs, pequenas empresas e pessoas físicas:
impostos da reforma tributária (IBS/CBS), Simples Nacional, custeio por absorção e ABC,
margem de contribuição e investimentos contra a inflação.

## Onde fica cada coisa

| Pasta / arquivo | O que tem |
|---|---|
| `index.html` | Textos e estrutura da página |
| `css/estilo.css` | Cores, fontes e visual (as cores ficam no topo, em `:root`) |
| `js/app.js` | Contas das calculadoras e animações de rolagem |
| `data/taxas.json` | Selic, CDI, IPCA, TR e salário mínimo (atualizado sozinho) e alíquotas da reforma (editadas à mão) |
| `scripts/atualizar-taxas.mjs` | Programa que busca as taxas no Banco Central |
| `.github/workflows/atualizar-taxas.yml` | Faz o GitHub rodar o programa acima todo dia útil |
| `notas/` | Cofre do Obsidian: ideias, roteiros, fontes e tarefas |

## Taxas em tempo real

Todo dia útil às 08:17 (Brasília) o GitHub busca as taxas no Banco Central e salva em
`data/taxas.json`. Para rodar na hora: aba **Actions** → **Atualizar taxas** → **Run workflow**.
Se o Banco Central estiver fora do ar, o valor anterior é mantido.

## Ver o site no seu computador

O navegador não deixa a página ler `data/taxas.json` abrindo o arquivo direto.
Na pasta do projeto, rode:

```bash
python3 -m http.server 8000
```

e abra http://localhost:8000.

## Aviso

As calculadoras são simulações educativas e não substituem um contador.
