# Atualização v0.2.10

## v0.2.12 — Alinhamento de bandeiras e seleções

- Bandeiras geradas e incluídas em `frontend/assets/img/flags/`.
- Admin > Tabela da Copa agora renderiza bandeiras via `<img>`, sem depender de emoji do sistema operacional.
- Migrations atualizam registros antigos que tinham emoji para caminho PNG.


Correção da Tabela da Copa no admin: grupos limitados à composição-base de 4 seleções, backfill de bandeiras/códigos dos jogos já cadastrados e renderização reforçada das bandeiras no app/admin. Rode `npm run db:migrate` para corrigir os dados existentes no banco Render.

# Bolão da Copa PetFunny — Login, Cadastro, Pagamentos, Grupos e Admin de Jogos

## v0.2.8 — Tabela da Copa 2026 completa + logo transparente

- `/admin` > **Tabela da Copa** agora já carrega os grupos A–L da Copa 2026 com as seleções preenchidas.
- A classificação é recalculada automaticamente a partir dos jogos cadastrados/finalizados no admin.
- A Tabela da Copa agora também tem seção **Mata-mata**: 16 avos, Oitavas, Quartas, Semifinal, Disputa 3º lugar e Final.
- Jogos cadastrados nessas fases aparecem automaticamente no mata-mata com data, status e placar.
- `/app` login: logo regenerada com fundo transparente, sem o fundo branco externo.
- Favicons e ícones PWA regenerados com transparência.


## v0.2.6 — Admin em telas, modal premium, tabela da Copa e usuários

- `/admin` reorganizado em telas internas: Jogos cadastrados, Pagamentos do bolão, Palpites dos Usuários, Tabela da Copa e Usuários cadastrados.
- `+ Novo jogo` abre em modal premium com header fixo, subtítulo, corpo rolável e rodapé fixo.
- Edição de jogo também usa o modal premium.
- Ações de jogos continuam em menu de 3 pontinhos: Editar, Ver palpites, Apurar jogo e Excluir.
- Adicionados endpoints admin `/api/bolao-copa/users` e `/api/bolao-copa/standings`.
- Fluxos CRUD com toasts padronizados de sucesso/erro e confirmação premium para apurar/excluir.


Projeto separado do **Bolão da Copa PetFunny** com app do participante e painel administrativo.

## O que o sistema faz

- `/app` — app do participante.
  - Primeira tela: login simples com e-mail, senha e botão Entrar.
  - Link discreto `Cadastrar` para criar conta com nome completo, e-mail, WhatsApp e senha.
  - Após cadastro, entra logado automaticamente no app.
  - Link discreto `Esqueci a senha` para receber link de redefinição por e-mail.
  - Participante filtra jogos por grupo, escolhe o jogo, paga pelo Mercado Pago e só depois envia o palpite.

- `/admin` — painel administrativo.
  - Cadastro de qualquer jogo da Copa, não apenas jogos do Brasil.
  - Campos `Time 1` e `Time 2` com combo de seleções e bandeiras.
  - Campo de grupo do jogo, como Grupo A, Grupo B, Grupo C etc.
  - Valor diferente por jogo.
  - Acumulado por bolão com base nos pagamentos aprovados.
  - Lançamento de placar final.
  - Apuração automática de quem acertou o placar exato.
  - Visualização de pagamentos e palpites.

- Pagamento por jogo via Mercado Pago:
  - Pix com QR Code e copia-e-cola.
  - Cartão de crédito/débito via Checkout Pro.
  - Webhook para atualizar pagamento aprovado/pendente/recusado.

- Backend Node.js/Express + PostgreSQL.
- Front-end HTML/CSS/JS mobile-first, sem build.

## Rodar local

```bash
cp .env.example .env
npm install --prefix backend
npm run db:migrate
npm run db:seed
npm start
```

Acesse:

- Admin: `http://localhost:3000/admin`
- App participante: `http://localhost:3000/app`

Login admin padrão do `.env.example`:

- E-mail: `admin@petfunny.com.br`
- Senha: `petfunny123`

Participante de teste criado pelo seed:

- E-mail: `cliente@petfunny.com.br`
- Senha: `petfunny123`

## Banco novo no Render

Se o banco é novo no Render, não use `localhost:5432` no `.env`.

### Rodando localmente no Windows apontando para o banco do Render

