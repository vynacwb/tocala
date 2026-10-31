import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import type { ProfileSettingsData } from "@/lib/profile-settings";
import { parseCareer } from "@/lib/profile-settings";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: "Personalização do perfil" };
export const dynamic = "force-dynamic";

const demoData: ProfileSettingsData = {
  realName: "Marina Oliveira", fullName: "Marina Luz", username: "marinaluz",
  contactEmail: "contato@marinaluz.com", contactPhone: "+55 11 99999-1234",
  city: "São Paulo", state: "SP", genre: "MPB", genres: ["MPB"],
  instruments: ["Voz", "Cavaquinho", "Pandeiro"],
  bio: "Cantora e compositora movida por encontros, histórias e pela força da música brasileira.",
  avatarUrl: "https://images.unsplash.com/photo-1643370857818-d3705b0a1ec1?auto=format&fit=crop&w=600&q=85",
  avatarPositionX: 50, avatarPositionY: 50,
  experiences: [{ id: "experience-1", title: "Festivais e casas de show", description: "Oito anos de estrada em festivais, eventos autorais e apresentações em diferentes cidades.", photos: ["https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80", "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=80"] }],
};

function emailUsername(email: string | undefined) {
  return (email?.split("@")[0] ?? "").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 30);
}

async function getSettingsData(): Promise<{ data: ProfileSettingsData; configured: boolean }> {
  if (!isSupabaseConfigured()) return { data: demoData, configured: false };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/perfil/configuracoes");
  const [{ data: profile }, { data: musician }] = await Promise.all([
    supabase.from("profiles").select("real_name, stage_name, full_name, username, contact_email, contact_phone, city, state, genre, genres, instruments, bio, career, avatar_url, avatar_position_x, avatar_position_y").eq("id", user.id).maybeSingle(),
    supabase.from("musician_profiles").select("portfolio_links").eq("user_id", user.id).maybeSingle(),
  ]);
  const fallbackUsername = emailUsername(user.email);
  const generatedSuffix = `-${user.id.slice(0, 6)}`;
  const savedUsername = profile?.username || "";
  const username = savedUsername.endsWith(generatedSuffix) ? fallbackUsername : savedUsername || fallbackUsername;
  const portfolioLinks = Array.isArray(musician?.portfolio_links) ? musician.portfolio_links : [];
  return { configured: true, data: {
    realName: profile?.real_name || user.user_metadata.full_name || "",
    fullName: profile?.stage_name || "", username,
    contactEmail: profile?.contact_email || "", contactPhone: profile?.contact_phone || "",
    city: profile?.city || "", state: profile?.state || "",
    genre: profile?.genre || "", genres: Array.isArray(profile?.genres) && profile.genres.length > 0 ? profile.genres as string[] : (profile?.genre || "").split(/[·,]/).map((item: string) => item.trim()).filter(Boolean), instruments: Array.isArray(profile?.instruments) ? profile.instruments : [], bio: profile?.bio || "", avatarUrl: profile?.avatar_url || "",
    avatarPositionX: profile?.avatar_position_x ?? 50, avatarPositionY: profile?.avatar_position_y ?? 50,
    experiences: parseCareer(profile?.career || "", portfolioLinks),
  } };
}

export default async function ProfileSettingsPage() {
  const { data, configured } = await getSettingsData();
  return <div className="min-h-dvh bg-[#101010]">
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#1A1A1A]/95 backdrop-blur-xl">
      <div className="relative mx-auto flex h-[calc(env(safe-area-inset-top)+76px)] max-w-[1200px] items-center justify-between px-5 pt-[env(safe-area-inset-top)] lg:h-20 lg:px-6 lg:pt-0">
        <Link href="/perfil" className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#D6A0FF] transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/15" aria-label="Voltar para o perfil"><ArrowLeft className="size-5" /></Link>
        <div className="absolute left-1/2 -translate-x-1/2"><Brand compact /></div>
        <div className="flex size-10 items-center justify-center rounded-xl border border-[#BA3BE7]/30 bg-[#6C1EE7]/15 text-[#D6A0FF]" aria-hidden="true"><UserRound className="size-5" /></div>
      </div>
    </header>
    <main className="mx-auto max-w-[1120px] px-4 pb-16 pt-[calc(env(safe-area-inset-top)+96px)] sm:px-6 lg:pb-24 lg:pt-32">
      <div className="mb-7 lg:mb-10">
        <span className="inline-flex items-center rounded-full border border-[#BA3BE7]/25 bg-[#6C1EE7]/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D6A0FF]">Seu palco, sua identidade</span>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.045em] sm:text-4xl lg:text-5xl">Personalização do perfil</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55 lg:text-base">Atualize como contratantes e fãs encontram você no TocaLá.</p>
      </div>
      <ProfileSettingsForm initialData={data} configured={configured} />
    </main>
  </div>;
}
