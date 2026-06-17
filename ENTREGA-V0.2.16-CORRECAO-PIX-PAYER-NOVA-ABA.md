# Entrega v0.2.16 — Correção Pix Mercado Pago + abertura em nova aba

## Versão
`BolaoCopaPetFunny-v0.2.16-correcao-pix-payer-nova-aba.zip`

## Correções realizadas

- Corrigido erro do Pix Mercado Pago:
  - `The name of the following parameters is wrong : [payer.surname, payer.name]`
- O endpoint de Pix agora envia `payer` no formato aceito pela API de pagamentos:
  - `email`
  - `first_name`
  - `last_name`
  - `phone`, quando houver WhatsApp válido
- O Checkout Pro mantém o padrão próprio para preferência de pagamento.
- Clique em **Cartão crédito/débito** agora abre o Mercado Pago em outra aba.
- Clique em **Gerar Pix** agora abre o link/ticket Pix do Mercado Pago em outra aba quando o Mercado Pago retornar `ticket_url`.
- O QR Code Pix e o copia-e-cola continuam aparecendo dentro do app.
- Adicionado cache busting `v=0.2.16`.

## Arquivos principais alterados

- `backend/src/app.js`
- `frontend/assets/js/app.js`
- `frontend/pages/app/index.html`
- `frontend/pages/admin/index.html`
- `README.md`

## Como atualizar

```powershell
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm start
```

Essa versão não altera banco de dados. Não precisa rodar migration.

## Como testar

1. Acesse `http://localhost:3000/app`.
2. Faça login com um usuário participante.
3. Clique em **Gerar Pix** em um jogo disponível.
4. O Mercado Pago deve gerar o Pix sem erro de `payer.name`/`payer.surname`.
5. Se houver `ticket_url`, ele abre em outra aba.
6. O QR Code Pix continua aparecendo no card do jogo.
7. Clique em **Cartão crédito/débito**.
8. O Checkout Pro deve abrir em outra aba.

## Observação

Se o navegador bloquear pop-ups, permita pop-ups para `localhost:3000` ou para o domínio do Render.
