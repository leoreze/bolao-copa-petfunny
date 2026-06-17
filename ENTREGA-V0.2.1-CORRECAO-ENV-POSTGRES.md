# Entrega v0.2.1 — Correção de .env e PostgreSQL local

## Problema corrigido

Ao rodar `npm run db:migrate`, o projeto podia exibir:

```text
[db] DATABASE_URL não configurada. Configure no .env antes de rodar o projeto.
ECONNREFUSED 127.0.0.1:5432
```

Isso acontecia por dois motivos comuns:

1. O arquivo `.env` não havia sido criado a partir do `.env.example`.
2. O PostgreSQL local não estava rodando na porta `5432`.

## Ajustes feitos

- `backend/src/db.js` agora carrega `.env` da raiz e também de `backend/.env`.
- O projeto agora tem `backend/.env.example`.
- O projeto agora tem `docker-compose.yml` com PostgreSQL local.
- O erro de conexão ficou mais claro, com instruções diretas.
- Foram adicionados scripts:
  - `npm run db:start`
  - `npm run db:stop`
  - `npm run db:logs`

## Como rodar no Windows com Docker

```bash
copy .env.example .env
npm install --prefix backend
npm run db:start
npm run db:migrate
npm run db:seed
npm start
```

## Como rodar sem Docker

Garanta que o PostgreSQL está instalado, ligado e com o banco criado:

```sql
CREATE DATABASE bolao_copa_petfunny;
```

Depois:

```bash
copy .env.example .env
npm install --prefix backend
npm run db:migrate
npm run db:seed
npm start
```

## Observação

A integração de pagamentos e o fluxo de cadastro/palpite da v0.2 foram mantidos.
