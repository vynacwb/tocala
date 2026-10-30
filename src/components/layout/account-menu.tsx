"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, Pencil, UserRound } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/providers/app-providers";

type Account = { avatarUrl: string | null; avatarPositionX: number; avatarPositionY: number };

export function AccountMenu({ account, configured, compact = false, dropUp = false }: { account: Account | null; configured: boolean; compact?: boolean; dropUp?: boolean }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function signOut() {
    if (configured) {
      const { error } = await createClient().auth.signOut();
      if (error) {
        toast("Não foi possível encerrar sua sessão. Tente novamente.", "error");
        return;
      }
    }
    setOpen(false);
    router.replace("/login");
    router.refresh();
  }

  if (!account) {
    return <Link href="/login" className={`flex ${compact ? "size-10" : "size-11"} items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]`} aria-label="Entrar ou criar conta"><UserRound className="size-6" strokeWidth={1.8} /></Link>;
  }

  return <div ref={menuRef} className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} className={`flex ${compact ? "size-10" : "size-11"} items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/5 text-white transition hover:border-[#BA3BE7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]`} aria-label="Abrir menu da conta" aria-haspopup="menu" aria-expanded={open}>
      {account.avatarUrl ? <Image src={account.avatarUrl} alt="" width={44} height={44} unoptimized style={{ objectPosition: `${account.avatarPositionX}% ${account.avatarPositionY}%` }} className="h-full w-full object-cover" /> : <UserRound className="size-6" strokeWidth={1.8} />}
    </button>
    {open && <div role="menu" className={`absolute ${dropUp ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2"} z-[60] w-52 overflow-hidden rounded-xl border border-white/10 bg-[#222226] p-1.5 shadow-2xl shadow-black/50`}>
      <Link role="menuitem" href="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"><UserRound className="size-4 text-[#D6A0FF]" />Perfil</Link>
      <Link role="menuitem" href="/perfil/configuracoes" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"><Pencil className="size-4 text-[#D6A0FF]" />Editar perfil</Link>
      <div className="my-1 border-t border-white/10" />
      <button role="menuitem" type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/5 hover:text-rose-300"><LogOut className="size-4" />Sair</button>
    </div>}
  </div>;
}
