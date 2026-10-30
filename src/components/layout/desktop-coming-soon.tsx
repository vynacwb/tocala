"use client";

import { CircleDollarSign, Trophy } from "lucide-react";
import { useToast } from "@/components/providers/app-providers";

export function DesktopComingSoon() {
  const { toast } = useToast();

  return <>
    <button type="button" onClick={() => toast("O Ranking estará disponível em breve.")} className="inline-flex items-center gap-2 whitespace-nowrap transition hover:text-[#D6A0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BA3BE7]" aria-label="Ranking, em breve">
      <Trophy className="size-4" strokeWidth={1.8} />Ranking
    </button>
    <button type="button" onClick={() => toast("A área Financeiro estará disponível em breve.")} className="inline-flex items-center gap-2 whitespace-nowrap transition hover:text-[#D6A0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BA3BE7]" aria-label="Financeiro, em breve">
      <CircleDollarSign className="size-4" strokeWidth={1.8} />Financeiro
    </button>
  </>;
}
