"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CircleDollarSign, House, Trophy, UserRound } from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useToast } from "@/components/providers/app-providers";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseConfigured } from "@/utils/supabase/config";

type Account = { avatarUrl: string | null; avatarPositionX: number; avatarPositionY: number };

export function MobileNav() {
  const { toast } = useToast();
  const pathname = usePathname();
  const [account, setAccount] = useState<Account | null>(null);
  const configured = isSupabaseConfigured();
  const isHomeActive = pathname === "/";
  const isProfileActive = pathname.startsWith("/perfil");

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
      <div className={`grid h-[76px] ${account ? "grid-cols-5" : "grid-cols-4"} items-center px-1`}>
        <Link href="/#explorar" aria-label="Página inicial" aria-current={isHomeActive ? "page" : undefined} className={`mx-auto flex size-12 flex-col items-center justify-center gap-0.5 rounded-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7] ${isHomeActive ? "bg-[#6C1EE7]/25 text-[#D6A0FF] shadow-inner shadow-[#BA3BE7]/15" : "text-white/65 hover:bg-white/5 hover:text-[#D6A0FF]"}`}>
          <House className="size-5" strokeWidth={isHomeActive ? 2.3 : 1.8} /><span className="text-[9px] leading-none">Home</span>
        </Link>
        <button type="button" onClick={() => toast("O Ranking estará disponível em breve.")} aria-label="Ranking, em breve" className="mx-auto flex size-12 flex-col items-center justify-center gap-0.5 rounded-xl text-white/65 transition hover:bg-white/5 hover:text-[#D6A0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]">
          <Trophy className="size-5" strokeWidth={1.8} /><span className="text-[9px] leading-none">Ranking</span>
        </button>
        {account && <button type="button" onClick={() => toast("A área Financeiro estará disponível em breve.")} aria-label="Financeiro, em breve" className="mx-auto flex size-12 flex-col items-center justify-center gap-0.5 rounded-xl text-white/65 transition hover:bg-white/5 hover:text-[#D6A0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]">
          <CircleDollarSign className="size-5" strokeWidth={1.8} /><span className="text-[9px] leading-none">Financeiro</span>
        </button>}
        <NotificationBell variant="mobile" />
        <Link href="/perfil" aria-label="Abrir perfil" aria-current={isProfileActive ? "page" : undefined} className={`mx-auto flex size-12 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7] ${isProfileActive ? "bg-[#6C1EE7]/25 text-[#D6A0FF] shadow-inner shadow-[#BA3BE7]/15" : "text-white/65 hover:bg-white/5 hover:text-[#D6A0FF]"}`}>
          {account?.avatarUrl ? <Image src={account.avatarUrl} alt="" width={24} height={24} unoptimized style={{ objectPosition: `${account.avatarPositionX}% ${account.avatarPositionY}%` }} className={`size-6 rounded-full object-cover ${isProfileActive ? "ring-1 ring-[#D6A0FF]" : ""}`} /> : <UserRound className="size-5" strokeWidth={isProfileActive ? 2.3 : 1.8} />}
          <span className="text-[9px] leading-none">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}
