# Entrega v0.2.15 — Correção Mercado Pago auto_return

## Correção principal

Corrigido o erro do Checkout Pro:

```text
auto_return invalid. back_url.success must be defined
```

A partir desta versão, o backend monta `back_urls.success`, `back_urls.pending` e `back_urls.failure` por helper seguro e só envia `auto_return: approved` quando a URL de sucesso é pública/HTTPS ou quando forçado por variável de ambiente.

## Nova variável

```env
MERCADO_PAGO_AUTO_RETURN=auto
```

Valores aceitos:

- `auto`: ativa `auto_return` apenas com `PUBLIC_BASE_URL` HTTPS e público.
- `false`: nunca envia `auto_return`, recomendado em localhost.
- `true`: força envio de `auto_return`.

## Arquivos alterados

- `backend/src/app.js`
- `.env.example`
- `backend/.env.example`
- `README.md`

## Como testar localmente

```powershell
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm start
```

No `.env` local:

```env
PUBLIC_BASE_URL=http://localhost:3000
MERCADO_PAGO_AUTO_RETURN=auto
```

## Como usar no Render

No Render:

```env
PUBLIC_BASE_URL=https://seu-servico.onrender.com
MERCADO_PAGO_AUTO_RETURN=auto
```

## Observação

Essa versão não altera banco de dados. Não precisa rodar migration.
