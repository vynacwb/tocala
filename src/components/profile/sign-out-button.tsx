"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
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
    <button type="button" onClick={signOut} disabled={loading} className="tap-target group flex items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 transition-all duration-200 hover:border-[#BA3BE7] hover:text-[#D6A0FF] active:scale-95 disabled:opacity-60 disabled:active:scale-100" aria-label={configured ? "Sair" : "Personalização"}>
      {configured ? <LogOut className="size-5" strokeWidth={1.8} /> : <UserRound className="size-5" strokeWidth={1.8} />}
    </button>
  );
}
