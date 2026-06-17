# Entrega v0.2.24 — Correção Render / dependências do backend

## Problema corrigido
No Render, o deploy estava executando `yarn start` na raiz do projeto, mas as dependências do backend não tinham sido instaladas dentro de `backend/node_modules`. Por isso o Node não encontrava pacotes como `dotenv`, mesmo o `backend/package.json` contendo a dependência.

Erro original:

```txt
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'dotenv' imported from /opt/render/project/src/backend/src/server.js
```

## Correção aplicada
- Atualizado `package.json` da raiz para instalar automaticamente as dependências do backend.
- Adicionado script `postinstall`:

```json
"postinstall": "npm install --prefix backend"
```

- Adicionados scripts específicos para Render:

```json
"render:build": "npm install --prefix backend && npm --prefix backend run db:migrate",
"render:start": "npm --prefix backend start"
```

- Adicionado `render.yaml` com comandos recomendados.
- Atualizada versão do projeto para `0.2.24`.

## Configuração recomendada no Render

Build Command:

```bash
npm run render:build
```

Start Command:

```bash
npm run render:start
```

## Observação
Essa versão não altera banco de dados nem frontend. A correção é focada em deploy e instalação de dependências.
