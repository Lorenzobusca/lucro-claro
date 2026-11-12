# O que configurar para os dois sites entrarem no ar

Siga na ordem. Cada parte diz onde clicar e o que copiar. O que é segredo fica **só** nas variáveis de ambiente do Vercel, nunca no código.

---

## 1. Supabase (login e banco de dados)

1. Crie uma conta em supabase.com e um projeto novo.
   - **Region: South America (São Paulo).** A Política de Privacidade diz que os dados ficam no Brasil; se escolher outra região, ajuste o texto.
   - Anote a senha do banco num lugar seguro (não vai para o código).
2. **SQL Editor → New query**: cole todo o arquivo `servidor/banco.sql` e clique em **Run**.
3. **Project Settings → API**: copie
   - **Project URL** → vai em `app/js/conta/config.js` (`SUPABASE_URL`) **e** na variável `SUPABASE_URL` do Vercel;
   - **anon / publishable key** → vai em `app/js/conta/config.js` (`SUPABASE_ANON_KEY`);
   - **service_role / secret key** → vai **só** na variável `SUPABASE_SERVICE_ROLE_KEY` do Vercel.
4. **Authentication → URL Configuration**
   - Site URL: `https://app.lastrion.com.br`
   - Redirect URLs: `https://app.lastrion.com.br/**` e, para testar no computador, `http://127.0.0.1:5500/**`
5. **Authentication → Email Templates → Magic Link** (e também **Confirm signup**): cole o conteúdo de `servidor/email-entrar.html`. Ele mostra o link **e o código de 6 dígitos**, que salva quem abre o e-mail em outro navegador.
6. **Authentication → SMTP Settings**: ligue um envio próprio. O envio padrão do Supabase manda poucos e-mails por hora e não serve para o público.
   - Sugestão: Resend (resend.com), plano grátis de 3.000 e-mails por mês. Cadastre o domínio `lastrion.com.br`, crie a chave e preencha host, porta, usuário e senha que o Resend mostrar. Remetente: `acesso@lastrion.com.br`.
7. **Authentication → Providers → Google** (opcional, mas recomendado): siga o passo a passo da tela do Supabase para criar o "OAuth client" no Google Cloud.

## 2. Asaas (pagamentos)

1. Crie a conta em asaas.com com o CNPJ da empresa do Lastrion.
2. Comece no **sandbox** (ambiente de teste): sandbox.asaas.com. Lá nada é cobrado de verdade.
3. **Integrações → Chave de API**: gere a chave → variável `ASAAS_API_KEY` no Vercel.
4. **Integrações → Webhooks**: crie um webhook
   - URL: `https://app.lastrion.com.br/api/webhook-asaas`
   - Token de autenticação: invente um texto longo e aleatório → o mesmo texto vai na variável `ASAAS_WEBHOOK_TOKEN` do Vercel
   - Eventos: cobranças (PAYMENT_*) e assinaturas (SUBSCRIPTION_*)
5. Confira as taxas na sua conta (menu → Taxas). As fontes públicas divergem.
6. Depois de testar tudo no sandbox, troque para produção: nova chave de API de produção e `ASAAS_API_URL=https://api.asaas.com/v3`.
7. (Opcional) Para o Asaas voltar ao app depois do pagamento, cadastre o domínio `app.lastrion.com.br` em **Minha conta → Informações** e crie a variável `ASAAS_URL_RETORNO=https://app.lastrion.com.br/assinatura.html?pagamento=ok`.

## 3. Vercel (hospedagem) — dois projetos do mesmo repositório

Para cada projeto: **Add New → Project → Import** o repositório `lucro-claro`.

| | Projeto do site | Projeto do app |
|---|---|---|
| Nome | `lastrion-site` | `lastrion-app` |
| Root Directory | `site` | `app` |
| Framework Preset | Other | Other |
| Build e Output | já vêm do `vercel.json` da pasta | já vêm do `vercel.json` da pasta |
| Domínio | `lastrion.com.br` (e `www.lastrion.com.br` redirecionando) | `app.lastrion.com.br` |

