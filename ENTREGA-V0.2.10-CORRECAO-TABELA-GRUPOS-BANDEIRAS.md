# Bolão Copa PetFunny v0.2.10 — Correção Tabela da Copa + Bandeiras

## O que foi corrigido

- Corrigida a lógica da tela **Tabela da Copa** no `/admin` para não deixar grupos com mais de 4 seleções.
- A tabela agora parte da composição-base dos grupos A até L e só calcula estatísticas de jogos válidos daquele grupo.
- Jogos cadastrados com seleções fora do grupo correto deixam de poluir a classificação do grupo.
- O backend agora completa automaticamente `código`, `nome`, `bandeira` e grupo oficial quando reconhece a seleção.
- A migration recebeu backfill de bandeiras/códigos para jogos já cadastrados no banco Render.
- Bandeiras ganharam renderização visual mais forte no admin e no app com `.team-flag`.
- Atualizado cache busting para `v=0.2.10`.

## Arquivos principais alterados

- `backend/src/app.js`
- `backend/src/scripts/migrate.js`
- `frontend/assets/js/admin.js`
- `frontend/assets/js/app.js`
- `frontend/assets/css/style.css`
- `frontend/pages/admin/index.html`
- `frontend/pages/app/index.html`

## Como atualizar

```powershell
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm run db:migrate
npm start
```

Depois abra o admin e use `Ctrl + F5` para limpar cache.

## Como testar

1. Acesse `http://localhost:3000/admin`.
2. Abra **Tabela da Copa**.
3. Verifique que cada grupo A–L mostra 4 seleções.
4. Confira se a bandeira aparece ao lado das seleções.
5. Cadastre/edite um jogo com seleções do mesmo grupo e marque como `Finalizado` com placar.
6. Volte em **Tabela da Copa** e confirme que pontos, gols e saldo foram atualizados.

## Observação

Para corrigir os registros já existentes no banco Render, é importante rodar `npm run db:migrate` nesta versão.
