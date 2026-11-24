import { createClient } from "@/utils/supabase/client";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export type UserNotification = {
  id: string;
  title: string;
  detail: string;
  type?: UserNotificationType;
  href?: string;
  actionLabel?: string;
  simulationRole?: "contractor" | "artist";
  contractId?: string;
  createdAt: string;
  read: boolean;
  hidden: boolean;
};

export type UserNotificationType = "general" | "contract-proposal" | "contract-accepted" | "contract-payment" | "contract-checkin" | "contract-completed";

export const USER_NOTIFICATIONS_CHANGE_EVENT = "tocala:user-notifications-change";
export const USER_NOTIFICATION_SOUNDS: Record<UserNotificationType, string> = {
  general: "/sounds/universfield-new-notification-010-352755.mp3",
  "contract-proposal": "/sounds/universfield-positive-notification-351299.mp3",
  "contract-accepted": "/sounds/universfield-positive-notification-351299.mp3",
  "contract-payment": "/sounds/universfield-positive-notification-351299.mp3",
  "contract-checkin": "/sounds/universfield-positive-notification-351299.mp3",
  "contract-completed": "/sounds/universfield-positive-notification-351299.mp3",
};

export function isContractorSimulation(notification: UserNotification) {
  return notification.simulationRole === "contractor";
}

export function playUserNotificationSound(type: UserNotificationType = "general") {
  if (typeof Audio === "undefined") return;

  const audio = new Audio(USER_NOTIFICATION_SOUNDS[type]);
  audio.volume = 0.75;
  void audio.play().catch(() => {
    // Some browsers block audio until the user interacts with the page.
  });
}

function storageKey(profileId: string) {
  return `tocala:notifications:${encodeURIComponent(profileId)}`;
}

export function getUserNotifications(profileId: string): UserNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(storageKey(profileId)) || "[]");
    return Array.isArray(value) ? value.filter((item): item is UserNotification => Boolean(item && typeof item === "object" && typeof item.id === "string" && typeof item.title === "string" && typeof item.detail === "string")) : [];
  } catch { return []; }
}

function save(profileId: string, notifications: UserNotification[]) {
  window.localStorage.setItem(storageKey(profileId), JSON.stringify(notifications));
  window.dispatchEvent(new Event(USER_NOTIFICATIONS_CHANGE_EVENT));
}

export async function addUserNotification(profileId: string, notification: Pick<UserNotification, "title" | "detail" | "href" | "actionLabel" | "simulationRole" | "contractId"> & { type?: UserNotificationType }) {
  if (typeof window === "undefined" || !profileId) return false;
  const items = getUserNotifications(profileId);
  const type = notification.type ?? "general";
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  items.unshift({ id, ...notification, type, createdAt: new Date().toISOString(), read: false, hidden: false });
  save(profileId, items);
  if (!isSupabaseConfigured()) playUserNotificationSound(type);
  if (isSupabaseConfigured() && notification.contractId && /^[0-9a-f-]{36}$/i.test(profileId)) {
    const { error } = await createClient().from("user_notifications").insert({
      id,
      recipient_id: profileId,
      contract_id: notification.contractId,
      title: notification.title,
      detail: notification.detail,
      type,
      href: notification.href ?? null,
      action_label: notification.actionLabel ?? null,
      simulation_role: notification.simulationRole ?? null,
    });
    if (error) return false;
  }
  return true;
}

export async function loadUserNotifications(profileId: string): Promise<UserNotification[]> {
  const local = getUserNotifications(profileId);
  if (!isSupabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(profileId)) return local;
  const { data, error } = await createClient().from("user_notifications")
    .select("id, contract_id, title, detail, type, href, action_label, simulation_role, created_at, read, hidden")
    .eq("recipient_id", profileId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return local;
  const merged = new Map(local.map((item) => [item.id, item]));
  for (const row of data ?? []) {
    merged.set(row.id, {
      id: row.id,
      contractId: row.contract_id,
      title: row.title,
      detail: row.detail,
      type: row.type as UserNotificationType,
      href: row.href ?? undefined,
      actionLabel: row.action_label ?? undefined,
      simulationRole: row.simulation_role as UserNotification["simulationRole"],
      createdAt: row.created_at,
      read: row.read,
      hidden: row.hidden,
    });
  }
  return [...merged.values()].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export async function patchUserNotification(profileId: string, id: string, changes: Partial<Pick<UserNotification, "read" | "hidden">>) {
  const local = updateUserNotifications(profileId, (items) => items.map((item) => item.id === id ? { ...item, ...changes } : item));
  if (isSupabaseConfigured() && /^[0-9a-f-]{36}$/i.test(id)) {
    await createClient().from("user_notifications").update(changes).eq("id", id).eq("recipient_id", profileId);
  }
  return local;
}

export async function markAllUserNotificationsRead(profileId: string) {
  const local = updateUserNotifications(profileId, (items) => items.map((item) => ({ ...item, read: true })));
  if (isSupabaseConfigured() && /^[0-9a-f-]{36}$/i.test(profileId)) {
    await createClient().from("user_notifications").update({ read: true }).eq("recipient_id", profileId).eq("read", false);
  }
  return local;
}

export function updateUserNotifications(profileId: string, update: (notifications: UserNotification[]) => UserNotification[]) {
  if (typeof window === "undefined" || !profileId) return [];
  const items = update(getUserNotifications(profileId));
  save(profileId, items);
  return items;
}