1. No Render, abra o banco PostgreSQL.
2. Vá em **Info**, **Connect** ou **Connections**.
3. Copie a **External Database URL**.
4. Na raiz do projeto, crie ou edite o `.env`:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST_RENDER:5432/NOME_DO_BANCO
DATABASE_SSL=auto
NODE_ENV=development
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000
JWT_SECRET=troque-este-segredo
PAYMENT_DEMO_AUTOPAY=true
MERCADO_PAGO_AUTO_RETURN=auto
```

5. Rode:

```bash
npm install --prefix backend
npm run db:migrate
npm run db:seed
npm start
```

### Rodando o app dentro do Render

No **Web Service** do bolão, configure em **Environment Variables**:

```env
DATABASE_URL=<Internal Database URL do PostgreSQL Render>
DATABASE_SSL=auto
NODE_ENV=production
PUBLIC_BASE_URL=https://seu-servico.onrender.com
JWT_SECRET=<uma-chave-forte>
ADMIN_EMAIL=admin@petfunny.com.br
ADMIN_PASSWORD=<senha-forte>
MERCADO_PAGO_ACCESS_TOKEN=<token-real>
PAYMENT_DEMO_AUTOPAY=false
MERCADO_PAGO_AUTO_RETURN=auto
```

Build Command sugerido:

```bash
npm install --prefix backend && npm run db:migrate && npm run db:seed
```

Start Command:

```bash
npm start
```

Observação: para rodar migração pelo seu computador usando banco Render, use a **External Database URL**. Para o Web Service dentro do Render, prefira a **Internal Database URL** quando o banco e o serviço estiverem no mesmo account/region.

## Mercado Pago

Configure no `.env` ou no Render:

```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=...
MERCADO_PAGO_AUTO_RETURN=auto
PUBLIC_BASE_URL=https://seu-dominio.onrender.com
# Opcional: use apenas se quiser forçar uma URL específica de webhook.
# Em localhost deixe vazio; o Mercado Pago exige URL pública HTTPS.
MERCADO_PAGO_NOTIFICATION_URL=
```

O sistema usa:

- `POST /checkout/preferences` para Checkout Pro, liberando cartão de crédito/débito e outros meios habilitados na conta Mercado Pago.
- `POST /v1/payments` com `payment_method_id=pix` para gerar Pix com QR Code.
- Webhook em `/api/payments/mercado-pago/webhook` para atualizar pagamento aprovado/pendente/recusado.

A URL de webhook (`notification_url`) só é enviada ao Mercado Pago quando existir URL pública HTTPS válida. Em `localhost`, o backend omite automaticamente esse campo para evitar erro de URL inválida.

> Para teste local sem token Mercado Pago, você pode definir `PAYMENT_DEMO_AUTOPAY=true`. Não use isso em produção.

### Correção do erro `auto_return invalid`

O Checkout Pro só deve enviar `auto_return: approved` quando existir uma URL pública válida de sucesso. Em `localhost`, a v0.2.15 mantém `back_urls` e desativa automaticamente o `auto_return`, evitando o erro:

```text
auto_return invalid. back_url.success must be defined
```

Para desenvolvimento local, mantenha:

```env
PUBLIC_BASE_URL=http://localhost:3000
MERCADO_PAGO_AUTO_RETURN=auto
```

Para produção no Render, use uma URL HTTPS real:

```env
PUBLIC_BASE_URL=https://seu-servico.onrender.com
MERCADO_PAGO_AUTO_RETURN=auto
```

Se precisar desativar sempre o retorno automático:

```env
MERCADO_PAGO_AUTO_RETURN=false
```

## Recuperação de senha por e-mail

Para que o link de redefinição seja enviado por e-mail em produção, configure SMTP:

```env
RESET_TOKEN_EXPIRES_MINUTES=60
SMTP_HOST=smtp.seuprovedor.com
SMTP_PORT=587
SMTP_USER=usuario@dominio.com
SMTP_PASS=senha-ou-app-password
SMTP_FROM="Bolão da Copa PetFunny <no-reply@petfunny.com.br>"
```

Sem SMTP configurado em ambiente local, o sistema mostra o link na tela e imprime no console para facilitar teste.

## Regras do bolão

- Participante precisa ter cadastro com nome completo, e-mail, WhatsApp e senha.
- Cada jogo possui um valor próprio de participação.
- O acumulado do jogo soma somente pagamentos aprovados.
- Participante pode filtrar os jogos por grupo no `/app`.
- Participante pode pagar por Pix ou Checkout Pro.
- O palpite só é liberado após pagamento aprovado.
- Participante pode enviar apenas 1 palpite por jogo.
- Palpites encerram automaticamente 10 minutos antes do horário do jogo.
- Quando o admin lança o placar final, o sistema marca automaticamente quem acertou o placar exato.
- Admin pode marcar prêmio como entregue.

## Atualização v0.2.4

- `/admin`: coluna **Ações** agora usa menu de **3 pontinhos**.
- `/admin`: cadastro/edição de jogos recebeu campo **Grupo**.
- `/app`: filtro **Todos os grupos / Grupo A / Grupo B / ...** conforme jogos cadastrados.
- Banco: `world_cup_games.game_group` adicionado por migration incremental, sem apagar dados.

## Estrutura

```text
backend/
  src/app.js
  src/db.js
  src/server.js
  src/scripts/migrate.js
  src/scripts/seed.js
