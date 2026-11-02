"use client";

import { CircleDollarSign, Trophy } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/providers/app-providers";

export function DesktopComingSoon({ showFinance }: { showFinance: boolean }) {
  const { toast } = useToast();

  return <>
    <Link href="/ranking" className="inline-flex items-center gap-2 whitespace-nowrap transition hover:text-[#D6A0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BA3BE7]" aria-label="Ranking">
      <Trophy className="size-4" strokeWidth={1.8} />Ranking
    </Link>
    {showFinance && <button type="button" onClick={() => toast("A área Financeiro estará disponível em breve.")} className="inline-flex items-center gap-2 whitespace-nowrap transition hover:text-[#D6A0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BA3BE7]" aria-label="Financeiro, em breve">
      <CircleDollarSign className="size-4" strokeWidth={1.8} />Financeiro
    </button>}
  </>;
}
