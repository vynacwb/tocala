import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Brand } from "@/components/layout/brand";
import { AvailabilityManager } from "@/components/profile/availability-manager";
import type { AvailabilityByDate, AvailabilityStatus } from "@/lib/availability";
import { BOOKING_WEEKDAYS, dateKey } from "@/lib/availability";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: "Disponibilidade do artista" };
export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const configured = isSupabaseConfigured();
  let bookingWeekdays: number[] = BOOKING_WEEKDAYS.map((day) => day.value);
  let statuses: AvailabilityByDate = {};

  if (configured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?redirectTo=/perfil/disponibilidade");

    const [{ data: profile }, { data: availability }] = await Promise.all([
      supabase.from("profiles").select("account_type, booking_weekdays").eq("id", user.id).maybeSingle(),
      supabase.from("artist_availability").select("availability_date, status").eq("user_id", user.id).gte("availability_date", dateKey(new Date())).order("availability_date", { ascending: true }).limit(1000),
    ]);

    if (profile?.account_type === "ORGANIZADOR") redirect("/perfil");
    if (Array.isArray(profile?.booking_weekdays)) bookingWeekdays = profile.booking_weekdays.map(Number);
    statuses = Object.fromEntries((availability ?? []).map((item) => [item.availability_date, item.status as AvailabilityStatus]));
  }

  return <div className="mx-auto min-h-dvh max-w-[400px] bg-[#101010] shadow-2xl shadow-black/40 lg:max-w-none">
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#1A1A1A]/95 backdrop-blur-xl">
      <div className="relative mx-auto flex h-[calc(env(safe-area-inset-top)+76px)] max-w-[1200px] items-center justify-between px-5 pt-[env(safe-area-inset-top)] lg:h-20 lg:px-6 lg:pt-0">
        <Link href="/perfil" className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#D6A0FF] transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/15" aria-label="Voltar ao perfil"><ArrowLeft className="size-5" /></Link>
        <div className="absolute left-1/2 -translate-x-1/2 lg:static lg:ml-5 lg:translate-x-0"><Brand compact /></div>
        <span className="flex size-10 items-center justify-center rounded-xl border border-[#BA3BE7]/30 bg-[#6C1EE7]/15 text-[#D6A0FF]" aria-hidden="true"><CalendarDays className="size-5" /></span>
      </div>
    </header>

    <main className="mx-auto max-w-[920px] px-4 pb-32 pt-[calc(env(safe-area-inset-top)+100px)] sm:px-6 lg:pb-20 lg:pt-32">
      <div className="mb-7 lg:mb-9">
        <span className="inline-flex items-center rounded-full border border-[#BA3BE7]/25 bg-[#6C1EE7]/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D6A0FF]">Agenda do artista</span>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Disponibilidade</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">Mostre quando você costuma aceitar contratações e marque datas ocupadas ou sem shows.</p>
      </div>
      <AvailabilityManager configured={configured} initialWeekdays={bookingWeekdays} initialStatuses={statuses} />
    </main>
    <MobileNav />
  </div>;
}
