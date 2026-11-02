import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/navbar";
import { featuredArtists, type Artist } from "@/lib/artists";
import { combineRating, DEMO_REVIEWS } from "@/lib/demo-reviews";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: "Ranking de artistas" };

type RankedArtist = Artist & { average: number; reviewCount: number };

async function getRanking(): Promise<RankedArtist[]> {
  let artists = featuredArtists;
  let reviews = DEMO_REVIEWS;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, real_name, stage_name, username, genre, genres, rating, review_count, avatar_url, avatar_position_x, avatar_position_y, city, state")
      .eq("account_type", "MUSICO")
      .eq("status", "ATIVO")
      .eq("profile_visible", true)
      .order("updated_at", { ascending: false })
      .limit(100);

    artists = (data ?? []).map((profile) => ({
      id: profile.id,
      name: profile.stage_name || profile.real_name || profile.username,
      realName: profile.real_name,
      username: profile.username,
      genre: profile.genre || "Artista",
      genres: Array.isArray(profile.genres) && profile.genres.length > 0
        ? profile.genres as string[]
        : (profile.genre || "").split(/[·,]/).map((item: string) => item.trim()).filter(Boolean),
      rating: Number(profile.rating) || 0,
      reviews: Number(profile.review_count) || 0,
      imageUrl: profile.avatar_url || featuredArtists[0].imageUrl,
      avatarPositionX: profile.avatar_position_x,
      avatarPositionY: profile.avatar_position_y,
      city: profile.city,
      state: profile.state,
    }));

    if (artists.length > 0) {
      const { data: reviewRows } = await supabase
        .from("demo_reviews")
        .select("id, artist_id, author_name, body, rating, created_at")
        .in("artist_id", artists.map((artist) => artist.id))
        .order("created_at", { ascending: false });
      reviews = (reviewRows ?? []).map((review) => ({
        id: review.id,
        artistId: review.artist_id,
        authorName: review.author_name,
        rating: Number(review.rating),
        comment: review.body,
        createdAt: review.created_at,
      }));
    }
  }

  return artists
    .map((artist) => {
      const artistReviews = reviews.filter((review) => review.artistId === artist.id);
      const { rating, count } = combineRating(artist.rating, artist.reviews, artistReviews);
      return { ...artist, average: rating, reviewCount: count };
    })
    .sort((a, b) => b.average - a.average || b.reviewCount - a.reviewCount || a.name.localeCompare(b.name, "pt-BR"));
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1.5" aria-label={rating ? `Nota ${rating.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de 5` : "Sem avaliações"}>
      <span className="flex items-center gap-0.5 text-[#FCB83D]" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`size-4 sm:size-[18px] ${index < Math.round(rating) ? "fill-[#FCB83D]" : "fill-transparent"}`} strokeWidth={2.5} />)}
      </span>
      <span className="text-xs font-semibold text-white/70">{rating ? rating.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "--"}</span>
    </span>
  );
}

const placeStyles = [
  "border-[#FFD941] shadow-[0_8px_20px_rgba(108,30,230,0.25)]",
  "border-[#B2B2B2] shadow-[0_8px_20px_rgba(108,30,230,0.2)]",
  "border-[#8E5B00] shadow-[0_8px_20px_rgba(108,30,230,0.18)]",
];

