# Entrega v0.2.3 — Login simples, cadastro separado, recuperação de senha e seleções no admin

## O que foi feito

- `/app` agora abre diretamente na tela de login com apenas e-mail, senha e botão Entrar.
- Abaixo do botão Entrar foram adicionados links discretos:
  - `Cadastrar`;
  - `Esqueci a senha`.
- A tela de cadastro foi separada da tela de login.
- Após cadastro, o participante já entra logado no app.
- A recuperação de senha ganhou fluxo completo:
  - tela para informar e-mail;
  - geração de token seguro;
  - link `/app?resetToken=...`;
  - tela para cadastrar nova senha;
  - login automático após redefinir a senha.
- Se SMTP estiver configurado, o link é enviado por e-mail.
- Se SMTP não estiver configurado em ambiente local, o link aparece na tela e também no console para teste.
- Tela de login do app e do admin receberam copyright: `© Bolão da Copa Pet Funny`.
- Admin deixou de ser apenas `Brasil x adversário`.
- Admin agora cadastra jogos com:
  - Time 1;
  - Time 2;
  - combo de seleções com bandeiras;
  - placar do Time 1;
  - placar do Time 2.
- App do participante agora exibe qualquer jogo como `Time 1 x Time 2`, com bandeiras.
- Pagamentos e palpites continuam funcionando com o padrão Mercado Pago da v0.2.

## Arquivos principais alterados

- `backend/src/app.js`
- `backend/src/scripts/migrate.js`
- `backend/src/scripts/seed.js`
- `backend/package.json`
- `package.json`
- `.env.example`
- `backend/.env.example`
- `frontend/pages/app/index.html`
- `frontend/assets/js/app.js`
- `frontend/pages/admin/index.html`
- `frontend/assets/js/admin.js`
- `frontend/assets/css/style.css`

## Novas variáveis de ambiente para e-mail

```env
RESET_TOKEN_EXPIRES_MINUTES=60
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Bolão da Copa PetFunny <no-reply@petfunny.com.br>"
```

Sem SMTP configurado, a recuperação funciona para teste local mostrando o link na tela. Em produção, configure SMTP no Render para enviar o link por e-mail.

## Como atualizar banco existente

Rode novamente:

```bash
npm install --prefix backend
npm run db:migrate
npm run db:seed
npm start
```

A migration é incremental e adiciona as novas colunas sem apagar dados existentes.

## Como testar

1. Acesse `/app`.
2. Confirme que a primeira tela é apenas login.
3. Clique em `Cadastrar`.
4. Crie uma conta nova.
5. Confirme que entra logado no app.
6. Saia.
7. Clique em `Esqueci a senha`.
8. Informe o e-mail.
9. Se SMTP não estiver configurado localmente, use o link exibido na tela.
10. Cadastre nova senha.
11. Acesse `/admin`.
12. Crie um novo jogo usando Time 1 e Time 2 com bandeiras.
13. Confirme no `/app` que o jogo aparece com as duas seleções.

## Observações

- A estrutura antiga de colunas `brazil_score` e `opponent_score` foi mantida internamente para compatibilidade, mas a interface agora trata como `team1Score` e `team2Score`.
- O combo de seleções usa lista estática no frontend para evitar depender de API externa na hora de cadastrar jogos.
