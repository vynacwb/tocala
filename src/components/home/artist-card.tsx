import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Artist } from "@/lib/artists";

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A1A] shadow-2xl shadow-black/40 transition duration-300 hover:-translate-y-1 hover:border-[#BA3BE7]/60">
      <div className="relative aspect-square overflow-hidden bg-[#2E203B]">
        <Image src={artist.imageUrl} alt={`${artist.name} em apresentação musical`} fill sizes="(min-width: 1024px) 276px, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-3.5 lg:p-5">
        <h3 className="truncate text-sm font-semibold lg:text-lg">{artist.name}</h3>
        <span className="mt-2 inline-flex rounded-full bg-[#6C1EE7]/20 px-2.5 py-1 text-[10px] font-medium text-[#E4C9FF] lg:text-xs">{artist.genre}</span>
        <p className="mt-3 flex items-center gap-1 text-xs text-white/65 lg:mt-4 lg:text-sm" aria-label={`Avaliação ${artist.rating.toLocaleString("pt-BR")} de 5`}>
          <Star className="size-4 fill-[#FBBF24] text-[#FBBF24]" aria-hidden="true" />
          <span className="font-semibold text-white">{artist.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</span>
          <span className="hidden sm:inline">({artist.reviews} avaliações)</span>
        </p>
        <Link href={`/perfil?artista=${artist.id}`} className="mt-4 block w-full rounded-lg border border-white/20 px-2 py-2.5 text-center text-xs font-semibold transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7] lg:mt-5 lg:text-sm">
          Ver Perfil
        </Link>
      </div>
    </article>
  );
}