export default async function RankingPage() {
  const artists = await getRanking();
  const podium = artists.slice(0, 3);
  const others = artists.slice(3);

  return (
    <div className="mx-auto min-h-dvh max-w-[400px] overflow-hidden bg-[#0C0C0C] text-white shadow-2xl shadow-black/40 lg:max-w-none lg:shadow-none">
      <Navbar />
      <main className="mx-auto max-w-[1200px] px-4 pb-28 pt-[calc(env(safe-area-inset-top)+132px)] sm:px-6 lg:px-8 lg:pb-16 lg:pt-28">
        <section className="relative isolate min-h-[660px] overflow-hidden rounded-[24px] border border-[#711EC9] bg-[#090705] sm:min-h-[710px] lg:min-h-[760px] lg:rounded-[32px]">
          <Image src="/ranking-stage.png" alt="Palco de um show com luzes roxas" fill priority sizes="(min-width: 1024px) 1200px, 400px" className="-z-20 object-cover object-center" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/50 via-black/15 to-[#090705]" />

          <div className="relative z-10 mx-auto mt-6 w-[84%] bg-[#6C1EE7] px-4 py-3 text-center text-2xl font-bold shadow-lg shadow-black/30 sm:mt-8 sm:py-4 sm:text-3xl lg:mt-8 lg:w-[70%] lg:py-5 lg:text-[40px]">
            Ranking
          </div>

          <div className="relative z-10 mx-auto mt-20 text-center sm:mt-24 lg:mt-20">
            <h1 className="text-[clamp(2.7rem,10vw,5.5rem)] font-black italic leading-none tracking-[-0.055em] text-white [text-shadow:0_0_3px_white,0_0_18px_#6C1EE7,4px_5px_0_#6C1EE7] lg:text-[clamp(5rem,8vw,7.5rem)]">
              SUPER STAR!!
            </h1>
          </div>

          <div className="relative z-10 mx-4 mt-20 rounded-t-[28px] border-x border-t border-[#711EC9] bg-[#090705]/85 px-4 pb-8 pt-6 backdrop-blur-[2px] sm:mx-10 sm:mt-24 sm:px-8 lg:mx-auto lg:mt-16 lg:w-[72%] lg:rounded-t-[34px] lg:px-12 lg:pt-8">
            {podium.length > 0 && <div className="mb-5 flex justify-center" aria-label={`Artista em primeiro lugar: ${podium[0].name}`}>
              <RatingStars rating={podium[0].average} />
            </div>}

            <div className="mx-auto max-w-[650px] space-y-4 sm:space-y-5 lg:space-y-6">
              {podium.map((artist, index) => (
                <Link key={artist.id} href={`/perfil?artista=${encodeURIComponent(artist.id)}`} className={`group flex min-h-[66px] items-center gap-3 rounded-[17px] border-2 bg-black px-3 py-2 text-white transition hover:-translate-y-0.5 hover:border-[#BA3BE7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BA3BE7] sm:min-h-[78px] sm:gap-5 sm:px-5 ${placeStyles[index]} ${index === 0 ? "border-[3px]" : ""}`}>
                  <span className={`min-w-[54px] text-left font-bold leading-none sm:min-w-[78px] ${index === 0 ? "text-[36px] sm:text-[48px]" : index === 1 ? "text-[32px] sm:text-[42px]" : "text-[26px] sm:text-[34px]"}`}>{index + 1}°</span>
                  <span className={`min-w-0 flex-1 truncate text-center font-semibold ${index === 0 ? "text-[19px] sm:text-[28px]" : index === 1 ? "text-[17px] sm:text-[24px]" : "text-[15px] sm:text-[20px]"}`}>{artist.name}</span>
                  <span className="sr-only">, nota {artist.average ? artist.average.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "sem avaliações"}, {artist.reviewCount} avaliações</span>
                </Link>
              ))}

              {podium.length === 0 && <div className="rounded-2xl border border-white/15 bg-black/60 p-6 text-center text-sm text-white/65">Ainda não há artistas visíveis no ranking.</div>}
            </div>

            {others.length > 0 && <div className="mx-auto mt-7 max-w-[650px] border-t border-white/15 pt-5">
              <h2 className="mb-3 text-sm font-semibold text-white/70">Mais artistas</h2>
              <ol className="max-h-[300px] space-y-2 overflow-y-auto pr-2 [scrollbar-color:#711EC9_#292929] [scrollbar-width:thin]">
                {others.map((artist, index) => (
                  <li key={artist.id}>
                    <Link href={`/perfil?artista=${encodeURIComponent(artist.id)}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/65 px-3 py-2.5 transition hover:border-[#711EC9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]">
                      <span className="w-8 text-sm font-bold text-white/55">{index + 4}°</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{artist.name}</span>
                      <RatingStars rating={artist.average} />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>}

            <p className="mt-6 text-center text-[11px] text-white/45">Ranking calculado pelas avaliações recebidas</p>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
