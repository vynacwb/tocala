import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Music2 } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { AuthForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-[#1A1A1A] text-white lg:grid lg:grid-cols-2 lg:bg-[#101010]">
      <section className="relative hidden min-h-dvh overflow-hidden bg-[#20132F] lg:flex lg:items-center lg:justify-center" aria-label="TocaLá, música ao vivo">
        <Image src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=85" alt="Show ao vivo iluminado por luzes de palco" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#10091B]/80 via-[#24123E]/55 to-[#6C1EE7]/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="relative z-10 px-12 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-[1.5rem] bg-[#6C1EE7] shadow-2xl shadow-black/40"><Music2 className="size-12" strokeWidth={2.5} /></div>
          <p className="mt-5 text-5xl font-extrabold tracking-[-0.065em]">Toca<span className="text-[#D6A0FF]">Lá</span></p>
          <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-white/85">Sua próxima conexão musical começa aqui.</p>
        </div>
      </section>

      <section className="relative flex min-h-dvh items-center justify-center px-6 pb-12 pt-[calc(env(safe-area-inset-top)+88px)] sm:px-10 lg:px-12 lg:py-20">
        <Link href="/" className="absolute left-6 top-[calc(env(safe-area-inset-top)+24px)] inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:border-[#BA3BE7] hover:text-white lg:left-12 lg:top-8" aria-label="Voltar para o início"><ArrowLeft className="size-5" /></Link>
        <div className="absolute left-6 top-[calc(env(safe-area-inset-top)+105px)] lg:hidden"><Brand /></div>
        <div className="w-full pt-24 lg:pt-0">
          <Suspense fallback={<div className="mx-auto h-[520px] w-full max-w-[420px] animate-pulse rounded-2xl bg-white/5" />}>
            <div className="mx-auto max-w-[420px]"><AuthForm configured={isSupabaseConfigured()} /></div>
          </Suspense>
        </div>
      </section>
    </main>
  );
}
