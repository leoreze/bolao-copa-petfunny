# BolaoCopaPetFunny v0.2.2 — Banco Render Postgres

## O que foi ajustado

- Conexão PostgreSQL agora suporta `DATABASE_SSL=auto`.
- Melhor suporte para banco novo no Render.
- `.env.example` documenta uso de External Database URL local e Internal Database URL no Render Web Service.
- Mensagens de erro foram ajustadas para não sugerir apenas `localhost:5432`.
- README recebeu passo a passo específico para Render.

## Como usar localmente com banco Render

```env
DATABASE_URL=<External Database URL do Render>
DATABASE_SSL=auto
```

Depois rode:

```bash
npm run db:migrate
npm run db:seed
npm start
```

## Como usar hospedado no Render

Configure no Web Service:

```env
DATABASE_URL=<Internal Database URL do Render>
DATABASE_SSL=auto
NODE_ENV=production
```

Build Command:

```bash
npm install --prefix backend && npm run db:migrate && npm run db:seed
```

Start Command:

```bash
npm start
```
