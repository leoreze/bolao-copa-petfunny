# Entrega v0.2.26 — Login com Jogos do Dia

## O que foi feito

- `/app` na tela de login agora mostra, ao lado do formulário, um card com os jogos do dia.
- O card mostra seleções, bandeiras, grupo, fase, data e horário.
- Incluído CTA **Quero dar meu palpite**, levando o usuário para a tela de cadastro.
- Criado endpoint público `GET /api/app/public/today-games` para carregar os jogos do dia sem exigir login.
- Layout responsivo: no desktop fica ao lado do login; no mobile fica abaixo.
- Atualizado cache busting para `v=0.2.26`.

## Arquivos alterados

- `backend/src/app.js`
- `frontend/pages/app/index.html`
- `frontend/assets/js/app.js`
- `frontend/assets/css/style.css`
- `package.json`
- `backend/package.json`

## Como testar

1. Suba o projeto.
2. Acesse `http://localhost:3000/app` sem estar logado.
3. Veja o card **Jogos de hoje** ao lado do login.
4. Clique em **Quero dar meu palpite**.
5. Confirme que abre a tela de cadastro.

## Banco de dados

Esta versão não altera schema. Não precisa rodar migration.
