"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/app-providers";
import { deleteOwnAccount } from "@/app/perfil/conta/actions";

export function DeleteProfileButton({ configured }: { configured: boolean }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function confirmDeletion() {
    setError("");
    startTransition(async () => {
      const result = await deleteOwnAccount();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setConfirmOpen(false);
      toast("Sua conta e os dados associados foram excluídos.");
      router.replace("/login");
      router.refresh();
    });
  }

  return <>
    <button type="button" disabled={!configured} onClick={() => { setError(""); setUnderstood(false); setConfirmOpen(true); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 text-sm font-semibold text-rose-200 transition hover:border-rose-400/55 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="size-4" />Excluir conta</button>
    {!configured && <p className="mt-2 text-xs text-white/45">Conecte o Supabase para excluir uma conta real.</p>}

    {confirmOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setConfirmOpen(false); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-profile-title" aria-describedby="delete-profile-description" className="w-full max-w-md rounded-2xl border border-rose-400/25 bg-[#222226] p-5 shadow-2xl shadow-black/60 sm:p-6">
        <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300"><AlertTriangle className="size-5" /></div>
        <h2 id="delete-profile-title" className="mt-4 text-xl font-bold">Excluir conta permanentemente?</h2>
        <p id="delete-profile-description" className="mt-2 text-sm leading-relaxed text-white/60">Sua conta de acesso, os registros associados e as fotos enviadas ao TocaLá serão apagados. Não será possível recuperar essas informações.</p>
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5 text-sm text-white/75">
          <input type="checkbox" checked={understood} onChange={(event) => setUnderstood(event.target.checked)} disabled={pending} className="mt-0.5 size-4 accent-[#BA3BE7]" />
          <span>Entendo que essa exclusão é permanente.</span>
        </label>
        {error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setConfirmOpen(false)} disabled={pending} className="h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/75 transition hover:bg-white/5 disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={confirmDeletion} disabled={!understood || pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-45"><Trash2 className="size-4" />{pending ? "Excluindo..." : "Excluir permanentemente"}</button>
        </div>
      </section>
    </div>}
  </>;
}
