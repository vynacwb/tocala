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

export const metadata: Metadata = { title: "Encontre seu palco" };

export default function HomePage() {
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
            <SearchPanel />
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
            {featuredArtists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