Em **Settings → General** de cada projeto, confira que **"Include files outside the root directory in the Build Step"** está ligado. O script de montagem precisa ler a pasta `compartilhado/`.

**Variáveis de ambiente do projeto do app** (Settings → Environment Variables):

| Nome | O que é | Exemplo |
|---|---|---|
| `SUPABASE_URL` | endereço do projeto Supabase | `https://abcd.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | chave secreta do Supabase | `eyJ…` ou `sb_secret_…` |
| `ASAAS_API_KEY` | chave da API do Asaas | `$aact_…` |
| `ASAAS_API_URL` | ambiente do Asaas | sandbox: `https://api-sandbox.asaas.com/v3` · produção: `https://api.asaas.com/v3` |
| `ASAAS_WEBHOOK_TOKEN` | o texto secreto do webhook | um texto longo aleatório |
| `PRECO_MENSAL` | valor cobrado por mês | `19.90` |
| `PRECO_ANUAL` | valor cobrado por ano | `199.00` |
| `ASAAS_URL_RETORNO` | (opcional) volta depois de pagar | `https://app.lastrion.com.br/assinatura.html?pagamento=ok` |

O projeto do site não precisa de variáveis.

**Plano do Vercel:** o Hobby (grátis) não permite uso comercial. Dá para usar enquanto nada é cobrado; antes de abrir as assinaturas, passe a conta para o **Pro**.

## 4. Domínio (registro.br)

No registro.br, em **DNS** do domínio `lastrion.com.br`, crie os registros que o Vercel mostrar ao adicionar cada domínio (normalmente um `A` para `lastrion.com.br` e um `CNAME` para `www` e para `app`). O Resend também pede alguns registros (`TXT`/`MX`) para poder mandar e-mail pelo domínio.

## 5. No código (arquivos que você mesmo edita)

| Arquivo | O que preencher |
|---|---|
| `app/js/conta/config.js` | `SUPABASE_URL` e `SUPABASE_ANON_KEY` (públicos) |
| `compartilhado/config/planos.js` | `precoMensal`, `precoAnual` (iguais às variáveis do Vercel) e `WHATSAPP` (ex.: `5511999999999`) |
| `compartilhado/config/valores-legais.js` | conferir os limites do MEI a cada mudança de lei e atualizar `conferido_em` |
| `site/privacidade.html` e `site/termos.html` | trechos em amarelo e revisão de um advogado |

## 6. Teste antes de abrir

1. Criar conta com e-mail (link e código) e com Google.
2. Ver o teste grátis de 14 dias no painel.
3. Assinar no sandbox com cartão de teste e com Pix de teste; conferir que o plano fica "Plano completo".
4. Cancelar em "Minha conta" e conferir que nada mais é cobrado no Asaas.
5. Excluir a conta e conferir que ela sumiu em Supabase → Authentication → Users.

## Custo mensal

| Item | Antes de cobrar | Com as assinaturas abertas |
|---|---|---|
| Vercel | R$ 0 (Hobby) | US$ 20 por mês (Pro, 1 pessoa) |
| Supabase | R$ 0 (Free; pausa o projeto após 1 semana sem uso) | US$ 25 por mês (Pro) |
| Resend | R$ 0 (até 3.000 e-mails/mês) | R$ 0 até esse volume |
| Domínio .com.br | ~R$ 40 por ano (~R$ 3,40/mês) | ~R$ 3,40/mês |
| Asaas | R$ 0 | sem mensalidade; por cobrança paga: cartão R$ 0,49 + 1,99%; Pix R$ 0,99 a R$ 1,99 (confirme na sua conta) |
| **Total fixo** | **~R$ 3,40/mês** | **US$ 45 + R$ 3,40 por mês** (com o dólar a R$ 5,50, uns R$ 250) |

Preços conferidos em 12/11/2026 nas páginas de preço de cada serviço. Mudam com o tempo e com o dólar.
