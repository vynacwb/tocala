import { Medal } from "lucide-react";

const medalStyles: Record<number, { color: string; label: string }> = {
  1: { color: "#FBBF24", label: "ouro" },
  2: { color: "#D1D5DB", label: "prata" },
  3: { color: "#CD7F32", label: "bronze" },
};

export function RankingMedal({ position, compact = false }: { position?: number; compact?: boolean }) {
  if (!position || position > 3) return null;
  const medal = medalStyles[position];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center gap-1 rounded-full border font-bold ${compact ? "size-8" : "h-10 px-3"}`}
      style={{ color: medal.color, borderColor: `${medal.color}66`, backgroundColor: `${medal.color}18` }}
      title={`${position}º lugar — medalha de ${medal.label}`}
      aria-label={`${position}º lugar, medalha de ${medal.label}`}
    >
      <Medal className={compact ? "size-[18px]" : "size-5"} strokeWidth={2.2} aria-hidden="true" />
      {!compact && <span>{position}º</span>}
    </span>
  );
}
