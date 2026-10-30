# TocaLá

Marketplace de música ao vivo construído com Next.js 16, React Server Components, Tailwind CSS e Supabase SSR.

## Executar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com os dados do painel do Supabase. Execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor do projeto para criar as tabelas, políticas RLS, o gatilho de criação de perfil e o armazenamento de fotos de perfil.

Em desenvolvimento, mantenha essas variáveis em `.env.local`. Em um ambiente publicado, cadastre as mesmas variáveis no painel do provedor de deploy e defina `NEXT_PUBLIC_SITE_URL` com a URL pública do aplicativo.

Sem as variáveis do Supabase, as páginas continuam disponíveis em modo visual de demonstração. Com as variáveis configuradas, `/perfil` exige uma sessão válida.

## Banco de dados

O schema usa `auth.users` como fonte de identidade e mantém credenciais fora do schema público. A migração cria:

- `profiles` — dados públicos e tipo da conta;
- `musician_profiles` e `organizer_profiles` — informações específicas de cada perfil;
- `events` — eventos e oportunidades publicados por organizadores;
- `proposals` — propostas entre músicos e organizadores;
- `messages` — conversa privada vinculada à proposta;
- `reviews` — avaliações após eventos concluídos.

Todas as tabelas públicas possuem Row Level Security. Perfis, eventos e avaliações têm leitura pública; propostas e mensagens ficam restritas aos participantes.

## Rotas

- `/` — landing page e busca
- `/login` — login e cadastro por e-mail
- `/perfil` — perfil próprio protegido; perfis públicos usam `/perfil?artista=<id>`
- `/perfil/configuracoes` — personalização protegida do perfil e da carreira
- `/auth/callback` — confirmação de e-mail e callback PKCE

O Next.js 16 renomeou o arquivo de Middleware para [`src/proxy.ts`](src/proxy.ts). A renovação da sessão e as regras de acesso ficam em [`src/utils/supabase/middleware.ts`](src/utils/supabase/middleware.ts).
