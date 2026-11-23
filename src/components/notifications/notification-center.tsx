"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCircle2, FileSignature, MoreVertical } from "lucide-react";
import { getUserNotifications, isContractorSimulation, updateUserNotifications, USER_NOTIFICATIONS_CHANGE_EVENT, type UserNotification } from "@/lib/user-notifications";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function NotificationCenter({ profileId }: { profileId: string }) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const visible = notifications.filter((item) => !item.hidden);
  const unreadCount = visible.filter((item) => !item.read).length;

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

  function markRead(id: string) {
    setNotifications(updateUserNotifications(profileId, (items) => items.map((item) => item.id === id ? { ...item, read: true } : item)));
  }

  return <section aria-label="Suas notificações" className="overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A1A] shadow-xl shadow-black/10 lg:rounded-3xl">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
      <div><h2 className="font-semibold">Atividades recentes</h2><p className="mt-0.5 text-xs text-white/45">{unreadCount ? `${unreadCount} ${unreadCount === 1 ? "notificação não lida" : "notificações não lidas"}` : "Tudo em dia"}</p></div>
      {visible.length > 0 && <button type="button" onClick={() => setNotifications(updateUserNotifications(profileId, (items) => items.map((item) => ({ ...item, read: true }))))} className="tap-target inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-[#D6A0FF] transition hover:bg-white/5 hover:text-white"><Check className="size-4" />Marcar todas como lidas</button>}
    </header>
    <div className="divide-y divide-white/[0.07]">
      {visible.map((item) => <article key={item.id} className={`flex gap-3 border-l-[3px] px-5 py-4 sm:px-6 ${isContractorSimulation(item) ? "border-[#3EA6FF] bg-[#1565C0]/[0.09]" : "border-transparent"} ${item.read ? "opacity-65" : ""}`}>
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${isContractorSimulation(item) ? "bg-[#1565C0]/25 text-[#8DCAFF]" : "bg-[#6C1EE7]/25 text-[#E4C9FF]"}`}>{item.type === "contract-proposal" ? <FileSignature className="size-5" /> : item.type === "contract-accepted" ? <CheckCircle2 className="size-5" /> : <Bell className="size-5" />}</span>
        <div className="min-w-0 flex-1">
          {isContractorSimulation(item) && <span className="mb-1.5 inline-flex rounded-full border border-[#3EA6FF]/35 bg-[#1565C0]/20 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#8DCAFF]">Simulação do contratante</span>}
          <p className="text-sm font-medium text-white/90">{item.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-white/55">{item.detail}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs"><span className="text-white/35">{dateLabel(item.createdAt)}</span>{item.href && <Link href={item.href} onClick={() => markRead(item.id)} className={`font-semibold hover:text-white ${isContractorSimulation(item) ? "text-[#8DCAFF]" : "text-[#D6A0FF]"}`}>{item.actionLabel || "Abrir"}</Link>}</div>
        </div>
        <button type="button" onClick={() => setNotifications(updateUserNotifications(profileId, (items) => items.map((entry) => entry.id === item.id ? { ...entry, hidden: true } : entry)))} aria-label="Ocultar notificação" className="tap-target flex shrink-0 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"><MoreVertical className="size-4" /></button>
      </article>)}
      {visible.length === 0 && <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center"><span className="flex size-16 items-center justify-center rounded-2xl border border-[#BA3BE7]/25 bg-[#6C1EE7]/15 text-[#D6A0FF]"><Bell className="size-7" /></span><h2 className="mt-5 text-lg font-semibold">Nenhuma notificação por enquanto</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">Propostas e atualizações reais do seu fluxo aparecerão aqui. Os sons continuam sendo reproduzidos quando uma nova notificação é gerada, conforme as permissões do navegador.</p></div>}
    </div>
  </section>;
}
