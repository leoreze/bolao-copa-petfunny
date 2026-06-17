# Bolão Copa PetFunny v0.2.18 — Ajuste técnico das listas do app

## Objetivo

Corrigir a percepção de que jogos cadastrados no admin estavam “sumindo” no `/app`.

Antes, o app exibia apenas jogos abertos para palpite na home. Com isso, jogos já palpitados, encerrados, finalizados, fechados por horário ou fora da janela de consulta não apareciam claramente para o usuário.

## O que foi ajustado

- O endpoint `/api/app/bolao-copa` agora busca até 500 jogos ativos, sem limitar aos últimos 30 dias.
- O `/app` ganhou filtros visíveis:
  - Disponíveis;
  - Meus palpites;
  - Jogos antigos;
  - Todos os jogos.
- A home continua abrindo em “Disponíveis”, mas o usuário consegue acessar todos os demais jogos sem confusão.
- Cada card mostra uma faixa de status explicando o motivo:
  - Pagamento necessário;
  - Palpite liberado;
  - Já palpitado;
  - Palpites encerrados;
  - Finalizado;
  - Cancelado.
- O botão “Jogos antigos” do hero continua funcionando, alternando entre jogos antigos e disponíveis.
- O filtro por grupo continua funcionando em cima da aba selecionada.

## Arquivos alterados

- `backend/src/app.js`
- `frontend/assets/js/app.js`
- `frontend/assets/css/style.css`
- `frontend/pages/app/index.html`
- `README.md`

## Como atualizar

```powershell
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm start
```

Não precisa rodar migration. Esta versão não altera o schema do banco.

Depois use `Ctrl + F5` no navegador em `http://localhost:3000/app`.
