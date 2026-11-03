# Painel de Gestão — Comunidade Global

Next.js (App Router) pronto para o Vercel. Duas perspectivas: **Visão global** (big numbers, evolução, status de implantação por região) e **Perfil do cliente** (filtro por região). Atualização por upload de `.xlsx` atrás de login.

> Hoje roda com **dados fictícios**. Ao enviar a planilha real, os dados são substituídos.

## Rodar local

```bash
npm install
cp .env.example .env.local   # preencha ADMIN_USER, ADMIN_PASSWORD e AUTH_SECRET
npm run dev                  # http://localhost:3000
```

Local, sem banco configurado, os dados enviados ficam em `.data/dashboard.json`.

## Deploy no Vercel

1. Suba a pasta num repositório (GitHub) e importe no Vercel.
2. **Storage → Marketplace → Upstash Redis** → conecte ao projeto (cria `KV_REST_API_URL` e `KV_REST_API_TOKEN` sozinho).
3. Em **Settings → Environment Variables**, crie:
   - `ADMIN_USER` e `ADMIN_PASSWORD` (use senha forte)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `VIEW_REQUIRES_LOGIN` = `true` se até para **ver** o painel precisar de login (padrão: qualquer um com o link vê; só o upload é protegido)
4. Redeploy. Acesse `/login` → envia a planilha em `/admin`.

## Formato da planilha

Baixe o modelo em `/api/template`. Abas esperadas: `Regioes`, `Evolucao`, `Perfil`.
O mapeamento de abas/colunas fica em **`src/lib/parse.ts`** (`SHEETS` e `COLS`) — é o único lugar a ajustar quando chegar a planilha real. Se a estrutura for muito diferente, as telas em `src/components/Dashboard.tsx` também se adaptam.

## Segurança

- Sessão por cookie `httpOnly` assinado (JWT HS256, 8 h); senha comparada em tempo constante; atraso em login errado.
- Upload exige sessão válida, só `.xlsx`, máx. 4 MB (limite das funções do Vercel).
- Sem `ADMIN_PASSWORD`/`AUTH_SECRET` configurados, o login fica desativado (não existe senha padrão).
- A lib `xlsx` (SheetJS) do npm tem avisos conhecidos de vulnerabilidade; como só quem tem login envia arquivos, o risco é baixo, mas só envie planilhas suas.
- Dados guardados no Upstash Redis (privado). Não há logo da Getnet no projeto: coloque o asset oficial se for usar.

## Paleta

Vermelho Getnet `#EC0000` (brandbook) como cor principal. Séries por região: `#EC0000`, `#6B3FA0`, `#D68A00`, `#2F6FDE`, `#E8579A` (validadas para daltonismo e separação de cor). Ajuste em `src/components/Dashboard.tsx` (`CAT`) e `src/app/globals.css`.
