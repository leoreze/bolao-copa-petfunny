# Entrega v0.2 — Cadastro + Pagamentos por Jogo

## O que foi feito

- `/app` agora possui cadastro simples com nome completo, e-mail, WhatsApp e senha.
- Login do participante com e-mail/WhatsApp e senha.
- Cada jogo tem valor próprio de participação.
- Pagamento obrigatório antes do palpite quando o jogo tem valor maior que zero.
- Integração Mercado Pago no padrão do FunnyOS:
  - Pix com QR Code e copia-e-cola.
  - Checkout Pro para cartão de crédito/débito.
  - Webhook para atualização automática de status.
  - Consulta de status pelo app.
- Valor acumulado por bolão exibido no app e no admin.
- Admin visualiza pagamentos e pode marcar pagamento como aprovado manualmente para suporte/testes.
- Migrations incrementais, sem DDL em runtime.

## Arquivos principais alterados

- `backend/src/app.js`
- `backend/src/scripts/migrate.js`
- `backend/src/scripts/seed.js`
- `frontend/pages/app/index.html`
- `frontend/assets/js/app.js`
- `frontend/pages/admin/index.html`
- `frontend/assets/js/admin.js`
- `frontend/assets/css/style.css`
- `.env.example`
- `README.md`

## Como rodar

```bash
cp .env.example .env
npm install --prefix backend
npm run db:migrate
npm run db:seed
npm start
```

## Como testar

1. Acesse `/admin`.
2. Crie ou edite um jogo e informe o valor do bolão em reais.
3. Acesse `/app`.
4. Crie cadastro com nome completo, e-mail, WhatsApp e senha.
5. Escolha um jogo.
6. Clique em `Gerar Pix` ou `Cartão crédito/débito`.
7. Após pagamento aprovado, envie o placar.
8. No admin, acompanhe acumulado, pagamentos e palpites.

## Observações

- Para pagamento real, configure `MERCADO_PAGO_ACCESS_TOKEN`.
- Para teste local sem Mercado Pago, `PAYMENT_DEMO_AUTOPAY=true` aprova pagamentos automaticamente.
- Em produção, `PAYMENT_DEMO_AUTOPAY` deve ficar `false`.
