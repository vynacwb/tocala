"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Search, X } from "lucide-react";
import { useToast } from "@/components/providers/app-providers";
import { MUSIC_GENRES } from "@/lib/genres";

const filters = ["Gênero", "Instrumento", "Disponibilidade"];

export function SearchPanel({ initialQuery = "", initialGenres = [] }: { initialQuery?: string; initialGenres?: string[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
  const [draftGenres, setDraftGenres] = useState<string[]>(initialGenres);
  const [genrePanelOpen, setGenrePanelOpen] = useState(false);

  function openGenrePanel() {
    setDraftGenres(selectedGenres);
    setGenrePanelOpen(true);
  }

  function applyGenres() {
    setSelectedGenres(draftGenres);
    const params = new URLSearchParams(window.location.search);
    const normalizedQuery = query.trim();
    if (normalizedQuery) params.set("busca", normalizedQuery);
    else params.delete("busca");
    if (draftGenres.length > 0) params.set("generos", draftGenres.join(","));
    else params.delete("generos");
    const search = params.toString();
    router.push(`${search ? `/?${search}` : "/"}#destaques`);
    setGenrePanelOpen(false);
  }

  return (
    <div id="busca" className="mt-9 scroll-mt-28 lg:mt-10">
      <h2 className="mb-3 text-lg font-semibold tracking-[-0.025em] lg:mb-4 lg:text-xl">Comece sua busca</h2>
      <form
        action="/#destaques"
        method="get"
        className="flex h-14 items-center gap-3 rounded-xl border border-white/10 bg-[#F7F5FA] px-3 shadow-2xl shadow-black/40 focus-within:ring-2 focus-within:ring-[#BA3BE7] lg:h-16 lg:gap-4 lg:px-4"
      >
        <Search className="size-5 shrink-0 text-[#6C1EE7] lg:size-6" strokeWidth={2} aria-hidden="true" />
        <label htmlFor="busca-talentos" className="sr-only">O que ou quem você quer procurar?</label>
        <input id="busca-talentos" name="busca" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="O que/quem você quer procurar?" className="min-w-0 flex-1 bg-transparent text-[13px] text-[#202020] outline-none placeholder:text-[#77717E] lg:text-base" />
        <input type="hidden" name="generos" value={selectedGenres.join(",")} />
        <button type="submit" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#6C1EE7] text-white transition hover:bg-[#BA3BE7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6C1EE7] lg:h-11 lg:w-auto lg:px-6 lg:text-sm lg:font-semibold" aria-label="Buscar">
          <span className="hidden lg:inline">Buscar</span>
          <ArrowRight className="size-[18px] lg:hidden" aria-hidden="true" />
        </button>
      </form>

      <div className="hide-scrollbar -mx-5 mt-4 flex gap-2.5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:mt-5 lg:flex-wrap lg:gap-3 lg:px-0" aria-label="Filtros de busca">
        {filters.map((filter) => (
          <button key={filter} type="button" onClick={filter === "Gênero" ? openGenrePanel : () => toast(`Filtro “${filter}” estará disponível em breve.`)} aria-expanded={filter === "Gênero" ? genrePanelOpen : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[13px] font-medium transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/40 lg:px-4 lg:py-3 ${filter === "Gênero" && selectedGenres.length > 0 ? "border-[#BA3BE7] bg-[#6C1EE7]/40 text-white" : "border-[#BA3BE7]/40 bg-[#6C1EE7]/25 text-[#E4C9FF]"}`}>
            {filter === "Gênero" && selectedGenres.length > 0 ? `Gênero (${selectedGenres.length})` : filter}<ChevronDown className="size-3.5" strokeWidth={1.8} />
          </button>
        ))}
      </div>

      {genrePanelOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm lg:items-center lg:p-6" role="presentation" onClick={() => setGenrePanelOpen(false)}>
        <section role="dialog" aria-modal="true" aria-labelledby="genre-filter-title" onClick={(event) => event.stopPropagation()} className="flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl border border-white/10 bg-[#202020] shadow-2xl shadow-black/60 lg:rounded-3xl">
          <div className="flex items-start justify-between border-b border-white/10 px-5 py-5 sm:px-6">
            <div>
              <h3 id="genre-filter-title" className="text-lg font-semibold">Filtrar por gênero</h3>
              <p className="mt-1 text-xs text-white/50">Escolha um ou mais estilos musicais.</p>
            </div>
            <button type="button" onClick={() => setGenrePanelOpen(false)} className="flex size-9 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/5 hover:text-white" aria-label="Fechar filtros de gênero"><X className="size-5" /></button>
          </div>
          <div className="hide-scrollbar grid grid-cols-2 gap-2 overflow-y-auto px-5 py-4 sm:px-6">
            {MUSIC_GENRES.map((genre) => {
              const checked = draftGenres.includes(genre);
              return <label key={genre} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${checked ? "border-[#BA3BE7]/60 bg-[#6C1EE7]/20 text-white" : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20"}`}>
                <input type="checkbox" checked={checked} onChange={() => setDraftGenres((current) => checked ? current.filter((item) => item !== genre) : [...current, genre])} className="sr-only" />
                <span className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-[#BA3BE7] bg-[#6C1EE7] text-white" : "border-white/25 text-transparent"}`}><Check className="size-3.5" strokeWidth={2.5} /></span>
                {genre}
              </label>;
            })}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] sm:px-6 lg:pb-4">
            <button type="button" onClick={() => setDraftGenres([])} className="rounded-lg px-3 py-2.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white">Limpar</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setGenrePanelOpen(false)} className="rounded-lg border border-white/15 px-3.5 py-2.5 text-sm text-white/75 transition hover:bg-white/5">Cancelar</button>
              <button type="button" onClick={applyGenres} className="rounded-lg bg-[#6C1EE7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7]">Aplicar{draftGenres.length > 0 ? ` (${draftGenres.length})` : ""}</button>
            </div>
          </div>
        </section>
      </div>}
    </div>
  );
}
