# Bolão Copa PetFunny — v0.2.11

## Correção: bandeiras em PNG na Tabela da Copa

### O que foi feito

- Geração de bandeiras em PNG dentro do projeto.
- Nova pasta criada:
  - `frontend/assets/img/flags/`
- Inclusão das bandeiras das seleções usadas na Tabela da Copa 2026.
- Substituição do uso de emoji por imagem PNG no admin e no app.
- Correção da renderização da Tabela da Copa para exibir imagens reais carregadas por `<img>`.
- Atualização do catálogo de seleções no frontend e backend para usar caminhos de assets:
  - `/assets/img/flags/BRA.png`
  - `/assets/img/flags/ARG.png`
  - etc.
- Backfill na migration para substituir bandeiras antigas em emoji salvas no banco por caminhos PNG.
- Cache busting atualizado para `v=0.2.11`.

### Arquivos principais alterados

- `frontend/assets/img/flags/*.png`
- `frontend/assets/js/admin.js`
- `frontend/assets/js/app.js`
- `frontend/assets/css/style.css`
- `frontend/pages/admin/index.html`
- `frontend/pages/app/index.html`
- `backend/src/app.js`
- `backend/src/scripts/migrate.js`

### Como atualizar

```powershell
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm run db:migrate
npm start
```

### Como testar

1. Acesse `http://localhost:3000/admin`.
2. Entre em **Tabela da Copa**.
3. Confira se cada seleção aparece com uma imagem de bandeira.
4. Entre em **Jogos cadastrados**.
5. Cadastre ou edite um jogo e salve.
6. Volte para **Tabela da Copa** e confira a atualização.
7. Use `Ctrl + F5` se o navegador ainda estiver usando cache antigo.

### Observações

- Esta versão altera dados existentes por migration para trocar flags antigas por caminhos de PNG.
- As bandeiras foram incluídas localmente no projeto, sem depender de CDN externa.
- O sistema continua funcionando offline/local para esses assets.
