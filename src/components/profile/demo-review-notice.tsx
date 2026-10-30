"use client";

import { useSyncExternalStore } from "react";
import { Star } from "lucide-react";

type DemoReview = { artistId: string; rating: number; comment: string };
const storageKey = "tocala-demo-contract-review";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return window.sessionStorage.getItem(storageKey);
}

function getServerSnapshot() {
  return null;
}

export function DemoReviewNotice({ artistId }: { artistId: string }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!stored) return null;

  let review: DemoReview;
  try {
    review = JSON.parse(stored) as DemoReview;
  } catch {
    return null;
  }
  if (review.artistId !== artistId) return null;

  return <aside aria-live="polite" className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-sm text-amber-50/80">
    <p className="flex items-center gap-2 font-semibold"><span className="flex gap-0.5 text-amber-300">{Array.from({ length: review.rating }, (_, index) => <Star key={index} className="size-4 fill-current" />)}</span>Avaliação simulada registrada</p>
    {review.comment && <p className="mt-2 leading-relaxed">“{review.comment}”</p>}
    <p className="mt-2 text-xs text-amber-50/50">Esta avaliação de demonstração não alterou a pontuação pública do artista.</p>
  </aside>;
}
