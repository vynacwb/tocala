"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { combineRating, DEMO_REVIEWS_CHANGE_EVENT, getDemoReviews } from "@/lib/demo-reviews";

type Review = { id: string; author_name: string; author_avatar_url: string; body: string; rating: number };
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(DEMO_REVIEWS_CHANGE_EVENT, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(DEMO_REVIEWS_CHANGE_EVENT, callback); };
};
const snapshot = () => window.localStorage.getItem("tocala-demo-contract-reviews") || "[]";
const serverSnapshot = () => "[]";

export function ProfileRatingSummary({ artistId, rating, count }: { artistId: string; rating: number; count: number }) {
  useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const aggregate = combineRating(rating, count, getDemoReviews(artistId));
  return aggregate.count ? <div className="flex items-center gap-1 text-[#FBBF24]" role="img" aria-label={`Avaliação ${aggregate.rating.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de 5 estrelas`}>
    {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-[1em] ${i < Math.round(aggregate.rating) ? "fill-current" : "fill-transparent"}`} />)}
  </div> : <span className="text-base font-semibold text-white/55" aria-label="Sem avaliações">★ --</span>;
}

export function ProfileReviews({ artistId, baseRating, baseCount, reviews }: { artistId: string; baseRating: number; baseCount: number; reviews: Review[] }) {
  useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const demos = getDemoReviews(artistId);
  const aggregate = combineRating(baseRating, baseCount, demos);
  const merged = [
    ...demos.map((review) => ({ id: review.id, author_name: review.authorName, author_avatar_url: "", body: review.comment, rating: review.rating })),
    ...reviews,
  ].slice(0, 8);
  return <Card className="bg-[#222226] p-6 lg:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold tracking-[-0.025em] text-white">Avaliações:</h2>
      {aggregate.count > 0 ? <span className="text-sm font-medium text-[#FBBF24]">★ {aggregate.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-white/45">({aggregate.count} avaliações)</span></span> : <span className="text-sm font-medium text-white/55" aria-label="Sem avaliações">★ --</span>}
    </div>
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {merged.length === 0 && <p className="text-sm text-white/50">Ainda não há avaliações.</p>}
      {merged.map((review) => <article key={review.id} className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4 lg:p-5">
        <div className="flex items-start gap-3">
          {review.author_avatar_url ? <Image src={review.author_avatar_url} alt={`Foto de ${review.author_name}`} width={44} height={44} className="size-11 shrink-0 rounded-full object-cover" /> : <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#6C1EE7]/20 text-sm font-semibold text-[#D6A0FF]">{review.author_name.slice(0, 1)}</div>}
          <div className="min-w-0 flex-1"><p className="text-sm font-medium text-white">{review.body || "Apresentação muito boa!"}</p><p className="mt-1 text-xs text-white/45">{review.author_name}</p><div className="mt-2 flex gap-0.5 text-[#FBBF24]">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < review.rating ? "fill-current" : "fill-transparent"}`} />)}</div></div>
        </div>
      </article>)}
    </div>
  </Card>;
}
