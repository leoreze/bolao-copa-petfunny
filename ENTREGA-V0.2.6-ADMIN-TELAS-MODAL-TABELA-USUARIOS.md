# Bolão Copa PetFunny v0.2.6 — Admin em Telas + Modal Premium + Tabela da Copa + Usuários

## O que foi feito

- Reorganização do `/admin` em telas internas acessadas por menu de cards:
  - Jogos cadastrados;
  - Pagamentos do bolão;
  - Palpites dos Usuários;
  - Tabela da Copa;
  - Usuários cadastrados.
- Renomeado "Palpites dos tutores" para "Palpites dos Usuários".
- Adicionado botão/card "Tabela da Copa".
- Adicionado botão/card "Usuários cadastrados".
- `+ Novo jogo` agora abre em modal premium.
- Modal de jogo com:
  - header fixo;
  - título;
  - subtítulo;
  - conteúdo com rolagem;
  - rodapé fixo com ações;
  - layout responsivo mobile.
- Edição de jogo também abre no mesmo modal premium.
- Coluna Ações mantém menu de 3 pontinhos com:
  - Editar;
  - Ver palpites;
  - Apurar jogo;
  - Excluir.
- Ação "Ver palpites" abre automaticamente a tela "Palpites dos Usuários" filtrada pelo jogo.
- Fluxos CRUD com respostas padronizadas:
  - cadastrado com sucesso;
  - atualizado com sucesso;
  - excluído com sucesso;
  - aprovado com sucesso;
  - prêmio marcado como entregue;
  - erros em toast vermelho.
- Exclusão e apuração agora usam modal de confirmação premium.
- Backend recebeu endpoints admin:
  - `GET /api/bolao-copa/users`;
  - `GET /api/bolao-copa/standings`.
- Tabela da Copa é calculada automaticamente pelos jogos cadastrados/finalizados:
  - pontos;
  - jogos;
  - vitórias;
  - empates;
  - derrotas;
  - gols pró;
  - gols contra;
  - saldo de gols.

## Arquivos principais alterados

- `frontend/pages/admin/index.html`
- `frontend/assets/js/admin.js`
- `frontend/assets/css/style.css`
- `backend/src/app.js`
- `README.md`

## Como atualizar

```bash
npm install --prefix backend
npm run db:migrate
npm run db:seed
npm start
```

## Como testar

1. Acesse `http://localhost:3000/admin`.
2. Entre no admin.
3. Clique nos cards do menu:
   - Jogos cadastrados;
   - Pagamentos do bolão;
   - Palpites dos Usuários;
   - Tabela da Copa;
   - Usuários cadastrados.
4. Clique em `+ Novo jogo`.
5. Confirme se o formulário abriu em modal premium com header e rodapé fixos.
6. Cadastre um jogo.
7. Na tabela, clique no botão de 3 pontinhos.
8. Teste editar, ver palpites, apurar e excluir.
9. Finalize um jogo com placar e acesse "Tabela da Copa".
10. Cadastre um usuário no `/app` e veja em "Usuários cadastrados".

## Observações

- Esta versão não exige nova coluna de banco.
- Os novos endpoints leem dados já existentes em `tutors`, `world_cup_games`, `bolao_payments` e `world_cup_predictions`.
- A tabela da Copa considera apenas jogos com status `finished` e placares preenchidos para pontuação.
- Jogos ainda não finalizados aparecem na composição do grupo, mas com pontuação zerada.
