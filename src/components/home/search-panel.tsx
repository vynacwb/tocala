"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Check, ChevronDown, Search, X } from "lucide-react";
import { useToast } from "@/components/providers/app-providers";
import { MUSIC_GENRES } from "@/lib/genres";
import { formatDateLabel, parseDateKey } from "@/lib/availability";
import { MonthCalendar } from "@/components/calendar/month-calendar";

const filters = ["Gênero", "Instrumento", "Disponibilidade"];

export function SearchPanel({ initialQuery = "", initialGenres = [], initialAvailabilityStart = "", initialAvailabilityEnd = "", variant = "landing" }: { initialQuery?: string; initialGenres?: string[]; initialAvailabilityStart?: string; initialAvailabilityEnd?: string; variant?: "landing" | "results" }) {
  const { toast } = useToast();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
  const [draftGenres, setDraftGenres] = useState<string[]>(initialGenres);
  const [genrePanelOpen, setGenrePanelOpen] = useState(false);
  const [availabilityStart, setAvailabilityStart] = useState(initialAvailabilityStart);
  const [availabilityEnd, setAvailabilityEnd] = useState(initialAvailabilityEnd);
  const [draftStart, setDraftStart] = useState(initialAvailabilityStart);
  const [draftEnd, setDraftEnd] = useState(initialAvailabilityEnd);
  const [availabilityPanelOpen, setAvailabilityPanelOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const initialDate = parseDateKey(initialAvailabilityStart);
    const date = initialDate ?? new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  function openGenrePanel() {
    setDraftGenres(selectedGenres);
    setGenrePanelOpen(true);
  }

  function openAvailabilityPanel() {
    setDraftStart(availabilityStart);
    setDraftEnd(availabilityEnd);
    const initialDate = parseDateKey(availabilityStart);
    const date = initialDate ?? new Date();
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setAvailabilityPanelOpen(true);
  }

  function chooseRangeDate(date: string) {
    if (!draftStart || draftEnd) {
      setDraftStart(date);
      setDraftEnd("");
    } else if (date < draftStart) {
      setDraftStart(date);
      setDraftEnd("");
    } else {
      setDraftEnd(date);
    }
  }

  function updateAvailabilityUrl(start: string, end: string) {
    const params = new URLSearchParams(window.location.search);
    const normalizedQuery = query.trim();
    if (normalizedQuery) params.set("busca", normalizedQuery);
    else params.delete("busca");
    if (start && end) {
      params.set("disponivel_de", start);
      params.set("disponivel_ate", end);
    } else {
      params.delete("disponivel_de");
      params.delete("disponivel_ate");
    }
    const search = params.toString();
    router.push(`${search ? `/?${search}` : "/"}#destaques`);
  }

  function applyAvailability() {
    if (!draftStart || !draftEnd) {
      toast("Escolha uma data inicial e uma data final.", "error");
      return;
    }
    setAvailabilityStart(draftStart);
    setAvailabilityEnd(draftEnd);
    updateAvailabilityUrl(draftStart, draftEnd);
    setAvailabilityPanelOpen(false);
  }

  function clearAvailability() {
    setDraftStart("");
    setDraftEnd("");
    setAvailabilityStart("");
    setAvailabilityEnd("");
    updateAvailabilityUrl("", "");
    setAvailabilityPanelOpen(false);
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

  function removeGenre(genre: string) {
    const next = selectedGenres.filter((item) => item !== genre);
    setSelectedGenres(next);
    setDraftGenres(next);
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) params.set("busca", query.trim());
    else params.delete("busca");
    if (next.length) params.set("generos", next.join(","));
    else params.delete("generos");
    const search = params.toString();
    router.push(`${search ? `/?${search}` : "/"}#destaques`);
  }

  return (
    <div id="busca" className={`scroll-mt-28 ${variant === "results" ? "" : "mt-9 lg:mt-10"}`}>
      {variant === "landing" && <h2 className="mb-3 text-lg font-semibold tracking-[-0.025em] lg:mb-4 lg:text-xl">Comece sua busca</h2>}
      <form
        action="/#destaques"
        method="get"
        className={`flex h-14 items-center gap-3 rounded-xl border border-white/10 px-3 shadow-2xl focus-within:ring-2 focus-within:ring-[#BA3BE7] lg:h-16 lg:gap-4 lg:px-4 ${variant === "results" ? "bg-[#222226]" : "bg-[#F7F5FA] shadow-black/40"}`}
      >
        <Search className={`size-5 shrink-0 lg:size-6 ${variant === "results" ? "text-[#D6A0FF]" : "text-[#6C1EE7]"}`} strokeWidth={2} aria-hidden="true" />
        <label htmlFor="busca-talentos" className="sr-only">O que ou quem você quer procurar?</label>
        <input id="busca-talentos" name="busca" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="O que/quem você quer procurar?" className={`min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#77717E] lg:text-base ${variant === "results" ? "text-white placeholder:text-white/40" : "text-[#202020]"}`} />
        <input type="hidden" name="generos" value={selectedGenres.join(",")} />
        <input type="hidden" name="disponivel_de" value={availabilityStart} />
        <input type="hidden" name="disponivel_ate" value={availabilityEnd} />
        <button type="submit" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#6C1EE7] text-white transition hover:bg-[#BA3BE7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6C1EE7] lg:h-11 lg:w-auto lg:px-6 lg:text-sm lg:font-semibold" aria-label="Buscar">
          <span className="hidden lg:inline">Buscar</span>
          <ArrowRight className="size-[18px] lg:hidden" aria-hidden="true" />
        </button>
      </form>

      {variant === "results" && (selectedGenres.length > 0 || (availabilityStart && availabilityEnd)) && <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtros ativos">
        {selectedGenres.map((genre) => <span key={genre} className="inline-flex items-center gap-1.5 rounded-full border border-[#BA3BE7]/35 bg-[#6C1EE7]/20 px-3 py-1.5 text-xs font-medium text-[#E4C9FF]">Gênero: {genre}<button type="button" onClick={() => removeGenre(genre)} className="rounded-full text-[#E4C9FF]/65 transition hover:text-white" aria-label={`Remover filtro ${genre}`}><X className="size-3.5" /></button></span>)}
        {availabilityStart && availabilityEnd && <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BA3BE7]/35 bg-[#6C1EE7]/20 px-3 py-1.5 text-xs font-medium text-[#E4C9FF]">Disponibilidade: {formatDateLabel(availabilityStart)} – {formatDateLabel(availabilityEnd)}<button type="button" onClick={clearAvailability} className="rounded-full text-[#E4C9FF]/65 transition hover:text-white" aria-label="Remover filtro de disponibilidade"><X className="size-3.5" /></button></span>}
      </div>}

      <div className="hide-scrollbar -mx-5 mt-4 flex gap-2.5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:mt-5 lg:flex-wrap lg:gap-3 lg:px-0" aria-label="Filtros de busca">
        {filters.map((filter) => (
          <button key={filter} type="button" onClick={filter === "Gênero" ? openGenrePanel : filter === "Disponibilidade" ? openAvailabilityPanel : () => toast(`Filtro “${filter}” estará disponível em breve.`)} aria-expanded={filter === "Gênero" ? genrePanelOpen : filter === "Disponibilidade" ? availabilityPanelOpen : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[13px] font-medium transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/40 lg:px-4 lg:py-3 ${(filter === "Gênero" && selectedGenres.length > 0) || (filter === "Disponibilidade" && availabilityStart && availabilityEnd) ? "border-[#BA3BE7] bg-[#6C1EE7]/40 text-white" : "border-[#BA3BE7]/40 bg-[#6C1EE7]/25 text-[#E4C9FF]"}`}>
            {filter === "Gênero" && selectedGenres.length > 0 ? `Gênero (${selectedGenres.length})` : filter === "Disponibilidade" && availabilityStart && availabilityEnd ? "Disponibilidade (período)" : filter}<ChevronDown className="size-3.5" strokeWidth={1.8} />
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

      {availabilityPanelOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm lg:items-center lg:p-6" role="presentation" onClick={() => setAvailabilityPanelOpen(false)}>
        <section role="dialog" aria-modal="true" aria-labelledby="availability-filter-title" onClick={(event) => event.stopPropagation()} className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-y-auto rounded-t-3xl border border-white/10 bg-[#202020] p-4 shadow-2xl shadow-black/60 sm:p-6 lg:rounded-3xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 id="availability-filter-title" className="text-lg font-semibold">Quando você precisa de um artista?</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/50">Selecione a primeira e a última data do período desejado.</p>
            </div>
            <button type="button" onClick={() => setAvailabilityPanelOpen(false)} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/5 hover:text-white" aria-label="Fechar filtro de disponibilidade"><X className="size-5" /></button>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-white/10 bg-[#101010]/50 p-3"><span className="block text-white/40">De</span><span className="mt-1 block font-medium text-white/85">{draftStart ? formatDateLabel(draftStart) : "Escolha a data"}</span></div>
            <div className="rounded-xl border border-white/10 bg-[#101010]/50 p-3"><span className="block text-white/40">Até</span><span className="mt-1 block font-medium text-white/85">{draftEnd ? formatDateLabel(draftEnd) : "Escolha a data"}</span></div>
          </div>
          <MonthCalendar month={calendarMonth} onMonthChange={setCalendarMonth} onSelectDate={chooseRangeDate} rangeStart={draftStart} rangeEnd={draftEnd} />
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
            <button type="button" onClick={clearAvailability} className="rounded-lg px-3 py-2.5 text-sm text-white/55 transition hover:bg-white/5 hover:text-white">Limpar período</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAvailabilityPanelOpen(false)} className="rounded-lg border border-white/15 px-3.5 py-2.5 text-sm text-white/75 transition hover:bg-white/5">Cancelar</button>
              <button type="button" onClick={applyAvailability} className="inline-flex items-center gap-2 rounded-lg bg-[#6C1EE7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7]"><CalendarDays className="size-4" />Aplicar período</button>
            </div>
          </div>
        </section>
      </div>}
    </div>
  );
}
