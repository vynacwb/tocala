# TocaLá

Marketplace de música ao vivo construído com Next.js 16, React Server Components, Tailwind CSS e Supabase SSR.

## Executar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com os dados do painel do Supabase. Execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor do projeto para criar as tabelas, políticas RLS e o gatilho de criação de perfil.

Sem as variáveis do Supabase, as páginas continuam disponíveis em modo visual de demonstração. Com as variáveis configuradas, `/perfil` exige uma sessão válida.

## Rotas

- `/` — landing page e busca
- `/login` — login e cadastro por e-mail
- `/perfil` — perfil protegido
- `/auth/callback` — confirmação de e-mail e callback PKCE

O Next.js 16 renomeou o arquivo de Middleware para [`src/proxy.ts`](src/proxy.ts). A renovação da sessão e as regras de acesso ficam em [`src/utils/supabase/middleware.ts`](src/utils/supabase/middleware.ts).