frontend/
  pages/admin/index.html
  pages/app/index.html
  assets/css/style.css
  assets/js/admin.js
  assets/js/app.js
```

## Segurança

Nunca suba no GitHub:

- `.env`
- tokens reais Mercado Pago
- senhas reais
- `DATABASE_URL` real
- chaves SMTP
- `JWT_SECRET` de produção


## v0.2.7 — Ajuste visual do login do /app

- Logo centralizada e maior fora do card de login.
- Espaçamento vertical reforçado entre labels e campos no login/cadastro/recuperação.
- Footer de autenticação fora do card com `2026 © Bolão da Copa Pet Funny.`
- Sem alteração de banco de dados.


## v0.2.9 — Correção do menu de ações no admin
- Corrigido menu de 3 pontinhos da tabela Jogos cadastrados.

## v0.2.12 — Correção da Tabela da Copa
- Corrigido erro `findTeamByCodeOrName is not defined` no admin.
- Na Tabela da Copa, bandeira e nome da seleção ficam alinhados à esquerda.
- Sem alteração de banco de dados.


## v0.2.13 — WhatsApp com máscara e jogos separados por data
- `/app`: cadastro agora aplica máscara automática no campo WhatsApp: `(16) 99999-9999`.
- `/admin > Jogos cadastrados`: listagem agrupada por data do jogo.
- `/app > Jogos disponíveis`: cards agrupados por data do jogo, mantendo filtro por grupo.
- Sem alteração de banco de dados.

## v0.2.14 — Home do App, Jogos Antigos, Tabela da Copa e Premiação

- `/app` com hero compacto, logo centralizada e título “Bolão da Copa”.
- Home do app mostra somente jogos abertos para palpite.
- Botão **Jogos antigos** para jogos encerrados, finalizados ou já palpitados.
- Botão **Tabela da Copa** no app com grupos e mata-mata iguais ao admin.
- Cards dos jogos mostram premiação e valor estimado de retirada com 10% descontado do acumulado.
- Novo endpoint do participante: `GET /api/app/bolao-copa/standings`.

## v0.2.16 — Correção Pix Mercado Pago + nova aba

Correção do Pix Mercado Pago quando a API retornava:

```text
The name of the following parameters is wrong : [payer.surname, payer.name]
```

A v0.2.16 separa o payload de pagador do Pix (`/v1/payments`) do payload usado no Checkout Pro (`/checkout/preferences`). Para Pix, o backend envia `payer.email`, `payer.first_name`, `payer.last_name` e telefone quando disponível.

Também foi ajustado o comportamento no app:

- Cartão crédito/débito abre o Checkout Pro em nova aba.
- Pix abre o link/ticket do Mercado Pago em nova aba quando disponível.
- QR Code Pix e copia-e-cola continuam disponíveis no card do jogo.

Essa versão não altera banco de dados.


## v0.2.17 — Correção Pix notification_url

Correção do erro do Pix Mercado Pago:

```text
notification_url attribute must be url valid
```

A v0.2.17 agora só envia `notification_url` quando houver uma URL pública HTTPS válida. Em ambiente local com `PUBLIC_BASE_URL=http://localhost:3000`, o campo é omitido automaticamente.

Para produção no Render, configure:

```env
PUBLIC_BASE_URL=https://seu-servico.onrender.com
MERCADO_PAGO_NOTIFICATION_URL=
```

Ou, se quiser forçar uma URL específica de webhook:

