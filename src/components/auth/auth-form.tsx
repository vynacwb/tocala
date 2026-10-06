"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/providers/app-providers";
import { createClient } from "@/utils/supabase/client";

type Mode = "login" | "register";

export function AuthForm({ configured }: { configured: boolean }) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get("modo") === "cadastro" ? "register" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const isRegistering = mode === "register";

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
      setError("Configure as variáveis do Supabase em .env.local para ativar a autenticação.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (isRegistering) {
      const callbackUrl = `${window.location.origin}/auth/callback?next=/perfil`;
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
        router.push("/perfil");
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

    const redirectTo = searchParams.get("redirectTo");
    router.push(redirectTo?.startsWith("/") ? redirectTo : "/perfil");
    router.refresh();
  }

  return (
    <div className="w-full max-w-[420px]">
      <span className="inline-flex items-center gap-2 rounded-full border border-[#BA3BE7]/30 bg-[#6C1EE7]/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D6A0FF]">
        <span className="size-1.5 rounded-full bg-[#BA3BE7]" />Sua música começa aqui
      </span>
      <h1 className="mt-5 text-[34px] font-bold leading-tight tracking-[-0.045em] sm:text-[40px]">{isRegistering ? "Crie sua conta" : "Acesse seu palco"}</h1>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{isRegistering ? "Faça parte da comunidade que vive de música ao vivo." : "Entre para encontrar talentos, oportunidades e novas conexões."}</p>

      <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
        {isRegistering && <Input id="name" name="name" label="Nome" autoComplete="name" required placeholder="Seu nome" />}
        <Input id="email" name="email" label="E-mail" type="email" autoComplete="email" required placeholder="seu@email.com" />
        <div className="relative">
          <Input id="password" name="password" label="Senha" type={showPassword ? "text" : "password"} autoComplete={isRegistering ? "new-password" : "current-password"} minLength={6} required placeholder="Digite sua senha" className="pr-14" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute bottom-0 right-1 flex h-14 w-12 items-center justify-center text-white/45 transition hover:text-[#D6A0FF]" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {isRegistering && <Input id="passwordConfirmation" name="passwordConfirmation" label="Confirmar senha" type="password" autoComplete="new-password" minLength={6} required placeholder="Repita sua senha" />}
        {error && <p className="text-sm leading-relaxed text-rose-300" role="alert">{error}</p>}
        <Button type="submit" className="h-14 w-full" disabled={loading}>
          {loading && <LoaderCircle className="size-4 animate-spin" />}
          {loading ? "Aguarde..." : isRegistering ? "Cadastrar" : "Entrar"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-white/60">
        {isRegistering ? "Já tem uma conta?" : "Não tem uma conta?"}
        <button type="button" onClick={() => { setMode(isRegistering ? "login" : "register"); setError(""); }} className="ml-1 font-semibold text-[#D6A0FF] transition hover:text-white">
          {isRegistering ? "Entrar" : "Cadastre-se"}
        </button>
      </p>
    </div>
  );
}
