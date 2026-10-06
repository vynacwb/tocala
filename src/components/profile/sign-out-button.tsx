"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/providers/app-providers";

export function SignOutButton({ configured }: { configured: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function signOut() {
    if (!configured) {
      toast("Modo de demonstração: conecte o Supabase para encerrar uma sessão.", "error");
      return;
    }
    setLoading(true);
    const { error } = await createClient().auth.signOut();
    setLoading(false);
    if (error) {
      toast(error.message, "error");
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} disabled={loading} className="group flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 transition hover:border-[#BA3BE7] hover:text-[#D6A0FF] disabled:opacity-60" aria-label={configured ? "Sair" : "Configurações"}>
      {configured ? <LogOut className="size-5" strokeWidth={1.8} /> : <Settings className="size-5" strokeWidth={1.8} />}
    </button>
  );
}
