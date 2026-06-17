# Entrega v0.2.4 — Menu de ações, grupos dos jogos e filtro no app

## Versão entregue

`BolaoCopaPetFunny-v0.2.4-menu-acoes-grupos.zip`

## O que foi feito

- No `/admin`, a coluna **Ações** dos jogos agora usa botão de menu de **3 pontinhos**.
- As opções de cada jogo ficam dentro do menu:
  - Editar;
  - Ver palpites;
  - Apurar jogo;
  - Excluir.
- Também apliquei o mesmo padrão de menu nas ações de pagamentos e palpites quando existe ação disponível.
- No cadastro/edição de jogos do admin, adicionado campo **Grupo**.
- O combo de grupos contempla Grupo A até Grupo L e fases eliminatórias.
- No `/app`, adicionado filtro por grupo acima da lista de jogos.
- O filtro é gerado automaticamente conforme os grupos existentes nos jogos cadastrados.
- Os cards do app mostram o grupo do jogo em destaque.
- A migration adiciona `game_group` em `world_cup_games` sem apagar dados existentes.

## Arquivos principais alterados

- `backend/src/scripts/migrate.js`
- `backend/src/scripts/seed.js`
- `backend/src/app.js`
- `frontend/pages/admin/index.html`
- `frontend/assets/js/admin.js`
- `frontend/pages/app/index.html`
- `frontend/assets/js/app.js`
- `frontend/assets/css/style.css`
- `README.md`

## Como rodar

```bash
npm install --prefix backend
npm run db:migrate
npm run db:seed
npm start
```

## Como testar

1. Acesse `http://localhost:3000/admin`.
2. Entre como admin.
3. Clique em **Novo jogo**.
4. Escolha um **Grupo**, Time 1, Time 2, valor e data.
5. Salve o jogo.
6. Na lista de jogos, clique nos **3 pontinhos** da coluna Ações.
7. Acesse `http://localhost:3000/app`.
8. Entre como participante.
9. Use o filtro de grupos para exibir apenas os jogos do grupo desejado.

## Observações

- A coluna nova `game_group` usa valor padrão `Grupo A` para preservar jogos antigos.
- O filtro do app é frontend-only nesta versão, porque a carga atual de jogos é pequena e isso evita criar complexidade desnecessária.
- Não foram adicionadas credenciais reais no ZIP.
