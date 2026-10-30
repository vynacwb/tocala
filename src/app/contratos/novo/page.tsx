import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContractDemoFlow } from "@/components/contracts/contract-demo-flow";
import { featuredArtists } from "@/lib/artists";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: "Criar contrato fictício" };
export const dynamic = "force-dynamic";

export default async function NewContractPage({ searchParams }: { searchParams: Promise<{ artista?: string }> }) {
  const { artista: artistId } = await searchParams;
  if (!artistId) notFound();

  let artist: { id: string; name: string; genre: string; imageUrl: string };
  if (isSupabaseConfigured()) {
    if (!/^[0-9a-f-]{36}$/i.test(artistId)) notFound();
    const supabase = await createClient();
    const { data } = await supabase.from("profiles")
      .select("id, real_name, stage_name, full_name, username, genre, avatar_url, profile_visible, status, account_type")
      .eq("id", artistId)
      .eq("account_type", "MUSICO")
      .eq("profile_visible", true)
      .eq("status", "ATIVO")
      .maybeSingle();
    if (!data) notFound();
    artist = {
      id: data.id,
      name: data.stage_name || data.real_name || data.full_name || data.username,
      genre: data.genre || "Artista",
      imageUrl: data.avatar_url || featuredArtists[0].imageUrl,
    };
  } else {
    const sample = featuredArtists.find((item) => item.id === artistId) ?? featuredArtists[0];
    artist = { id: sample.id, name: sample.name, genre: sample.genre, imageUrl: sample.imageUrl };
  }

  return <ContractDemoFlow artist={artist} />;
}
