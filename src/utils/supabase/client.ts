import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import { browserUsesSessionOnlyCookies, getBrowserCookies, serializeBrowserCookie, sessionAwareCookieOptions } from "./session-persistence";

export function createClient() {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient(url, key, {
    cookies: {
      getAll: getBrowserCookies,
      setAll(cookiesToSet) {
        const sessionOnly = browserUsesSessionOnlyCookies();
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = serializeBrowserCookie(name, value, sessionAwareCookieOptions(options, sessionOnly));
        });
      },
    },
  });
}
