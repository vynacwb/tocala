"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, FileSignature, MoreVertical, Settings } from "lucide-react";
import { getUserNotifications, updateUserNotifications, USER_NOTIFICATIONS_CHANGE_EVENT, type UserNotification } from "@/lib/user-notifications";

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days === 1 ? "" : "s"}`;
}

export function NotificationBell({ profileId, variant = "desktop" }: { profileId: string; variant?: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const visibleNotifications = notifications.filter((item) => !item.hidden);
  const unreadCount = visibleNotifications.filter((item) => !item.read).length;

  useEffect(() => {
    const refresh = () => setNotifications(getUserNotifications(profileId));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(USER_NOTIFICATIONS_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(USER_NOTIFICATIONS_CHANGE_EVENT, refresh);
    };
  }, [profileId]);

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
    <button type="button" aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ""}`} aria-expanded={open} aria-controls={`notifications-panel-${variant}`} onClick={() => setOpen((value) => !value)} className={variant === "desktop"
      ? "tap-target relative flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-all duration-200 hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/15 hover:text-[#D6A0FF] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]"
      : "tap-target relative mx-auto flex size-12 flex-col items-center justify-center gap-0.5 rounded-xl text-white/65 transition-all duration-200 hover:bg-white/5 hover:text-[#D6A0FF] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]"}>
      <Bell className={variant === "desktop" ? "size-5" : "size-5"} strokeWidth={1.8} />
      {variant === "mobile" && <span className="text-[9px] leading-none">Notificações</span>}
      {unreadCount > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-[#BA3BE7] ring-2 ring-[#1A1A1A]" aria-hidden="true" />}
    </button>

    {open && <section id={`notifications-panel-${variant}`} role="dialog" aria-label="Notificações" className={`${panelPosition} z-[90] flex max-h-[min(72dvh,620px)] w-[min(470px,calc(100vw-20px))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#222226]/98 text-white shadow-2xl shadow-black/70 backdrop-blur-xl`}>
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
        <div><h2 className="text-base font-semibold">Notificações</h2><p className="mt-0.5 text-xs text-white/45">{unreadCount ? `${unreadCount} não lidas` : "Tudo em dia"}</p></div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setNotifications(updateUserNotifications(profileId, (items) => items.map((item) => ({ ...item, read: true }))))} aria-label="Marcar todas como lidas" title="Marcar todas como lidas" className="tap-target flex items-center justify-center rounded-xl text-white/55 transition-all duration-200 hover:bg-white/5 hover:text-[#D6A0FF] active:scale-95"><Check className="size-4" /></button>
          <Link href="/notificacoes" onClick={() => setOpen(false)} aria-label="Configurações de notificações" className="tap-target flex items-center justify-center rounded-xl text-white/55 transition-all duration-200 hover:bg-white/5 hover:text-[#D6A0FF] active:scale-95"><Settings className="size-4" /></Link>
        </div>
      </header>
      <div className="overlay-scroll min-h-0 overflow-y-auto">
        <p className="px-4 pb-2 pt-3 text-xs font-semibold text-white/45 sm:px-5">Recentes</p>
        {visibleNotifications.map((item) => <article key={item.id} className={`group flex gap-3 px-4 py-3 transition hover:bg-white/[0.035] sm:px-5 ${item.read ? "opacity-65" : ""}`}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#6C1EE7]/25 text-[#E4C9FF]">{item.type === "contract-proposal" ? <FileSignature className="size-5" /> : <Bell className="size-5" />}</span>
          <button type="button" onClick={() => setNotifications(updateUserNotifications(profileId, (items) => items.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry)))} className="min-h-11 min-w-0 flex-1 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]">
            <p className="text-sm leading-snug text-white/90">{item.title}</p><p className="mt-1 text-xs leading-relaxed text-white/55">{item.detail}</p><p className="mt-1.5 text-[11px] text-white/40">{relativeTime(item.createdAt)}</p>
          </button>
          <div className="flex shrink-0 flex-col items-center gap-1"><button type="button" onClick={() => setNotifications(updateUserNotifications(profileId, (items) => items.map((entry) => entry.id === item.id ? { ...entry, hidden: true } : entry)))} aria-label="Ocultar notificação" className="tap-target flex items-center justify-center rounded-full text-white/45 opacity-100 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"><MoreVertical className="size-4" /></button>{!item.read && <span className="size-2 rounded-full bg-[#3EA6FF]" aria-label="Não lida" />}</div>
        </article>)}
        {visibleNotifications.length === 0 && <p className="px-5 py-10 text-center text-sm text-white/50">Você não tem notificações por enquanto.</p>}
      </div>
      <footer className="border-t border-white/10 p-2 text-center"><Link href="/notificacoes" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-xs font-semibold text-[#D6A0FF] transition-colors duration-200 hover:bg-white/[0.04] hover:text-white">Ver todas as notificações</Link></footer>
    </section>}
  </div>;
}
