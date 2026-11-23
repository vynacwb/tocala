import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";
import { isSessionOnlyCookie, SESSION_PERSISTENCE_COOKIE, sessionAwareCookieOptions } from "./session-persistence";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();
  const sessionOnly = isSessionOnlyCookie(cookieStore.get(SESSION_PERSISTENCE_COOKIE)?.value);

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, sessionAwareCookieOptions(options, sessionOnly)));
        } catch {
          // Server Components não podem escrever cookies. O proxy renova a sessão.
        }
      },
    },
  });
}
