import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContractDemoFlow } from "@/components/contracts/contract-demo-flow";
import { featuredArtists } from "@/lib/artists";
import { DEMO_REVIEWS } from "@/lib/demo-reviews";
import { rankArtists } from "@/lib/artist-ranking";
import { getArtistRankingPosition } from "@/lib/artist-ranking.server";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: "Criar contrato fictício" };
export const dynamic = "force-dynamic";

export default async function NewContractPage({ searchParams }: { searchParams: Promise<{ artista?: string; simulacao?: string; papel?: string }> }) {
  const { artista: artistId, simulacao, papel } = await searchParams;
  if (!artistId) notFound();

  let artist: { id: string; name: string; genre: string; imageUrl: string; rankingPosition?: number; estimatedPrice?: number | null; acceptsDifferentProposals?: boolean };
  let isOwnProfile = false;
  let viewerId: string | undefined;
  if (isSupabaseConfigured()) {
    if (!/^[0-9a-f-]{36}$/i.test(artistId)) notFound();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    viewerId = user?.id;
    isOwnProfile = user?.id === artistId;
    let profileQuery = supabase.from("profiles")
      .select("id, real_name, stage_name, full_name, username, genre, avatar_url, profile_visible, status, account_type")
      .eq("id", artistId);
    if (!isOwnProfile) profileQuery = profileQuery.eq("account_type", "MUSICO").eq("profile_visible", true).eq("status", "ATIVO");
    const { data: profile } = await profileQuery.maybeSingle();
    if (!profile && !isOwnProfile) notFound();

    // Preço é opcional e pode ainda não existir em bancos que não receberam
    // artist_pricing_migration.sql. A ausência dessas colunas não deve ocultar
    // o perfil nem impedir a simulação do próprio contrato.
    const { data: pricing } = profile
      ? await supabase.from("profiles").select("estimated_price, accepts_different_proposals").eq("id", artistId).maybeSingle()
      : { data: null };
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const metadataName = [metadata.full_name, metadata.name, metadata.display_name].find((value): value is string => typeof value === "string" && value.trim().length > 0);
    const metadataAvatar = [metadata.avatar_url, metadata.picture].find((value): value is string => typeof value === "string" && value.startsWith("http"));
    artist = {
      id: profile?.id ?? artistId,
      name: profile?.stage_name || profile?.real_name || profile?.full_name || profile?.username || metadataName || user?.email?.split("@")[0] || "Seu perfil",
      genre: profile?.genre || "Artista",
      imageUrl: profile?.avatar_url || metadataAvatar || featuredArtists[0].imageUrl,
      rankingPosition: profile ? await getArtistRankingPosition(artistId) : undefined,
      estimatedPrice: pricing?.estimated_price == null ? null : Number(pricing.estimated_price),
      acceptsDifferentProposals: pricing?.accepts_different_proposals ?? false,
    };
  } else {
    const sample = featuredArtists.find((item) => item.id === artistId) ?? featuredArtists[0];
    const rankingPosition = rankArtists(featuredArtists, [], DEMO_REVIEWS.map((review) => ({ artistId: review.artistId, rating: review.rating }))).find((item) => item.id === sample.id)?.rankingPosition;
    artist = { id: sample.id, name: sample.name, genre: sample.genre, imageUrl: sample.imageUrl, rankingPosition, estimatedPrice: sample.estimatedPrice, acceptsDifferentProposals: sample.acceptsDifferentProposals };
    isOwnProfile = artistId === sample.id;
  }

  const simulationId = simulacao && /^[a-zA-Z0-9-]{1,100}$/.test(simulacao) ? simulacao : undefined;
  const requestedRole = papel === "artista" ? "artist" : "contractor";
  return <ContractDemoFlow artist={artist} isOwnProfile={isOwnProfile} simulationId={simulationId} requestedRole={requestedRole} viewerId={viewerId} />;
}
