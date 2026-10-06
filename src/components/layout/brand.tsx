import Link from "next/link";
import { Music2 } from "lucide-react";

export function Brand({ compact = false, href = "/" }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BA3BE7]" aria-label="TocaLá, início">
      <span className={`${compact ? "size-9 rounded-xl" : "size-10 rounded-xl"} flex items-center justify-center bg-[#6C1EE7] shadow-lg shadow-[#6C1EE7]/25`} aria-hidden="true">
        <Music2 className={compact ? "size-5" : "size-6"} strokeWidth={2.5} />
      </span>
      <span className={`${compact ? "text-lg" : "text-[22px]"} font-extrabold tracking-[-0.06em]`}>
        Toca<span className="text-[#BA3BE7]">Lá</span>
      </span>
    </Link>
  );
}
