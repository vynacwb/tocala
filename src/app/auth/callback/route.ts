import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/config";

function safeInternalPath(value: string | null, fallback = "/perfil/configuracoes") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function metadataText(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function loginErrorUrl(origin: string, code: string, next: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("erro", code);
  url.searchParams.set("redirectTo", next);
  return url;
}

function profileLooksConfigured(profile: { username: string | null; genre: string; genres: string[]; career: string } | null, generatedUsername: string) {
  if (!profile || !profile.username || profile.username === generatedUsername) return false;
  const hasGenre = profile.genre.trim().length > 0 || (Array.isArray(profile.genres) && profile.genres.length > 0);
  return hasGenre && profile.career.trim().length > 0;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"));
  const providerError = searchParams.get("error");

  if (providerError) {
    const errorCode = providerError === "access_denied" ? "oauth_cancelado" : "callback";
    return NextResponse.redirect(loginErrorUrl(origin, errorCode, next));
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(loginErrorUrl(origin, "configuracao", next));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.redirect(loginErrorUrl(origin, "callback", next));

      const emailPrefix = (user.email?.split("@")[0] || "artista").toLowerCase().replace(/[^a-z0-9_]+/g, "").slice(0, 20) || "artista";
      const generatedUsername = `${emailPrefix}-${user.id.slice(0, 6)}`;
      const { data: existingProfile } = await supabase.from("profiles").select("id, username, genre, genres, career").eq("id", user.id).maybeSingle();
      if (!existingProfile) {
        const metadata = user.user_metadata as Record<string, unknown>;
        const fullName = metadataText(metadata, ["full_name", "name", "display_name", "preferred_username"]);
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id,
          full_name: fullName,
          real_name: fullName,
          username: generatedUsername,
          account_type: "MUSICO",
        });
        if (profileError && profileError.code !== "23505") {
          return NextResponse.redirect(loginErrorUrl(origin, "perfil", next));
        }
      }

      const setupMarkedComplete = user.user_metadata?.profile_setup_completed === true;
      const existingProfileIsConfigured = profileLooksConfigured(existingProfile, generatedUsername);
      if (!setupMarkedComplete && existingProfileIsConfigured) {
        await supabase.auth.updateUser({ data: { profile_setup_completed: true } });
      }

      const destination = setupMarkedComplete || existingProfileIsConfigured ? next : "/perfil/configuracoes";
      return NextResponse.redirect(new URL(destination, origin));
    }
  }

  return NextResponse.redirect(loginErrorUrl(origin, "callback", next));
}
