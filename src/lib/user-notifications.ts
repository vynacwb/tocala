export type UserNotification = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  read: boolean;
  hidden: boolean;
};

export const USER_NOTIFICATIONS_CHANGE_EVENT = "tocala:user-notifications-change";

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

export function addUserNotification(profileId: string, notification: Pick<UserNotification, "title" | "detail">) {
  if (typeof window === "undefined" || !profileId) return;
  const items = getUserNotifications(profileId);
  items.unshift({ id: `notification-${Date.now()}`, ...notification, createdAt: new Date().toISOString(), read: false, hidden: false });
  save(profileId, items);
}

export function updateUserNotifications(profileId: string, update: (notifications: UserNotification[]) => UserNotification[]) {
  if (typeof window === "undefined" || !profileId) return [];
  const items = update(getUserNotifications(profileId));
  save(profileId, items);
  return items;
}
