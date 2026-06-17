# Entrega v0.2.8 — Tabela da Copa 2026 + logo transparente no login

## Versão entregue

`BolaoCopaPetFunny-v0.2.8-tabela-2026-logo-transparente.zip`

## O que foi feito

- `/admin` > **Tabela da Copa** agora já abre com todos os grupos da Copa 2026, de **Grupo A** até **Grupo L**, mesmo antes de cadastrar jogos.
- A classificação usa a base inicial dos grupos da Copa 2026 e recalcula automaticamente com os jogos cadastrados e finalizados no admin.
- Pontuação calculada por grupo:
  - pontos;
  - jogos;
  - vitórias;
  - empates;
  - derrotas;
  - gols pró;
  - gols contra;
  - saldo de gols.
- Adicionada seção **Mata-mata** dentro da Tabela da Copa:
  - 16 avos;
  - Oitavas de final;
  - Quartas de final;
  - Semifinal;
  - Disputa 3º lugar;
  - Final.
- Ao cadastrar jogos nessas fases, eles aparecem automaticamente na seção do mata-mata com data, status e placar.
- `/app` login: a logo foi processada com fundo transparente, removendo o fundo branco externo.
- Ícones PWA e favicon também foram regenerados com transparência.
- Cache busting atualizado para `v=0.2.8`.

## Arquivos principais alterados

- `backend/src/app.js`
- `backend/src/scripts/seed.js`
- `frontend/assets/js/admin.js`
- `frontend/assets/css/style.css`
- `frontend/pages/admin/index.html`
- `frontend/pages/app/index.html`
- `frontend/assets/img/bolao-logo.png`
- `frontend/assets/img/favicon-16.png`
- `frontend/assets/img/favicon-32.png`
- `frontend/assets/img/icon-192.png`
- `frontend/assets/img/icon-512.png`

## Como atualizar

```bash
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm start
```

Esta versão não altera schema do banco. Se quiser manter o padrão, pode rodar `npm run db:migrate`, mas não é obrigatório.

## Como testar

1. Acesse `http://localhost:3000/admin`.
2. Entre no menu **Tabela da Copa**.
3. Confira se aparecem os grupos A até L com as seleções já preenchidas.
4. Cadastre ou edite um jogo como `Finalizado`, com placar preenchido.
5. Volte para **Tabela da Copa** e clique em **Atualizar tabela**.
6. Confira se a pontuação do grupo foi atualizada.
7. Cadastre um jogo com Grupo/Fase `Oitavas de final`, `Quartas de final`, `Semifinal` ou `Final`.
8. Confira se o jogo aparece em **Mata-mata**.
9. Acesse `http://localhost:3000/app` e confira se a logo do login aparece sem fundo branco externo.

## Observações

- A tabela é local do sistema e depende dos jogos que você cadastra/finaliza no admin.
- O sistema não busca resultado ao vivo automaticamente.
- O objetivo é que o admin controle os placares e a tabela do bolão acompanhe esses dados.
