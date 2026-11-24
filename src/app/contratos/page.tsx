import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ContractsDashboard } from "@/components/contracts/contracts-dashboard";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/navbar";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";
import { contractFromDatabase, type SimulatedContractRow, type StoredContractSimulation } from "@/lib/contract-simulations";

export const metadata: Metadata = { title: "Meus contratos" };
export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  let profileId = "demo";
  let sharedContracts: StoredContractSimulation[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?redirectTo=/contratos");
    profileId = user.id;
    const { data } = await supabase.from("simulated_contracts")
      .select("id, artist_id, contractor_id, artist_name, artist_genre, draft, status, change_request, contractor_checked_in, artist_checked_in, contractor_review, artist_review, accepted_at, paid_at, created_at")
      .order("created_at", { ascending: false });
    sharedContracts = (data ?? []).map((row) => contractFromDatabase(row as SimulatedContractRow));
  }

  return <div className="mx-auto min-h-dvh max-w-[400px] bg-[#0C0C0C] text-white shadow-2xl shadow-black/40 lg:max-w-none lg:shadow-none">
    <Navbar />
    <ContractsDashboard profileId={profileId} sharedContracts={sharedContracts} />
    <Footer />
    <MobileNav />
  </div>;
}
