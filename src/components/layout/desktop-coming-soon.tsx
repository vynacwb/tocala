"use client";

import { CircleDollarSign, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DesktopComingSoon({ showFinance }: { showFinance: boolean }) {
  const pathname = usePathname();
  const activeClass = "rounded-lg bg-[#6C1EE7]/20 px-3 py-2 text-[#D6A0FF]";
  const idleClass = "transition hover:text-[#D6A0FF]";

  return <>
    <Link href="/ranking" aria-current={pathname === "/ranking" ? "page" : undefined} className={`inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BA3BE7] ${pathname === "/ranking" ? activeClass : idleClass}`} aria-label="Ranking">
      <Trophy className="size-4" strokeWidth={1.8} />Ranking
    </Link>
    {showFinance && <Link href="/financeiro" aria-current={pathname === "/financeiro" ? "page" : undefined} className={`inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BA3BE7] ${pathname === "/financeiro" ? activeClass : idleClass}`} aria-label="Financeiro">
      <CircleDollarSign className="size-4" strokeWidth={1.8} />Financeiro
    </Link>}
  </>;
}
