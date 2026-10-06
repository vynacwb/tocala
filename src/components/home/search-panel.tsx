"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import { useToast } from "@/components/providers/app-providers";

const filters = ["Gênero", "Instrumento", "Disponibilidade"];

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  return (
    <div id="busca" className="mt-9 scroll-mt-28 lg:mt-10">
      <h2 className="mb-3 text-lg font-semibold tracking-[-0.025em] lg:mb-4 lg:text-xl">Comece sua busca</h2>
      <form
        className="flex h-14 items-center gap-3 rounded-xl border border-white/10 bg-[#F7F5FA] px-3 shadow-2xl shadow-black/40 focus-within:ring-2 focus-within:ring-[#BA3BE7] lg:h-16 lg:gap-4 lg:px-4"
        onSubmit={(event) => {
          event.preventDefault();
          toast(query.trim() ? `Buscando por “${query.trim()}”` : "Digite um talento, gênero ou instrumento.", query.trim() ? "success" : "error");
        }}
      >
        <Search className="size-5 shrink-0 text-[#6C1EE7] lg:size-6" strokeWidth={2} aria-hidden="true" />
        <label htmlFor="busca-talentos" className="sr-only">O que ou quem você quer procurar?</label>
        <input id="busca-talentos" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="O que/quem você quer procurar?" className="min-w-0 flex-1 bg-transparent text-[13px] text-[#202020] outline-none placeholder:text-[#77717E] lg:text-base" />
        <button type="submit" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#6C1EE7] text-white transition hover:bg-[#BA3BE7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6C1EE7] lg:h-11 lg:w-auto lg:px-6 lg:text-sm lg:font-semibold" aria-label="Buscar">
          <span className="hidden lg:inline">Buscar</span>
          <ArrowRight className="size-[18px] lg:hidden" aria-hidden="true" />
        </button>
      </form>

      <div className="hide-scrollbar -mx-5 mt-4 flex gap-2.5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:mt-5 lg:flex-wrap lg:gap-3 lg:px-0" aria-label="Filtros de busca">
        {filters.map((filter) => (
          <button key={filter} type="button" onClick={() => toast(`Filtro “${filter}” selecionado.`)} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#BA3BE7]/40 bg-[#6C1EE7]/25 px-3.5 py-2.5 text-[13px] font-medium text-[#E4C9FF] transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/40 lg:px-4 lg:py-3">
            {filter}<ChevronDown className="size-3.5" strokeWidth={1.8} />
          </button>
        ))}
      </div>
    </div>
  );
}
