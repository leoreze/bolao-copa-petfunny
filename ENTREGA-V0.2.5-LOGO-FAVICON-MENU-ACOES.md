# Entrega v0.2.5 — Logo, favicon e correção do menu de ações

## Versão entregue
BolaoCopaPetFunny-v0.2.5-logo-favicon-menu-acoes.zip

## O que foi feito
- Inserida a logo enviada pelo usuário em `frontend/assets/img/bolao-logo.png`.
- Gerados ícones PWA/favicon:
  - `favicon-16.png`
  - `favicon-32.png`
  - `icon-192.png`
  - `icon-512.png`
- Aplicada a logo no `/app`:
  - tela de login;
  - tela de cadastro;
  - tela de esqueci a senha;
  - tela de nova senha;
  - header do app logado;
  - hero principal.
- Aplicada a logo no `/admin`:
  - tela de login admin;
  - header do painel admin;
  - hero principal.
- Adicionados favicon e apple-touch-icon no `/app` e `/admin`.
- Manifest PWA atualizado com ícones 192x192 e 512x512.
- Corrigido o menu de ações do `/admin`:
  - botão de 3 pontinhos mais visível;
  - menu abre em camada fixa acima da tabela;
  - evita corte por `overflow` da tabela;
  - opções dentro do menu: Editar, Ver palpites, Apurar jogo e Excluir.
- Adicionado cache busting nos assets:
  - `style.css?v=0.2.5`
  - `admin.js?v=0.2.5`
  - `app.js?v=0.2.5`

## Arquivos principais alterados
- `frontend/pages/admin/index.html`
- `frontend/pages/app/index.html`
- `frontend/assets/css/style.css`
- `frontend/assets/js/admin.js`
- `backend/src/app.js`

## Arquivos criados
- `frontend/assets/img/bolao-logo.png`
- `frontend/assets/img/favicon-16.png`
- `frontend/assets/img/favicon-32.png`
- `frontend/assets/img/icon-192.png`
- `frontend/assets/img/icon-512.png`

## Como rodar
```bash
npm install --prefix backend
npm run db:migrate
npm run db:seed
npm start
```

## Como testar
1. Acesse `http://localhost:3000/admin`.
2. Faça login.
3. Veja se a logo aparece no login e no header.
4. Na tabela de jogos cadastrados, vá até a coluna `Ações`.
5. Clique no botão de 3 pontinhos.
6. Confirme se abre o menu com:
   - Editar;
   - Ver palpites;
   - Apurar jogo;
   - Excluir.
7. Acesse `http://localhost:3000/app`.
8. Veja se a logo aparece no login, cadastro, recuperação e app logado.
9. Verifique o favicon na aba do navegador.

## Observação
Se o navegador ainda mostrar a versão antiga, use `Ctrl + F5` ou limpe o cache. Esta versão já adiciona `?v=0.2.5` nos arquivos CSS/JS para reduzir esse problema.
