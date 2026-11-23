"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/providers/app-providers";
import { createClient } from "@/utils/supabase/client";

type Mode = "login" | "register";
type SocialProvider = "google" | "linkedin_oidc" | "spotify";

const socialProviders: Array<{ id: SocialProvider; label: string; mark: string }> = [
  { id: "google", label: "Google", mark: "G" },
  { id: "linkedin_oidc", label: "LinkedIn", mark: "in" },
  { id: "spotify", label: "Spotify", mark: "●" },
];

function callbackErrorMessage(code: string | null) {
  if (!code) return "";
  if (code === "oauth_cancelado") return "O acesso pelo provedor foi cancelado. Você pode tentar novamente ou entrar com e-mail e senha.";
  if (code === "configuracao") return "A conexão com o Supabase não está configurada neste ambiente.";
  if (code === "perfil") return "O login foi concluído, mas não foi possível preparar seu perfil. Tente novamente ou fale com o suporte.";
  return "Não foi possível concluir o login social. Tente novamente.";
}

export function AuthForm({ configured }: { configured: boolean }) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get("modo") === "cadastro" ? "register" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [error, setError] = useState(() => callbackErrorMessage(searchParams.get("erro")));
  const router = useRouter();
  const { toast } = useToast();

  const isRegistering = mode === "register";
  const requestedDestination = searchParams.get("redirectTo");
  const postLoginDestination = requestedDestination?.startsWith("/") && !requestedDestination.startsWith("//")
    ? requestedDestination
    : "/";

  async function handleSocialLogin(provider: SocialProvider) {
    setError("");
    if (!configured) {
      setError("A conexão com o Supabase não está configurada neste ambiente. Adicione as variáveis no .env.local ou no painel do deploy.");
      return;
    }

    setLoadingProvider(provider);
    const supabase = createClient();
    const socialDestination = isRegistering ? "/perfil/configuracoes" : postLoginDestination;
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(socialDestination)}`;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl },
    });

    if (authError) {
      setLoadingProvider(null);
      setError(`Não foi possível entrar com ${socialProviders.find((item) => item.id === provider)?.label ?? "o provedor"}. ${authError.message}`);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("passwordConfirmation") ?? "");

    if (isRegistering && password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!configured) {
      setError("A conexão com o Supabase não está configurada neste ambiente. Adicione as variáveis no .env.local ou no painel do deploy.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (isRegistering) {
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/perfil/configuracoes")}`;
      const { data: result, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl, data: { full_name: name } },
      });
      setLoading(false);
      if (authError) {
        setError(authError.message);
        return;
      }
      if (result.session) {
        router.push("/perfil/configuracoes");
        router.refresh();
        return;
      }
      toast("Conta criada. Confirme o e-mail para acessar seu palco.");
      setMode("login");
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    router.push(postLoginDestination);
    router.refresh();
  }

  return (
    <div className="w-full max-w-[420px]">
      <span className="inline-flex items-center gap-2 rounded-full border border-[#BA3BE7]/30 bg-[#6C1EE7]/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D6A0FF]">
        <span className="size-1.5 rounded-full bg-[#BA3BE7]" />Sua música começa aqui
      </span>
      <h1 className="mt-5 text-[34px] font-bold leading-tight tracking-[-0.045em] sm:text-[40px]">{isRegistering ? "Crie sua conta" : "Acesse seu palco"}</h1>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{isRegistering ? "Faça parte da comunidade que vive de música ao vivo." : "Entre para encontrar talentos, oportunidades e novas conexões."}</p>

      <div className="mt-8 grid gap-2.5 sm:grid-cols-3" aria-label="Entrar com uma conta social">
        {socialProviders.map((provider) => <button key={provider.id} type="button" disabled={loading || loadingProvider !== null} onClick={() => handleSocialLogin(provider.id)} className="tap-target inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-sm font-semibold text-white/80 transition hover:border-[#BA3BE7]/70 hover:bg-[#6C1EE7]/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-55">
          {loadingProvider === provider.id ? <LoaderCircle className="size-4 animate-spin" /> : <span className="flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-black text-[#1A1A1A]" aria-hidden="true">{provider.mark}</span>}
          {provider.label}
        </button>)}
      </div>

      <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35" aria-hidden="true"><span className="h-px flex-1 bg-white/10" />ou use seu e-mail<span className="h-px flex-1 bg-white/10" /></div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {isRegistering && <Input id="name" name="name" label="Nome" autoComplete="name" required placeholder="Seu nome" />}
        <Input id="email" name="email" label="E-mail" type="email" autoComplete="email" required placeholder="seu@email.com" />
        <div className="relative">
          <Input id="password" name="password" label="Senha" type={showPassword ? "text" : "password"} autoComplete={isRegistering ? "new-password" : "current-password"} minLength={6} required placeholder="Digite sua senha" className="pr-14" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="tap-target absolute bottom-0 right-1 flex h-14 w-12 items-center justify-center rounded-xl text-white/45 transition-all duration-200 hover:bg-white/[0.04] hover:text-[#D6A0FF] active:scale-95" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {isRegistering && <Input id="passwordConfirmation" name="passwordConfirmation" label="Confirmar senha" type="password" autoComplete="new-password" minLength={6} required placeholder="Repita sua senha" />}
        {error && <p className="text-sm leading-relaxed text-rose-300" role="alert">{error}</p>}
        <Button type="submit" className="h-14 w-full" disabled={loading || loadingProvider !== null}>
          {loading && <LoaderCircle className="size-4 animate-spin" />}
          {loading ? "Aguarde..." : isRegistering ? "Cadastrar" : "Entrar"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-white/60">
        {isRegistering ? "Já tem uma conta?" : "Não tem uma conta?"}
        <button type="button" onClick={() => { setMode(isRegistering ? "login" : "register"); setError(""); }} className="tap-target ml-1 inline-flex items-center rounded-lg px-1 font-semibold text-[#D6A0FF] transition-all duration-200 hover:text-white">
          {isRegistering ? "Entrar" : "Cadastre-se"}
        </button>
      </p>
    </div>
  );
}
