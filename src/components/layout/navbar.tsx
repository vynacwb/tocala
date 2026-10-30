import Link from "next/link";
import { Brand } from "./brand";
import { NotificationBell } from "./notification-bell";
import { AccountMenu } from "./account-menu";
import { DesktopComingSoon } from "./desktop-coming-soon";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export async function Navbar() {
  const configured = isSupabaseConfigured();
  let account: { profileId: string; avatarUrl: string | null; avatarPositionX: number; avatarPositionY: number } | null = null;

  if (configured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("avatar_url, avatar_position_x, avatar_position_y").eq("id", user.id).maybeSingle();
      account = {
        profileId: user.id,
        avatarUrl: data?.avatar_url ?? null,
        avatarPositionX: data?.avatar_position_x ?? 50,
        avatarPositionY: data?.avatar_position_y ?? 50,
      };
    }
  }

  return (
    <header className="fixed left-1/2 top-0 z-50 w-full max-w-[400px] -translate-x-1/2 border-b border-white/10 bg-[#1A1A1A]/95 backdrop-blur-xl lg:max-w-none">
      <div className="mx-auto max-w-[1200px] px-5 pb-4 pt-[calc(env(safe-area-inset-top)+18px)] lg:flex lg:h-20 lg:items-center lg:justify-between lg:gap-8 lg:px-6 lg:py-0">
        <div className="flex items-center justify-between">
          <Brand href="/#explorar" />
          {!account && <div className="ml-auto flex items-center gap-2 lg:hidden">
            <Link href="/login" className="inline-flex h-9 items-center justify-center rounded-lg border border-white/20 px-3 text-xs font-semibold text-white/85 transition hover:border-[#BA3BE7] hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]">Login</Link>
            <Link href="/login?modo=cadastro" className="inline-flex h-9 items-center justify-center rounded-lg bg-[#6C1EE7] px-3 text-xs font-semibold text-white transition hover:bg-[#BA3BE7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]">Register</Link>
          </div>}
        </div>

        <div className="mt-4 lg:hidden">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#BA3BE7]">Bem-vindo ao TocaLá</p>
          <p className="mt-1 text-xl font-semibold tracking-[-0.035em]">Olá, artista <span aria-hidden="true">✦</span></p>
        </div>

        <nav className="hidden items-center gap-9 text-sm font-medium text-white/70 lg:flex" aria-label="Navegação principal">
          <Link href="/#explorar" className="transition hover:text-[#D6A0FF]">Explorar</Link>
          <Link href="/#destaques" className="transition hover:text-[#D6A0FF]">Como Funciona</Link>
          <DesktopComingSoon showFinance={Boolean(account)} />
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {!account && <>
            <Link href="/login" className="inline-flex h-9 items-center justify-center rounded-lg border border-white/20 px-3 text-xs font-semibold text-white/85 transition hover:border-[#BA3BE7] hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7] lg:h-10 lg:px-4 lg:text-sm">Login</Link>
            <Link href="/login?modo=cadastro" className="inline-flex h-9 items-center justify-center rounded-lg bg-[#6C1EE7] px-3 text-xs font-semibold text-white transition hover:bg-[#BA3BE7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7] lg:h-10 lg:px-4 lg:text-sm">Register</Link>
          </>}
          {account && <NotificationBell profileId={account.profileId} variant="desktop" />}
          {account && <div className="hidden lg:block"><AccountMenu account={account} configured={configured} /></div>}
        </div>
      </div>
    </header>
  );
}
