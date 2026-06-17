# Bolão Copa PetFunny v0.2.19 — Cards dos jogos no app

## O que foi feito

- Ajustei os cards de jogos em `http://localhost:3000/app`.
- A primeira linha do card agora mostra somente o grupo.
- A segunda linha mostra somente as seleções.
- A terceira linha mostra fase, data e horário no formato:
  - `Fase de Grupos · 24/06/2026 · 19:00`
- Removi a tag visual `Pagamento necessário` do topo do card.
- Removi a faixa de estado `Pagamento necessário`, pois o próprio bloco de pagamento já orienta o usuário.
- Aumentei o espaçamento vertical entre bandeira/nome da seleção e os inputs de placar.
- Ajustei o formulário de palpite para ficar melhor no mobile.
- Atualizei cache busting para `v=0.2.19`.

## Arquivos alterados

- `frontend/assets/js/app.js`
- `frontend/assets/css/style.css`
- `frontend/pages/app/index.html`
- `frontend/pages/admin/index.html`
- `README.md`

## Como atualizar

```powershell
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm start
```

## Observação

Essa versão não altera banco de dados. Não precisa rodar migration.

Depois de atualizar, use `Ctrl + F5` no navegador para limpar cache.
