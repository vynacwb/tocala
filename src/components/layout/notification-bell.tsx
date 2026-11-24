"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCircle2, FileSignature, MoreVertical, Settings } from "lucide-react";
import { isContractorSimulation, loadUserNotifications, markAllUserNotificationsRead, patchUserNotification, playUserNotificationSound, USER_NOTIFICATIONS_CHANGE_EVENT, type UserNotification, type UserNotificationType } from "@/lib/user-notifications";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseConfigured } from "@/utils/supabase/config";

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days === 1 ? "" : "s"}`;
}

export function NotificationBell({ profileId, variant = "desktop" }: { profileId: string; variant?: "desktop" | "mobile" | "global" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const visibleNotifications = notifications.filter((item) => !item.hidden);
  const unreadCount = visibleNotifications.filter((item) => !item.read).length;

  useEffect(() => {
    const refresh = () => { void loadUserNotifications(profileId).then(setNotifications); };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(USER_NOTIFICATIONS_CHANGE_EVENT, refresh);
    const supabase = isSupabaseConfigured() ? createClient() : null;
    const channel = supabase?.channel(`notifications-bell-${profileId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_notifications", filter: `recipient_id=eq.${profileId}` }, (payload) => {
        refresh();
        if (payload.eventType === "INSERT") playUserNotificationSound((payload.new.type as UserNotificationType | undefined) ?? "general");
      })
      .subscribe();
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(USER_NOTIFICATIONS_CHANGE_EVENT, refresh);
      if (supabase && channel) void supabase.removeChannel(channel);
    };
  }, [profileId]);

  function patchNotification(id: string, changes: Partial<Pick<UserNotification, "read" | "hidden">>) {
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item));
    void patchUserNotification(profileId, id, changes);
  }

  function markAllRead() {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    void markAllUserNotificationsRead(profileId);
  }

  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeEscape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("mousedown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, []);

  const panelPosition = variant === "global"
    ? "fixed right-3 top-[calc(env(safe-area-inset-top)+148px)] sm:right-5 lg:top-40"
    : variant === "desktop"
      ? "fixed right-4 top-[76px] sm:right-8"
      : "fixed bottom-[calc(76px+env(safe-area-inset-bottom)+12px)] left-1/2 -translate-x-1/2";

  return <div ref={rootRef} className={variant === "global" ? "fixed right-3 top-[calc(env(safe-area-inset-top)+88px)] z-[80] sm:right-5 lg:top-24" : variant === "desktop" ? "relative" : "contents"}>
    <button type="button" aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ""}`} aria-expanded={open} aria-controls={`notifications-panel-${variant}`} onClick={() => setOpen((value) => !value)} className={variant === "desktop"
      ? "tap-target relative flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-all duration-200 hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/15 hover:text-[#D6A0FF] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]"
      : variant === "global"
        ? "tap-target relative flex size-12 items-center justify-center rounded-full border border-[#BA3BE7]/35 bg-[#21182C]/95 text-[#D6A0FF] shadow-xl shadow-black/35 backdrop-blur-xl transition-all duration-200 hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/25 hover:text-white active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]"
        : "tap-target relative mx-auto flex size-12 flex-col items-center justify-center gap-0.5 rounded-xl text-white/65 transition-all duration-200 hover:bg-white/5 hover:text-[#D6A0FF] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]"}>
      <Bell className={variant === "desktop" ? "size-5" : "size-5"} strokeWidth={1.8} />
      {variant === "mobile" && <span className="text-[9px] leading-none">Notificações</span>}
      {unreadCount > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-[#BA3BE7] ring-2 ring-[#1A1A1A]" aria-hidden="true" />}
    </button>

    {open && <section id={`notifications-panel-${variant}`} role="dialog" aria-label="Notificações" className={`${panelPosition} z-[90] flex max-h-[min(72dvh,620px)] w-[min(470px,calc(100vw-20px))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#222226]/98 text-white shadow-2xl shadow-black/70 backdrop-blur-xl`}>
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
        <div><h2 className="text-base font-semibold">Notificações</h2><p className="mt-0.5 text-xs text-white/45">{unreadCount ? `${unreadCount} não lidas` : "Tudo em dia"}</p></div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={markAllRead} aria-label="Marcar todas como lidas" title="Marcar todas como lidas" className="tap-target flex items-center justify-center rounded-xl text-white/55 transition-all duration-200 hover:bg-white/5 hover:text-[#D6A0FF] active:scale-95"><Check className="size-4" /></button>
          <Link href="/notificacoes" onClick={() => setOpen(false)} aria-label="Configurações de notificações" className="tap-target flex items-center justify-center rounded-xl text-white/55 transition-all duration-200 hover:bg-white/5 hover:text-[#D6A0FF] active:scale-95"><Settings className="size-4" /></Link>
        </div>
      </header>
      <div className="overlay-scroll min-h-0 overflow-y-auto">
        <p className="px-4 pb-2 pt-3 text-xs font-semibold text-white/45 sm:px-5">Recentes</p>
        {visibleNotifications.map((item) => <article key={item.id} className={`group flex gap-3 border-l-2 px-4 py-3 transition sm:px-5 ${isContractorSimulation(item) ? "border-[#3EA6FF] bg-[#1565C0]/[0.08] hover:bg-[#1565C0]/[0.13]" : "border-transparent hover:bg-white/[0.035]"} ${item.read ? "opacity-65" : ""}`}>
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${isContractorSimulation(item) ? "bg-[#1565C0]/25 text-[#8DCAFF]" : "bg-[#6C1EE7]/25 text-[#E4C9FF]"}`}>{item.type === "contract-proposal" ? <FileSignature className="size-5" /> : item.type === "contract-accepted" ? <CheckCircle2 className="size-5" /> : <Bell className="size-5" />}</span>
          {item.href ? <Link href={item.href} onClick={() => { patchNotification(item.id, { read: true }); setOpen(false); }} className="min-h-11 min-w-0 flex-1 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]">
            {isContractorSimulation(item) && <span className="mb-1 inline-flex rounded-full border border-[#3EA6FF]/35 bg-[#1565C0]/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#8DCAFF]">Simulação do contratante</span>}<p className="text-sm leading-snug text-white/90">{item.title}</p><p className="mt-1 text-xs leading-relaxed text-white/55">{item.detail}</p><p className="mt-1.5 text-[11px] text-white/40">{relativeTime(item.createdAt)}{item.actionLabel ? ` · ${item.actionLabel}` : ""}</p>
          </Link> : <button type="button" onClick={() => patchNotification(item.id, { read: true })} className="min-h-11 min-w-0 flex-1 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]">
            {isContractorSimulation(item) && <span className="mb-1 inline-flex rounded-full border border-[#3EA6FF]/35 bg-[#1565C0]/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#8DCAFF]">Simulação do contratante</span>}<p className="text-sm leading-snug text-white/90">{item.title}</p><p className="mt-1 text-xs leading-relaxed text-white/55">{item.detail}</p><p className="mt-1.5 text-[11px] text-white/40">{relativeTime(item.createdAt)}</p>
          </button>}
          <div className="flex shrink-0 flex-col items-center gap-1"><button type="button" onClick={() => patchNotification(item.id, { hidden: true })} aria-label="Ocultar notificação" className="tap-target flex items-center justify-center rounded-full text-white/45 opacity-100 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"><MoreVertical className="size-4" /></button>{!item.read && <span className="size-2 rounded-full bg-[#3EA6FF]" aria-label="Não lida" />}</div>
        </article>)}
        {visibleNotifications.length === 0 && <p className="px-5 py-10 text-center text-sm text-white/50">Você não tem notificações por enquanto.</p>}
      </div>
      <footer className="border-t border-white/10 p-2 text-center"><Link href="/notificacoes" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-xs font-semibold text-[#D6A0FF] transition-colors duration-200 hover:bg-white/[0.04] hover:text-white">Ver todas as notificações</Link></footer>
    </section>}
  </div>;
}
