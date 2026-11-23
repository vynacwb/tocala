import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ContractsDashboard } from "@/components/contracts/contracts-dashboard";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/navbar";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: "Meus contratos" };
export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  let profileId = "demo";
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?redirectTo=/contratos");
    profileId = user.id;
  }

  return <div className="mx-auto min-h-dvh max-w-[400px] bg-[#0C0C0C] text-white shadow-2xl shadow-black/40 lg:max-w-none lg:shadow-none">
    <Navbar />
    <ContractsDashboard profileId={profileId} />
    <Footer />
    <MobileNav />
  </div>;
}
