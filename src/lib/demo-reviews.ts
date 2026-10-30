export type DemoReview = {
  id: string;
  artistId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

// All presentation-only reviews live here so this demo layer can be removed as one unit.
export const DEMO_REVIEWS: DemoReview[] = [
  { id: "demo-marina-1", artistId: "marina-luz", authorName: "Ana Costa", rating: 5, comment: "Tal artista é show! Uma apresentação cheia de energia.", createdAt: "2026-10-14T12:00:00.000Z" },
  { id: "demo-marina-2", artistId: "marina-luz", authorName: "Pedro Martins", rating: 5, comment: "Show incrível, recomendo demais!", createdAt: "2026-10-10T12:00:00.000Z" },
];

export const DEMO_REVIEWS_STORAGE_KEY = "tocala-demo-contract-reviews";
export const DEMO_REVIEWS_CHANGE_EVENT = "tocala:demo-reviews-change";

export function readStoredDemoReviews(): DemoReview[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(DEMO_REVIEWS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is DemoReview => Boolean(item && typeof item === "object" && typeof item.artistId === "string" && Number.isFinite(item.rating))) : [];
  } catch { return []; }
}

export function addDemoReview(review: Omit<DemoReview, "id" | "createdAt">) {
  const all = readStoredDemoReviews();
  all.unshift({ ...review, id: `demo-${Date.now()}`, createdAt: new Date().toISOString() });
  window.localStorage.setItem(DEMO_REVIEWS_STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event(DEMO_REVIEWS_CHANGE_EVENT));
}

export function getDemoReviews(artistId: string, stored = readStoredDemoReviews()) {
  return [...DEMO_REVIEWS.filter((review) => review.artistId === artistId), ...stored.filter((review) => review.artistId === artistId)];
}

export function combineRating(baseRating: number, baseCount: number, reviews: DemoReview[]) {
  const count = Math.max(0, baseCount) + reviews.length;
  const total = Math.max(0, baseRating) * Math.max(0, baseCount) + reviews.reduce((sum, review) => sum + review.rating, 0);
  return { count, rating: count ? total / count : 0 };
}
