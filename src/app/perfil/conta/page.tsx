import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Settings, Trash2 } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Card } from "@/components/ui/card";
import { DeleteProfileButton } from "@/components/profile/delete-profile-button";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export const metadata: Metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const configured = isSupabaseConfigured();
  if (configured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?redirectTo=/perfil/conta");
  }

  return <div className="min-h-dvh bg-[#101010] text-white">
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#1A1A1A]/95 backdrop-blur-xl">
      <div className="relative mx-auto flex h-[calc(env(safe-area-inset-top)+76px)] max-w-[1200px] items-center justify-between px-5 pt-[env(safe-area-inset-top)] lg:h-20 lg:px-6 lg:pt-0">
        <Link href="/perfil" className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#D6A0FF] transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/15" aria-label="Voltar ao perfil"><ArrowLeft className="size-5" /></Link>
        <div className="absolute left-1/2 -translate-x-1/2"><Brand compact /></div>
        <span className="flex size-10 items-center justify-center rounded-xl border border-[#BA3BE7]/30 bg-[#6C1EE7]/15 text-[#D6A0FF]" aria-hidden="true"><Settings className="size-5" /></span>
      </div>
    </header>

    <main className="mx-auto max-w-[920px] px-4 pb-24 pt-[calc(env(safe-area-inset-top)+104px)] sm:px-6 lg:pt-32">
      <div className="mb-8">
        <span className="inline-flex items-center rounded-full border border-[#BA3BE7]/25 bg-[#6C1EE7]/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D6A0FF]">Conta e privacidade</span>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Configurações</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">Gerencie sua conta no TocaLá.</p>
      </div>

      <Card className="border-white/10 bg-[#1A1A1A] p-0">
        <div className="flex flex-col gap-4 rounded-2xl p-5 transition hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-rose-300/15 bg-rose-400/[0.07] text-rose-200"><Trash2 className="size-5" /></span>
            <div>
              <h2 className="text-base font-semibold text-white">Excluir conta</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/50">Exclui permanentemente sua conta e os dados associados.</p>
            </div>
          </div>
          <DeleteProfileButton configured={configured} />
        </div>
      </Card>
    </main>
  </div>;
}
