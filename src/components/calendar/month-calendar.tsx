"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AvailabilityByDate, AvailabilityStatus, dateKey } from "@/lib/availability";

type MonthCalendarProps = {
  month: Date;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: string) => void;
  statuses?: AvailabilityByDate;
  rangeStart?: string;
  rangeEnd?: string;
};

const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const statusClasses: Record<AvailabilityStatus, string> = {
  available: "bg-emerald-400/20 text-emerald-200 ring-1 ring-inset ring-emerald-400/30 hover:bg-emerald-400/30",
  busy: "bg-amber-400/20 text-amber-100 ring-1 ring-inset ring-amber-400/30 hover:bg-amber-400/30",
  not_booking: "bg-rose-400/20 text-rose-200 ring-1 ring-inset ring-rose-400/30 hover:bg-rose-400/30",
};

const statusLabels: Record<AvailabilityStatus, string> = {
  available: "livre para contratação",
  busy: "ocupado",
  not_booking: "não aceita shows",
};

export function MonthCalendar({ month, onMonthChange, onSelectDate, statuses = {}, rangeStart = "", rangeEnd = "" }: MonthCalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekdayOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekdayOffset + daysInMonth) / 7) * 7;
  const today = dateKey(new Date());
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthStart = new Date(year, monthIndex, 1);
  const title = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(month);

  function changeMonth(amount: number) {
    onMonthChange(new Date(year, monthIndex + amount, 1));
  }

  return <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1B1B1E]">
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
      <button type="button" onClick={() => changeMonth(-1)} disabled={monthStart <= currentMonth} className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25" aria-label="Mês anterior"><ChevronLeft className="size-5" /></button>
      <h3 className="text-base font-semibold capitalize text-white/90 sm:text-lg">{title}</h3>
      <button type="button" onClick={() => changeMonth(1)} className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-white/75 transition hover:bg-white/10 hover:text-white" aria-label="Próximo mês"><ChevronRight className="size-5" /></button>
    </div>

    <div className="grid grid-cols-7 bg-[#6C1EE7] py-2 text-center text-[11px] font-medium text-white/90 sm:text-xs">
      {weekdays.map((day) => <span key={day}>{day}</span>)}
    </div>

    <div className="grid grid-cols-7 gap-y-1 p-2 sm:gap-y-2 sm:p-3">
      {Array.from({ length: cellCount }, (_, index) => {
        const dayNumber = index - firstWeekdayOffset + 1;
        if (dayNumber < 1 || dayNumber > daysInMonth) return <span key={`empty-${index}`} className="aspect-square" aria-hidden="true" />;

        const date = new Date(year, monthIndex, dayNumber);
        const key = dateKey(date);
        const status = statuses[key];
        const disabled = key < today;
        const inRange = Boolean(rangeStart && rangeEnd && key >= rangeStart && key <= rangeEnd);
        const selectedEndpoint = (rangeStart && key === rangeStart) || (rangeEnd && key === rangeEnd);
        const classes = selectedEndpoint
          ? "bg-[#6C1EE7] font-bold text-white shadow-md shadow-[#6C1EE7]/30"
          : inRange
            ? "bg-[#6C1EE7]/30 text-[#E4C9FF]"
            : status
              ? statusClasses[status]
              : "text-white/85 hover:bg-white/10";

        return <button key={key} type="button" onClick={() => onSelectDate(key)} disabled={disabled} aria-pressed={Boolean(selectedEndpoint || inRange)} aria-label={`${formatDayLabel(date)}${status ? `, ${statusLabels[status]}` : ""}`} className={`relative mx-auto flex aspect-square w-full max-w-12 items-center justify-center rounded-xl text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#BA3BE7] disabled:cursor-not-allowed disabled:text-white/20 disabled:hover:bg-transparent ${classes} ${key === today && !selectedEndpoint ? "ring-1 ring-inset ring-white/40" : ""}`}>
          {dayNumber}
          {status && !selectedEndpoint && <span className={`absolute bottom-1 size-1 rounded-full ${status === "available" ? "bg-emerald-300" : status === "busy" ? "bg-amber-300" : "bg-rose-300"}`} aria-hidden="true" />}
        </button>;
      })}
    </div>
  </div>;
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(date);
}
