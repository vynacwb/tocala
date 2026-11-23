import "server-only";
import { rankArtists } from "@/lib/artist-ranking";
import { createClient } from "@/utils/supabase/server";

export async function getArtistRankingPosition(artistId: string) {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles")
    .select("id, real_name, stage_name, username, rating, review_count")
    .eq("account_type", "MUSICO")
    .eq("status", "ATIVO")
    .eq("profile_visible", true)
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (!profiles?.some((profile) => profile.id === artistId)) return undefined;

  const artistIds = profiles.map((profile) => profile.id);
  const [{ data: ratings }, { data: demoRatings }] = await Promise.all([
    supabase.from("reviews").select("artist_id, rating").in("artist_id", artistIds),
    supabase.from("demo_reviews").select("artist_id, rating").in("artist_id", artistIds),
  ]);
  return rankArtists(
    profiles.map((profile) => ({ id: profile.id, name: profile.stage_name || profile.real_name || profile.username, rating: Number(profile.rating) || 0, reviews: Number(profile.review_count) || 0 })),
    (ratings ?? []).map((row) => ({ artistId: row.artist_id, rating: Number(row.rating) })),
    (demoRatings ?? []).map((row) => ({ artistId: row.artist_id, rating: Number(row.rating) })),
  ).find((artist) => artist.id === artistId)?.rankingPosition;
}
