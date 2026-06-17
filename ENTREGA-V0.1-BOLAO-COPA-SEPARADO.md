# Entrega v0.1 — Bolão da Copa PetFunny separado

Projeto novo criado somente com o módulo de Bolão da Copa.

## Incluído

- Backend Node.js/Express isolado.
- PostgreSQL com tabelas próprias:
  - `tutors`
  - `world_cup_games`
  - `world_cup_predictions`
- Admin separado em `/admin`.
- App do tutor separado em `/app` e `/app/bolao-copa`.
- Login admin simples via `.env`.
- Login tutor por WhatsApp.
- Cadastro automático de tutor por WhatsApp.
- Cadastro/edição/exclusão de jogos.
- Palpite único por tutor por jogo.
- Fechamento automático de palpites 10 minutos antes do jogo.
- Apuração automática por placar exato.
- Marcação de prêmio entregue.
- UI mobile-first.

## Como rodar

```bash
cp .env.example .env
npm install --prefix backend
npm run db:migrate
npm run db:seed
npm start
```

## Rotas

- `/admin`
- `/app`
- `/app/bolao-copa`
- `/api/bolao-copa/*`
- `/api/app/bolao-copa/*`
