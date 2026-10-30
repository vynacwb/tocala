import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell, BellRing } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { MobileNav } from "@/components/layout/mobile-nav";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: "Notificações" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?redirectTo=/notificacoes");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[400px] bg-[#1A1A1A] shadow-2xl shadow-black/40 lg:max-w-none lg:bg-[#101010] lg:shadow-none">
      <header className="border-b border-white/10 bg-[#1A1A1A]/95 backdrop-blur-xl lg:bg-[#1A1A1A]/85">
        <div className="relative mx-auto flex h-[calc(env(safe-area-inset-top)+76px)] max-w-[1200px] items-center justify-between px-5 pt-[env(safe-area-inset-top)] lg:h-20 lg:px-6 lg:pt-0">
          <Link href="/#explorar" className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#D6A0FF] transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/15" aria-label="Voltar para a página inicial"><ArrowLeft className="size-5" /></Link>
          <div className="absolute left-1/2 -translate-x-1/2 lg:static lg:ml-5 lg:translate-x-0"><Brand compact /></div>
          <div className="flex size-10 items-center justify-center rounded-xl border border-[#BA3BE7]/30 bg-[#6C1EE7]/15 text-[#D6A0FF]" aria-hidden="true"><Bell className="size-5" /></div>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-5 pb-32 pt-9 sm:px-8 lg:pb-20 lg:pt-14">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#BA3BE7]">Central de atividades</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Notificações</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">Acompanhe por aqui as novidades e atualizações da sua conta.</p>
        </div>

        <section aria-label="Suas notificações" className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#1A1A1A] px-6 py-12 text-center shadow-xl shadow-black/10 lg:min-h-[420px] lg:rounded-3xl">
          <div className="relative flex size-20 items-center justify-center rounded-3xl border border-[#BA3BE7]/25 bg-[#6C1EE7]/15 text-[#D6A0FF]">
            <BellRing className="size-9" strokeWidth={1.5} />
            <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[#1A1A1A] bg-[#BA3BE7]" />
          </div>
          <h2 className="mt-6 text-xl font-semibold tracking-tight">Você está em dia</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/55">Quando houver notificações para sua conta, elas aparecerão aqui.</p>
          <Link href="/#explorar" className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-[#6C1EE7] px-5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]">Voltar para o início</Link>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
