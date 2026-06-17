# Bolão Copa PetFunny v0.2.9 — Correção do menu de ações no admin

## Objetivo
Corrigir o menu de 3 pontinhos da listagem **Jogos cadastrados** em `/admin`.

## Correção aplicada
- O menu de ações agora é renderizado em uma camada global no `<body>`.
- Isso evita que o menu fique escondido, cortado ou sem clique dentro da tabela com scroll horizontal, animação ou transform.
- O botão de 3 pontinhos continua na coluna **Ações**.
- Ao clicar, abre o menu com:
  - Editar
  - Ver palpites
  - Apurar jogo
  - Excluir
- As ações do menu passaram a ser tratadas por um handler central, funcionando mesmo quando o menu é exibido fora da tabela.
- Mantidas as respostas padrão de CRUD em toast e confirmação premium.

## Arquivos alterados
- `frontend/assets/js/admin.js`
- `frontend/assets/css/style.css`
- `frontend/pages/admin/index.html`

## Banco de dados
Não houve alteração de schema.

## Como atualizar
```powershell
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm start
```

Depois usar `Ctrl + F5` no navegador.

## Como testar
1. Abrir `http://localhost:3000/admin`.
2. Entrar no admin.
3. Abrir a tela **Jogos cadastrados**.
4. Clicar nos 3 pontinhos na coluna **Ações**.
5. Confirmar que aparecem: Editar, Ver palpites, Apurar jogo e Excluir.
6. Testar cada ação.
