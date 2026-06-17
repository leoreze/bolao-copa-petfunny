# Entrega v0.2.20 — App: Header, Hero, Abas e Tabela da Copa

## Versão entregue
BolaoCopaPetFunny-v0.2.20-app-header-hero-abas-tabela.zip

## O que foi feito
- `/app`: header/navbar ajustado para ter a mesma largura do card hero.
- Header do app agora tem cantos arredondados, sombra e largura centralizada.
- Card hero ficou mais limpo:
  - removida a logo dentro do hero;
  - removidos os botões do hero;
  - mantidos apenas título e subtítulo.
- Botão **Tabela da Copa** agora fica junto dos demais botões/abas abaixo do hero.
- Botões/abas do app agora controlam conteúdo exclusivo:
  - Disponíveis;
  - Meus palpites;
  - Jogos antigos;
  - Todos os jogos;
  - Tabela da Copa.
- Ao clicar em **Tabela da Copa**, o app esconde a lista de jogos e mostra somente a tabela.
- Ao clicar nas abas de jogos, a tabela é escondida e aparece apenas a lista correspondente.
- Tabela da Copa no app ajustada para evitar barra de rolagem horizontal.
- Coluna **Seleção** ficou mais compacta.
- Nome da seleção usa reticências (`...`) quando não couber.

## Arquivos alterados
- `frontend/pages/app/index.html`
- `frontend/assets/js/app.js`
- `frontend/assets/css/style.css`
- `README.md`

## Banco de dados
Esta versão não altera schema do banco. Não precisa rodar migration.

## Como atualizar
```powershell
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm start
```

Depois abra:

```text
http://localhost:3000/app
```

Use `Ctrl + F5` para limpar cache.