```env
MERCADO_PAGO_NOTIFICATION_URL=https://seu-servico.onrender.com/api/payments/mercado-pago/webhook
```

Essa versão não altera banco de dados.

## v0.2.18 — Ajuste técnico das listas no app

O `/app` agora separa os jogos em abas: Disponíveis, Meus palpites, Jogos antigos e Todos os jogos. A home continua priorizando jogos disponíveis para palpite, mas os demais jogos não ficam mais “sumidos”. O endpoint do app também deixou de limitar a consulta aos últimos 30 dias e agora retorna até 500 jogos ativos.

Não há alteração de banco nesta versão.

---

## v0.2.19 — Cards dos jogos no app

- Card do jogo no `/app` reorganizado em 3 linhas: grupo, seleções, fase/data/hora.
- Removida a tag `Pagamento necessário` do card.
- Aumentado o espaçamento entre seleções e inputs de placar.
- Cache busting atualizado para `v=0.2.19`.

Não altera banco de dados.

## v0.2.20 — App: header, hero, abas e tabela

- Header do `/app` agora tem a mesma largura do hero, com cantos arredondados.
- Hero do `/app` ficou limpo, apenas com título e subtítulo.
- Botão **Tabela da Copa** foi movido para junto das abas principais.
- Abas agora exibem conteúdo exclusivo: jogos ou tabela, sem misturar blocos.
- Tabela da Copa no app recebeu ajuste para evitar barra horizontal; nomes longos das seleções usam reticências.
- Não há alteração de banco nesta versão.

## v0.2.21 — App: palpites por jogo, ganhadores e 16 avos

- `/app` agora mostra botão **Ver palpites e ganhadores** em todos os cards de jogos.
- O botão abre um modal com todos os usuários que palpitarem naquele jogo e o placar escolhido por cada um.
- Quando o resultado final estiver cadastrado, o modal destaca os ganhadores.
- Se houver mais de um ganhador, o valor de retirada é dividido igualmente entre eles.
- O cálculo desconta 10% da plataforma do acumulado do jogo antes de dividir o prêmio.
- A área **Mata-mata** do app agora garante a fase **16 avos** mesmo quando ainda não houver jogo cadastrado nessa fase.
- Novo endpoint do app: `GET /api/app/bolao-copa/:gameId/predictions`.
- Não há alteração de banco nesta versão.

## v0.2.22 — Regras, confiança e resgate Pix

- Aba **Regras e resgate** no `/app`.
- Regras claras do bolão dentro do app.
- Exibição do cálculo: acumulado, 10% da plataforma e 90% para ganhadores.
- Cadastro e atualização de chave Pix para resgate.
- Solicitação de resgate pelo app para usuários ganhadores.
- Pagamento do prêmio informado como até 3 dias úteis.
- Criada tabela `prize_redemptions`.
- Novos endpoints: `/api/app/rules`, `/api/app/prizes`, `/api/app/me/pix` e `/api/app/prizes/:predictionId/redeem`.

Como atualizar:

```powershell
npm install --prefix backend
npm run db:migrate
npm start
```


## v0.2.23 — Ajuste visual de regras e Pix

- Card **Transparência do bolão** reformulado com visual mais premium e maior legibilidade.
- Campo **Chave Pix** mais largo em **Meu Pix de resgate**.
- Botão **Salvar Pix de resgate** em linha própria com 100% de largura.
- Mais espaçamento vertical entre formulário, botão e texto de segurança.
- Cache busting atualizado para `v=0.2.23`.


## Correção Render v0.2.24 — dependências do backend

Se o Render mostrar o erro `Cannot find package 'dotenv'`, significa que o serviço instalou dependências na raiz, mas não instalou as dependências dentro da pasta `backend`.

Use no Render:

```bash
Build Command: npm run render:build
Start Command: npm run render:start
```

A raiz do projeto também possui `postinstall`, que executa:

```bash
npm install --prefix backend
```

Assim, pacotes como `dotenv`, `express`, `pg`, `jsonwebtoken`, `bcryptjs` e `nodemailer` ficam disponíveis para `backend/src/server.js`.


## v0.2.25 — Ajuste visual do login do app

- No `/app`, o botão/link **Cadastrar** agora fica destacado logo abaixo do botão **Entrar**.
- O link **Esqueci a senha** fica abaixo de **Cadastrar**, discreto e centralizado.
- Ajuste apenas visual, sem alteração de banco de dados.
