# Bolão Copa PetFunny v0.2.12 — Correção da Tabela da Copa

## O que foi feito

- Corrigido o erro JavaScript `findTeamByCodeOrName is not defined` no `/admin`.
- Mantida compatibilidade com o nome antigo da função usado em alguns pontos da listagem.
- Corrigido o alinhamento da coluna **Seleção** em `/admin > Tabela da Copa`.
- Bandeira e nome da seleção agora ficam alinhados à esquerda em todos os grupos.
- Mantidas as bandeiras PNG locais em `frontend/assets/img/flags/`.
- Ajustado CSS para sobrescrever o alinhamento central da tabela compacta apenas na coluna de seleção.
- Atualizado cache busting para `v=0.2.12`.

## Arquivos alterados

- `frontend/assets/js/admin.js`
- `frontend/assets/css/style.css`
- `frontend/pages/admin/index.html`
- `frontend/pages/app/index.html`
- `README.md`

## Banco de dados

Esta versão não altera schema nem dados. Não precisa rodar migration.

## Como atualizar

```powershell
cd C:\Users\Leoni\CopaDoMundo
npm install --prefix backend
npm start
```

Depois abra `http://localhost:3000/admin`, entre em **Tabela da Copa** e use **Ctrl + F5** para limpar o cache.
