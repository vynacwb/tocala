"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CircleDollarSign, House, Search } from "lucide-react";
import { useToast } from "@/components/providers/app-providers";
import { AccountMenu } from "@/components/layout/account-menu";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseConfigured } from "@/utils/supabase/config";

type Account = { avatarUrl: string | null; avatarPositionX: number; avatarPositionY: number };

export function MobileNav() {
  const { toast } = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;
    let active = true;
    async function loadAccount() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      const { data } = await supabase.from("profiles").select("avatar_url, avatar_position_x, avatar_position_y").eq("id", user.id).maybeSingle();
      if (active) setAccount({
        avatarUrl: data?.avatar_url ?? null,
        avatarPositionX: data?.avatar_position_x ?? 50,
        avatarPositionY: data?.avatar_position_y ?? 50,
      });
    }
    void loadAccount();
    return () => { active = false; };
  }, [configured]);

  return (
    <nav aria-label="Navegação mobile" className="fixed bottom-0 left-1/2 z-50 w-full max-w-[400px] -translate-x-1/2 border-t-2 border-[#6C1EE7] bg-[#202020]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="grid h-[76px] grid-cols-5 items-center px-1">
        <Link href="/#explorar" aria-label="Página inicial" className="mx-auto flex size-12 flex-col items-center justify-center gap-0.5 rounded-xl text-white/65 transition hover:bg-white/5 hover:text-[#D6A0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]">
          <House className="size-5" strokeWidth={1.8} /><span className="text-[9px] leading-none">Home</span>
        </Link>
        <button type="button" onClick={() => toast("A área Financeiro estará disponível em breve.")} aria-label="Financeiro, em breve" className="mx-auto flex size-12 flex-col items-center justify-center gap-0.5 rounded-xl text-white/65 transition hover:bg-white/5 hover:text-[#D6A0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]">
          <CircleDollarSign className="size-5" strokeWidth={1.8} /><span className="text-[9px] leading-none">Financeiro</span>
        </button>
        <Link href="/#busca" aria-label="Buscar artistas" className="mx-auto flex size-12 flex-col items-center justify-center gap-0.5 rounded-xl bg-[#6C1EE7] text-white shadow-lg shadow-[#6C1EE7]/25 transition hover:bg-[#BA3BE7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]">
          <Search className="size-5" strokeWidth={1.8} /><span className="text-[9px] leading-none">Buscar</span>
        </Link>
        <button type="button" onClick={() => toast("Notificações estarão disponíveis em breve.")} aria-label="Notificações, em breve" className="mx-auto flex size-12 flex-col items-center justify-center gap-0.5 rounded-xl text-white/65 transition hover:bg-white/5 hover:text-[#D6A0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]">
          <Bell className="size-5" strokeWidth={1.8} /><span className="text-[9px] leading-none">Avisos</span>
        </button>
        <div className="mx-auto flex flex-col items-center justify-center gap-0.5">
          <AccountMenu account={account} configured={configured} compact dropUp />
          <span className="pointer-events-none text-[9px] leading-none text-white/65">Perfil</span>
        </div>
      </div>
    </nav>
  );
}
