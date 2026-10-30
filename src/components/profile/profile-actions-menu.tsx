"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Pencil } from "lucide-react";
import { useToast } from "@/components/providers/app-providers";
import { createClient } from "@/utils/supabase/client";

export function ProfileActionsMenu({ configured }: { configured: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function signOut() {
    if (!configured) {
      toast("Modo de demonstração: conecte o Supabase para encerrar uma sessão.", "error");
      return;
    }
    setLoading(true);
    const { error } = await createClient().auth.signOut();
    setLoading(false);
    if (error) {
      toast("Não foi possível encerrar sua sessão. Tente novamente.", "error");
      return;
    }
    setOpen(false);
    router.replace("/login");
    router.refresh();
  }

  return <div ref={menuRef} className="relative lg:hidden">
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/75 transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/15 hover:text-[#D6A0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]" aria-label={open ? "Fechar menu do perfil" : "Abrir menu do perfil"} aria-haspopup="menu" aria-expanded={open}>
      <Menu className="size-5" strokeWidth={1.8} />
    </button>
    {open && <div role="menu" className="absolute right-0 top-full z-[60] mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#222226] p-1.5 shadow-2xl shadow-black/50">
      <Link role="menuitem" href="/perfil/configuracoes" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"><Pencil className="size-4 text-[#D6A0FF]" />Editar perfil</Link>
      <button role="menuitem" type="button" onClick={signOut} disabled={loading} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/5 hover:text-rose-300 disabled:opacity-60"><LogOut className="size-4" />{loading ? "Saindo..." : "Sair"}</button>
    </div>}
  </div>;
}
