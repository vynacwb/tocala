import { Star } from "lucide-react";

export function RankingPointsBadge({ points, compact = false }: { points: number; compact?: boolean }) {
  const displayedPoints = String(Math.max(0, Math.floor(points))).padStart(2, "0");

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#FBBF24] font-bold text-[#1A1A1A] shadow-lg shadow-[#FBBF24]/15 ${compact ? "h-9 px-2.5 text-sm" : "h-12 px-3.5 text-lg"}`}
      aria-label={`${Math.max(0, Math.floor(points))} pontos no ranking`}
      title={`${Math.max(0, Math.floor(points))} pontos no ranking`}
    >
      <Star className={compact ? "size-[18px]" : "size-6"} strokeWidth={1.8} aria-hidden="true" />
      <span>{displayedPoints}</span>
    </span>
  );
}
