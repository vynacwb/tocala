# E-mail de confirmação do TocaLá

O Supabase hospedado usa o conteúdo deste HTML pelo painel de autenticação. Para aplicar:

1. Abra **Authentication → Email Templates → Confirm signup** no dashboard do Supabase.
2. Defina o assunto como `Confirme seu e-mail para entrar no TocaLá`.
3. Cole todo o conteúdo de `confirm-signup.html` no campo do corpo do e-mail e salve.
4. Em **Authentication → URL Configuration**, confira se o Site URL está como `https://tocala.vercel.app` e se a URL de callback do app está permitida: `https://tocala.vercel.app/auth/callback`.

O link principal mantém `{{ .ConfirmationURL }}` do Supabase. Ele preserva a validação do token e o redirecionamento configurado no cadastro. O link secundário usa `{{ .SiteURL }}`.

O arquivo precisa ser colado no dashboard do projeto Supabase; enviar o HTML ao GitHub não altera automaticamente o template hospedado.
