"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, MoreVertical, Settings } from "lucide-react";

const notifications = [
  { id: "review", title: "Você recebeu uma nova avaliação", detail: "Uma contratação fictícia avaliou sua apresentação.", time: "há alguns minutos", initials: "★", color: "bg-amber-500/20 text-amber-200" },
  { id: "profile", title: "Seu perfil está pronto para ser descoberto", detail: "Confira suas informações e disponibilidade.", time: "ontem", initials: "T", color: "bg-[#6C1EE7]/25 text-[#E4C9FF]" },
  { id: "booking", title: "Novas oportunidades começam aqui", detail: "Mantenha seu perfil atualizado para contratantes.", time: "há 3 dias", initials: "♫", color: "bg-emerald-500/15 text-emerald-200" },
];

export function NotificationBell({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((item) => !read.includes(item.id) && !hidden.includes(item.id)).length;

  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeEscape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("mousedown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, []);

  const panelPosition = variant === "desktop"
    ? "fixed right-4 top-[76px] sm:right-8"
    : "fixed bottom-[calc(76px+env(safe-area-inset-bottom)+12px)] left-1/2 -translate-x-1/2";

  return <div ref={rootRef} className={variant === "desktop" ? "relative" : "contents"}>
    <button type="button" aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ""}`} aria-expanded={open} onClick={() => setOpen((value) => !value)} className={variant === "desktop"
      ? "relative flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/15 hover:text-[#D6A0FF]"
      : "relative mx-auto flex size-12 flex-col items-center justify-center gap-0.5 rounded-xl text-white/65 transition hover:bg-white/5 hover:text-[#D6A0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]"}>
      <Bell className={variant === "desktop" ? "size-5" : "size-5"} strokeWidth={1.8} />
      {variant === "mobile" && <span className="text-[9px] leading-none">Notificações</span>}
      {unreadCount > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-[#BA3BE7] ring-2 ring-[#1A1A1A]" aria-hidden="true" />}
    </button>

    {open && <section role="dialog" aria-label="Notificações" className={`${panelPosition} z-[70] flex max-h-[min(74vh,620px)] w-[min(470px,calc(100vw-20px))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#222226] text-white shadow-2xl shadow-black/70`}>
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
        <div><h2 className="text-base font-semibold">Notificações</h2><p className="mt-0.5 text-xs text-white/45">{unreadCount ? `${unreadCount} não lidas` : "Tudo em dia"}</p></div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setRead(notifications.map((item) => item.id))} aria-label="Marcar todas como lidas" title="Marcar todas como lidas" className="flex size-9 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/5 hover:text-[#D6A0FF]"><Check className="size-4" /></button>
          <Link href="/notificacoes" onClick={() => setOpen(false)} aria-label="Configurações de notificações" className="flex size-9 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/5 hover:text-[#D6A0FF]"><Settings className="size-4" /></Link>
        </div>
      </header>
      <div className="overflow-y-auto">
        <p className="px-4 pb-2 pt-3 text-xs font-semibold text-white/45 sm:px-5">Recentes</p>
        {notifications.filter((item) => !hidden.includes(item.id)).map((item) => <article key={item.id} className={`group flex gap-3 px-4 py-3 transition hover:bg-white/[0.035] sm:px-5 ${read.includes(item.id) ? "opacity-65" : ""}`}>
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-full text-base font-bold ${item.color}`}>{item.initials}</span>
          <button type="button" onClick={() => setRead((current) => current.includes(item.id) ? current : [...current, item.id])} className="min-w-0 flex-1 text-left">
            <p className="text-sm leading-snug text-white/90">{item.title}</p><p className="mt-1 text-xs leading-relaxed text-white/55">{item.detail}</p><p className="mt-1.5 text-[11px] text-white/40">{item.time}</p>
          </button>
          <div className="flex shrink-0 flex-col items-center gap-1"><button type="button" onClick={() => setHidden((current) => [...current, item.id])} aria-label="Ocultar notificação" className="flex size-8 items-center justify-center rounded-full text-white/45 opacity-100 transition hover:bg-white/10 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"><MoreVertical className="size-4" /></button>{!read.includes(item.id) && <span className="size-2 rounded-full bg-[#3EA6FF]" aria-label="Não lida" />}</div>
        </article>)}
        {hidden.length === notifications.length && <p className="px-5 py-10 text-center text-sm text-white/50">Nenhuma notificação por enquanto.</p>}
      </div>
      <footer className="border-t border-white/10 p-3 text-center"><Link href="/notificacoes" onClick={() => setOpen(false)} className="text-xs font-semibold text-[#D6A0FF] hover:text-white">Ver todas as notificações</Link></footer>
    </section>}
  </div>;
}
