# Entrega v0.2.13 — Máscara no WhatsApp e jogos separados por data

## Versão entregue
`BolaoCopaPetFunny-v0.2.13-mascara-whatsapp-jogos-por-data.zip`

## O que foi feito
- Adicionada máscara automática no campo WhatsApp do cadastro do `/app`.
- O formato aplicado é `(16) 99999-9999`, com limite de 11 dígitos.
- `/admin > Jogos cadastrados` agora separa a listagem por data.
- `/app > Jogos disponíveis` agora separa os cards por data.
- O filtro por grupo no `/app` continua funcionando e a separação por data respeita o grupo selecionado.
- Mantido o menu de 3 pontinhos por jogo no admin.

## Arquivos alterados
- `frontend/assets/js/app.js`
- `frontend/assets/js/admin.js`
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

Depois de substituir os arquivos, use `Ctrl + F5` no navegador para limpar cache.
