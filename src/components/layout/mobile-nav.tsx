import Link from "next/link";
import { DollarSign, Menu, Plus } from "lucide-react";

export function MobileNav() {
  return (
    <nav aria-label="Navegação mobile" className="fixed bottom-0 left-1/2 z-50 w-full max-w-[400px] -translate-x-1/2 border-t-2 border-[#6C1EE7] bg-[#202020]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="grid h-[76px] grid-cols-3 items-center">
        <button type="button" aria-label="Financeiro" className="mx-auto flex size-12 items-center justify-center rounded-xl text-[#BA3BE7] transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]">
          <DollarSign className="size-7" strokeWidth={1.8} />
        </button>
        <Link href="/#busca" aria-label="Explorar" className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#6C1EE7] text-white shadow-lg shadow-[#6C1EE7]/25 transition hover:bg-[#BA3BE7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]">
          <Plus className="size-7" strokeWidth={1.8} />
        </Link>
        <button type="button" aria-label="Abrir menu" className="mx-auto flex size-12 items-center justify-center rounded-xl text-[#BA3BE7] transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]">
          <Menu className="size-7" strokeWidth={2} />
        </button>
      </div>
    </nav>
  );
}
