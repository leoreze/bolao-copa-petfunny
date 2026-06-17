# Entrega v0.2.17 — Correção Pix notification_url

## Problema corrigido

Ao tentar gerar pagamento Pix no Mercado Pago, a API retornava:

```text
notification_url attribute must be url valid
```

## Causa

O backend enviava `notification_url` usando `PUBLIC_BASE_URL`. Em ambiente local, isso virava algo como:

```text
http://localhost:3000/api/payments/mercado-pago/webhook
```

O Mercado Pago não aceita `localhost` como URL válida para notificação. A URL precisa ser pública e HTTPS.

## Correção aplicada

- Criada validação `isValidPublicHttpsUrl()`.
- Criada função `mercadoPagoNotificationUrl()`.
- Checkout Pro e Pix agora só enviam `notification_url` quando a URL for HTTPS pública.
- Em localhost, o backend omite `notification_url` automaticamente.
- Adicionada variável opcional `MERCADO_PAGO_NOTIFICATION_URL`.
- Atualizados `.env.example`, `backend/.env.example` e `README.md`.

## Como usar localmente

```env
PUBLIC_BASE_URL=http://localhost:3000
MERCADO_PAGO_NOTIFICATION_URL=
```

## Como usar no Render

```env
PUBLIC_BASE_URL=https://seu-servico.onrender.com
MERCADO_PAGO_NOTIFICATION_URL=
```

Ou force manualmente:

```env
MERCADO_PAGO_NOTIFICATION_URL=https://seu-servico.onrender.com/api/payments/mercado-pago/webhook
```

## Banco de dados

Não houve alteração de banco.

Não precisa rodar migration.

## Arquivos alterados

- `backend/src/app.js`
- `.env.example`
- `backend/.env.example`
- `README.md`
