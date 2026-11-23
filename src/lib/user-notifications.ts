export type UserNotification = {
  id: string;
  title: string;
  detail: string;
  type?: UserNotificationType;
  href?: string;
  actionLabel?: string;
  createdAt: string;
  read: boolean;
  hidden: boolean;
};

export type UserNotificationType = "general" | "contract-proposal" | "contract-accepted";

export const USER_NOTIFICATIONS_CHANGE_EVENT = "tocala:user-notifications-change";
export const USER_NOTIFICATION_SOUNDS: Record<UserNotificationType, string> = {
  general: "/sounds/universfield-new-notification-010-352755.mp3",
  "contract-proposal": "/sounds/universfield-positive-notification-351299.mp3",
  "contract-accepted": "/sounds/universfield-positive-notification-351299.mp3",
};

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

export function addUserNotification(profileId: string, notification: Pick<UserNotification, "title" | "detail" | "href" | "actionLabel"> & { type?: UserNotificationType }) {
  if (typeof window === "undefined" || !profileId) return;
  const items = getUserNotifications(profileId);
  const type = notification.type ?? "general";
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? `notification-${crypto.randomUUID()}` : `notification-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  items.unshift({ id, ...notification, type, createdAt: new Date().toISOString(), read: false, hidden: false });
  save(profileId, items);
  playUserNotificationSound(type);
}

export function updateUserNotifications(profileId: string, update: (notifications: UserNotification[]) => UserNotification[]) {
  if (typeof window === "undefined" || !profileId) return [];
  const items = update(getUserNotifications(profileId));
  save(profileId, items);
  return items;
}
