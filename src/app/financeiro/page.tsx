import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/navbar";
import { FinancialDashboard } from "@/components/financial/financial-dashboard";

export const metadata: Metadata = { title: "Financeiro — Simulação" };

export default function FinancialPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-[400px] bg-[#0C0C0C] text-white shadow-2xl shadow-black/40 lg:max-w-none lg:shadow-none">
      <Navbar />
      <FinancialDashboard />
      <Footer />
      <MobileNav />
    </div>
  );
}
