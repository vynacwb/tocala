import type { CookieOptions } from "@supabase/ssr";

export const SESSION_PERSISTENCE_COOKIE = "tocala-session-persistence";
const SESSION_ONLY_VALUE = "session";

export function isSessionOnlyCookie(value: string | undefined) {
  return value === SESSION_ONLY_VALUE;
}

export function sessionAwareCookieOptions(options: CookieOptions, sessionOnly: boolean): CookieOptions {
  if (!sessionOnly || options.maxAge === 0) return options;
  const sessionOptions = { ...options };
  delete sessionOptions.maxAge;
  delete sessionOptions.expires;
  return sessionOptions;
}

function decodeCookiePart(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getBrowserCookies() {
  if (typeof document === "undefined" || !document.cookie) return [];
  return document.cookie.split(/;\s*/).flatMap((entry) => {
    const separator = entry.indexOf("=");
    if (separator < 0) return [];
    return [{
      name: decodeCookiePart(entry.slice(0, separator)),
      value: decodeCookiePart(entry.slice(separator + 1)),
    }];
  });
}

export function browserUsesSessionOnlyCookies() {
  return isSessionOnlyCookie(getBrowserCookies().find(({ name }) => name === SESSION_PERSISTENCE_COOKIE)?.value);
}

export function serializeBrowserCookie(name: string, value: string, options: CookieOptions) {
  let serialized = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (options.maxAge !== undefined) serialized += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options.domain) serialized += `; Domain=${options.domain}`;
  if (options.path) serialized += `; Path=${options.path}`;
  if (options.expires) serialized += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly) serialized += "; HttpOnly";
  if (options.secure) serialized += "; Secure";
  if (options.partitioned) serialized += "; Partitioned";
  if (options.priority) serialized += `; Priority=${options.priority[0].toUpperCase()}${options.priority.slice(1)}`;
  if (options.sameSite) {
    const sameSite = options.sameSite === true ? "Strict" : `${options.sameSite[0].toUpperCase()}${options.sameSite.slice(1)}`;
    serialized += `; SameSite=${sameSite}`;
  }
  return serialized;
}

export function setBrowserSessionPersistence(remember: boolean) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:";
  document.cookie = remember
    ? serializeBrowserCookie(SESSION_PERSISTENCE_COOKIE, "", { path: "/", sameSite: "lax", secure, maxAge: 0 })
    : serializeBrowserCookie(SESSION_PERSISTENCE_COOKIE, SESSION_ONLY_VALUE, { path: "/", sameSite: "lax", secure });
}
