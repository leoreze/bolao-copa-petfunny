# Entrega v0.2.22 — Regras claras, confiança e resgate Pix

## O que foi feito

- Adicionada aba **Regras e resgate** no `/app`.
- Criada seção de confiança explicando:
  - 10% do acumulado fica para operação do aplicativo;
  - 90% do acumulado vai para os ganhadores;
  - se houver mais de um ganhador, o valor é dividido igualmente;
  - resgate via Pix é pago em até 3 dias úteis após a solicitação.
- Cadastro do app agora permite informar chave Pix opcional.
- App permite salvar/atualizar **Meu Pix de resgate**.
- Criada área **Meus prêmios e resgates**.
- Usuário ganhador pode solicitar resgate do prêmio via Pix cadastrado.
- Cards de jogos ficaram mais transparentes no cálculo:
  - acumulado;
  - taxa de plataforma;
  - prêmio líquido.
- Backend ganhou tabela `prize_redemptions`.
- Backend ganhou endpoints:
  - `GET /api/app/rules`
  - `GET /api/app/prizes`
  - `PUT /api/app/me/pix`
  - `POST /api/app/prizes/:predictionId/redeem`

## Regra de premiação

- Valor acumulado do jogo = soma dos pagamentos aprovados.
- Taxa da plataforma = 10% do acumulado.
- Prêmio líquido = 90% do acumulado.
- Se existir 1 ganhador, ele recebe 100% do prêmio líquido.
- Se existirem múltiplos ganhadores, o prêmio líquido é dividido igualmente.
- Pagamento do resgate: até 3 dias úteis via Pix cadastrado.

## Como atualizar

```powershell
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm run db:migrate
npm start
```

Depois use `Ctrl + F5` no `/app`.

## Observação

Essa versão altera banco de dados. Rode `npm run db:migrate`.
