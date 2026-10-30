import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isPublicProfile = request.nextUrl.pathname === "/perfil" && request.nextUrl.searchParams.has("artista");
  const isProtectedRoute = (request.nextUrl.pathname.startsWith("/perfil") && !isPublicProfile) || request.nextUrl.pathname === "/notificacoes";
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    const requestedDestination = request.nextUrl.searchParams.get("redirectTo");
    url.pathname = requestedDestination?.startsWith("/") && !requestedDestination.startsWith("//") ? requestedDestination : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
