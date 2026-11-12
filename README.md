# Lastrion

Dois sites com a mesma marca, num repositório só:

- **Site institucional** (`lastrion.com.br`): explica o que é, conquista o MEI e tem uma calculadora grátis, sem cadastro.
- **App** (`app.lastrion.com.br`): as ferramentas, com login, dados salvos na conta e assinatura (Asaas, Pix e cartão).

O repositório e a pasta ainda se chamam `lucro-claro`, que era o nome provisório.
Para colocar no ar, siga o **[CONFIGURAR.md](CONFIGURAR.md)**.

## Onde fica cada coisa

```
compartilhado/        o que os dois sites usam
  config/             valores-legais.js (limite do MEI, DAS…) e planos.js (preço, limites do grátis, WhatsApp)
  css/                tokens (cores e fontes), base, componentes, páginas do app
  js/calculo/         só as contas (recebe números, devolve números)
  js/telas/           uma por ferramenta do app: lê os campos, chama a conta, escreve o resultado
  js/ui/              tema, abas, gráfico, números, taxas, glossário, ajuda, plano atual, links entre os sites
  data/taxas.json     taxas do Banco Central, atualizadas sozinhas todo dia útil
  img/                símbolo, ícones e a imagem que aparece no WhatsApp (og.png)
site/                 site institucional
  index.html          página principal (calculadora grátis, como funciona, preço, confiança, dúvidas)
  privacidade.html    rascunho para revisão jurídica
  termos.html         rascunho para revisão jurídica
  js/site.js, css/site.css
app/                  app com login
  index.html          painel
  entrar.html         login sem senha (link + código por e-mail, ou Google)
  assinatura.html     minha conta: assinar, cancelar, baixar os dados, excluir a conta
  comece.html, impostos.html, custeio.html, metas.html, planejamento.html   as ferramentas
  js/conta/           login, salvar na conta, cadeados do plano grátis, cálculo trazido do site
  api/                funções do servidor (rodam no Vercel): assinar, cancelar, webhook do Asaas, excluir conta
servidor/
  banco.sql           tabelas e regras do banco (rodar uma vez no Supabase)
  email-entrar.html   modelo do e-mail de acesso
scripts/
  montar.sh           monta cada site para publicar (o Vercel roda sozinho)
  atualizar-taxas.mjs busca as taxas no Banco Central
rascunhos/            não vai para o ar: página inicial antiga, propostas de logo e páginas de teste
notas/                cofre do Obsidian
```

Exemplo: para mudar a regra do Simples Nacional, edite `compartilhado/js/calculo/simples.js`.
Para mudar o limite do MEI quando a lei mudar, edite só `compartilhado/config/valores-legais.js`.

## Ver no seu computador

No VS Code, instale a extensão **Live Server**, abra a pasta do projeto e clique em **Go Live**.
Depois abra `/site/` (site) ou `/app/` (app) no endereço que aparecer.

Enquanto o Supabase não estiver configurado em `app/js/conta/config.js`, o app abre em
**modo demonstração**: sem login, com os números guardados só no seu navegador.
Para ver o plano grátis com os cadeados, acrescente `?plano=gratis` no endereço.

As funções em `app/api/` só rodam no Vercel.

## Taxas em tempo real

Todo dia útil às 08:17 (Brasília) o GitHub busca as taxas no Banco Central e salva em
`compartilhado/data/taxas.json`. Para rodar na hora: aba **Actions** → **Atualizar taxas** → **Run workflow**.

## Aviso

As calculadoras são simulações educativas e não substituem um contador.
