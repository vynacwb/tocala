import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/navbar";
import { ArtistCard } from "@/components/home/artist-card";
import { SearchPanel } from "@/components/home/search-panel";
import { featuredArtists } from "@/lib/artists";
import type { Artist } from "@/lib/artists";
import { MUSIC_GENRES, normalizeGenre } from "@/lib/genres";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: "Encontre seu palco" };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ busca?: string | string[]; generos?: string | string[] }> }) {
  const { busca: rawQuery, generos: rawGenres } = await searchParams;
  const busca = Array.isArray(rawQuery) ? rawQuery[0] ?? "" : rawQuery ?? "";
  const requestedGenres = Array.isArray(rawGenres) ? rawGenres : rawGenres ? [rawGenres] : [];
  const availableGenres = new Set<string>(MUSIC_GENRES);
  const initialGenres = [...new Set(requestedGenres.flatMap((value) => value.split(",")).map((genre) => genre.trim()).filter((genre) => availableGenres.has(genre)))];
  let artists: Artist[] = featuredArtists;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, real_name, stage_name, username, genre, rating, review_count, avatar_url, avatar_position_x, avatar_position_y, city, state")
      .eq("account_type", "MUSICO")
      .eq("status", "ATIVO")
      .eq("profile_visible", true)
      .order("updated_at", { ascending: false })
      .limit(100);

    artists = (data ?? []).map((artist) => ({
      id: artist.id,
      name: artist.stage_name || artist.real_name || artist.username,
      realName: artist.real_name,
      username: artist.username,
      genre: artist.genre || "Artista",
      rating: Number(artist.rating),
      reviews: artist.review_count,
      imageUrl: artist.avatar_url || featuredArtists[0].imageUrl,
      avatarPositionX: artist.avatar_position_x,
      avatarPositionY: artist.avatar_position_y,
      city: artist.city,
      state: artist.state,
    }));
  }

  const normalizedQuery = busca.trim().toLocaleLowerCase("pt-BR");
  const selectedGenres = new Set(initialGenres.map(normalizeGenre));
  const matchingArtists = artists.filter((artist) => {
    const matchesText = !normalizedQuery || [artist.name, artist.realName, artist.username, artist.genre, artist.city, artist.state].some((value) => value?.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
    const matchesGenre = selectedGenres.size === 0 || selectedGenres.has(normalizeGenre(artist.genre));
    return matchesText && matchesGenre;
  });
  const noResultsMessage = busca
    ? `Nenhum perfil encontrado para “${busca}”.`
    : initialGenres.length > 0
      ? "Nenhum perfil encontrado com os gêneros selecionados."
      : "Nenhum artista encontrado no momento.";

  return (
    <div className="mx-auto min-h-dvh max-w-[400px] bg-[#1A1A1A] shadow-2xl shadow-black/40 lg:max-w-none lg:bg-[#101010] lg:shadow-none">
      <Navbar />
      <main className="mx-auto max-w-[400px] px-5 pt-[calc(env(safe-area-inset-top)+147px)] lg:max-w-[1200px] lg:px-6 lg:pt-32">
        <section id="explorar" className="flex scroll-mt-28 flex-col lg:grid lg:grid-cols-[3fr_2fr] lg:items-center lg:gap-14 lg:pb-16">
          <div className="order-2 lg:order-1">
            <div className="hidden lg:block">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#E4C9FF] backdrop-blur-sm">
                <span className="size-2 rounded-full bg-[#BA3BE7] shadow-[0_0_12px_#BA3BE7]" />
                Música ao vivo
              </span>
              <h1 className="mt-7 max-w-[720px] text-[clamp(3.3rem,5.1vw,4.75rem)] font-bold leading-[1.08] tracking-[-0.055em]">
                Encontre seu <span className="text-[#D6A0FF]">lugar.</span><br />O palco é <span className="text-[#D6A0FF]">seu.</span>
              </h1>
              <p className="mt-6 max-w-[565px] text-lg leading-relaxed text-white/60">Conecte-se com músicos, bandas e contratantes para o evento perfeito.</p>
            </div>
            <SearchPanel key={`${busca}|${initialGenres.join(",")}`} initialQuery={busca} initialGenres={initialGenres} />
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="absolute -inset-4 hidden rounded-[2.5rem] bg-[#6C1EE7]/15 blur-3xl lg:block" aria-hidden="true" />
            <div className="relative isolate h-[238px] overflow-hidden rounded-2xl bg-[#271535] shadow-2xl shadow-black/40 lg:h-[510px] lg:rounded-3xl">
              <Image src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=85" alt="Músicos tocando em um show sob luzes de palco" fill priority sizes="(min-width: 1024px) 460px, 360px" className="-z-20 object-cover object-center" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0D0915]/95 via-[#160D26]/75 to-[#130B1B]/20 lg:bg-gradient-to-t lg:from-[#220C39]/70 lg:via-[#150B25]/20 lg:to-[#6C1EE7]/15" />
              <div className="flex h-full flex-col justify-between p-6 lg:hidden">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm"><span className="size-1.5 rounded-full bg-[#BA3BE7]" />Música ao vivo</span>
                  <h1 className="mt-5 max-w-[230px] text-[28px] font-bold leading-[1.1] tracking-[-0.045em]">Encontre seu <span className="text-[#D6A0FF]">lugar.</span><br />O palco é <span className="text-[#D6A0FF]">seu.</span></h1>
                </div>
                <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#6C1EE7] to-[#BA3BE7]" />
              </div>
              <div className="absolute bottom-6 left-6 hidden items-center gap-2 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-xs font-medium text-white/90 backdrop-blur-md lg:flex">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#6C1EE7] text-white"><Sparkles className="size-4" /></span>
                A música conecta pessoas
              </div>
            </div>
          </div>
        </section>

        <section id="destaques" className="mt-16 scroll-mt-28 lg:mt-16" aria-labelledby="destaques-title">
          <div className="mb-6 flex items-end justify-between gap-4 lg:mb-8">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#BA3BE7] lg:text-xs">Descubra seu próximo som</p>
              <h2 id="destaques-title" className="text-[23px] font-bold tracking-[-0.035em] lg:text-3xl">Talentos em Destaque</h2>
            </div>
            <Link href="#busca" className="shrink-0 text-xs font-semibold text-[#D6A0FF] transition hover:text-white lg:text-sm">Ver todos →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
            {matchingArtists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}
          </div>
          {matchingArtists.length === 0 && <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/55">{noResultsMessage}</p>}
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
