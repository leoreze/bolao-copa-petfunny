# Entrega v0.2.14 — Home do App, Jogos Antigos, Tabela da Copa e Premiação

## Versão entregue
`BolaoCopaPetFunny-v0.2.14-home-app-jogos-tabela-premiacao.zip`

## O que foi feito
- `/app`: home pós-login agora tem hero card compacto com a logo centralizada.
- Removido “PetFunny” do título principal do hero, ficando “Bolão da Copa”.
- Adicionado botão **Jogos antigos**.
- A listagem principal do app agora mostra apenas jogos que ainda aceitam palpite.
- Jogos encerrados, finalizados ou já palpitados aparecem somente ao clicar em **Jogos antigos**.
- Adicionado botão **Tabela da Copa** no app.
- A Tabela da Copa no app usa a mesma estrutura do admin: grupos A–L e mata-mata.
- Cada card de jogo mostra:
  - valor do jogo;
  - acumulado;
  - premiação;
  - valor estimado de retirada se acertar;
  - cálculo de retirada com 10% descontado do acumulado.
- Adicionado endpoint autenticado do participante:
  - `GET /api/app/bolao-copa/standings`

## Arquivos alterados
- `backend/src/app.js`
- `frontend/pages/app/index.html`
- `frontend/assets/js/app.js`
- `frontend/assets/css/style.css`
- `README.md`

## Como atualizar
```powershell
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm start
```

## Banco de dados
Esta versão não altera schema do banco.
Não precisa rodar migration.

## Como testar
1. Acesse `http://localhost:3000/app`.
2. Faça login como participante.
3. Verifique o hero com logo e título “Bolão da Copa”.
4. Confira que a home mostra somente jogos abertos para palpite.
5. Clique em **Jogos antigos** para ver jogos encerrados/finalizados/já palpitados.
6. Clique em **Tabela da Copa** para ver grupos e mata-mata.
7. Confira nos cards o campo de premiação e o valor estimado com 10% descontado do acumulado.

## Observações
- Após atualizar, use `Ctrl + F5` no `/app` para limpar cache do navegador.
- O valor “Retirada se acertar” é calculado no frontend como 90% do acumulado do jogo.
