# Entrega v0.2.21 — Palpites e ganhadores por jogo no app

## Versão entregue

`BolaoCopaPetFunny-v0.2.21-palpites-ganhadores-app.zip`

## O que foi feito

- Corrigida a exibição do mata-mata no `/app` para garantir a fase **16 avos**.
- Adicionado botão **Ver palpites e ganhadores** em todos os cards de jogo do `/app`.
- Criado modal premium no app para mostrar:
  - usuários que palpitarem no jogo;
  - placar enviado por cada usuário;
  - quantidade total de palpites;
  - acumulado do jogo;
  - desconto de 10% da plataforma;
  - valor líquido destinado aos ganhadores;
  - ganhadores do jogo;
  - valor dividido por ganhador.
- Criado endpoint de leitura para o participante:
  - `GET /api/app/bolao-copa/:gameId/predictions`

## Regra de premiação

- Acumulado do jogo = soma dos pagamentos aprovados daquele jogo.
- Plataforma = 10% do acumulado.
- Valor para ganhadores = 90% do acumulado.
- Se houver mais de um ganhador, o valor para ganhadores é dividido igualmente.

Exemplo:

- Acumulado: R$ 100,00
- Plataforma: R$ 10,00
- Valor para ganhadores: R$ 90,00
- 3 ganhadores: R$ 30,00 para cada.

## Arquivos alterados

- `backend/src/app.js`
- `frontend/pages/app/index.html`
- `frontend/assets/js/app.js`
- `frontend/assets/css/style.css`
- `README.md`

## Como rodar

```powershell
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm start
```

## Banco de dados

Essa versão não altera schema do banco. Não precisa rodar migration.

## Como testar

1. Acesse `http://localhost:3000/app`.
2. Entre com um usuário participante.
3. Abra qualquer aba de jogos.
4. Em qualquer card de jogo, clique em **Ver palpites e ganhadores**.
5. Confira se o modal lista os usuários e os palpites daquele jogo.
6. Finalize um jogo no admin com placar.
7. Volte ao app e abra o modal novamente para ver os ganhadores e a divisão do prêmio.

## Observação

Depois de atualizar, use `Ctrl + F5` no navegador para limpar o cache do app.
