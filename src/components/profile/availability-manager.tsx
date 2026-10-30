"use client";

import { useState } from "react";
import { CalendarDays, Check, LoaderCircle, Save } from "lucide-react";
import { useToast } from "@/components/providers/app-providers";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { BOOKING_WEEKDAYS, AvailabilityByDate, AvailabilityStatus } from "@/lib/availability";
import { createClient } from "@/utils/supabase/client";

const statusOptions: { value: AvailabilityStatus; label: string; className: string }[] = [
  { value: "available", label: "Livre para shows", className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" },
  { value: "busy", label: "Ocupado", className: "border-amber-400/40 bg-amber-400/10 text-amber-100" },
  { value: "not_booking", label: "Não faço shows", className: "border-rose-400/40 bg-rose-400/10 text-rose-200" },
];

export function AvailabilityManager({ configured, initialWeekdays, initialStatuses }: { configured: boolean; initialWeekdays: number[]; initialStatuses: AvailabilityByDate }) {
  const [weekdays, setWeekdays] = useState(initialWeekdays);
  const [statuses, setStatuses] = useState<AvailabilityByDate>(initialStatuses);
  const [mode, setMode] = useState<AvailabilityStatus>("available");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [saving, setSaving] = useState(false);
  const [savedWeekdays, setSavedWeekdays] = useState(initialWeekdays);
  const [savedStatuses, setSavedStatuses] = useState<AvailabilityByDate>(initialStatuses);
  const { toast } = useToast();

  function toggleWeekday(value: number) {
    setWeekdays((current) => current.includes(value) ? current.filter((day) => day !== value) : [...current, value].sort((a, b) => a - b));
  }

  function markDate(value: string) {
    setStatuses((current) => {
      const updated = { ...current };
      if (updated[value] === mode) delete updated[value];
      else updated[value] = mode;
      return updated;
    });
  }

  async function saveAvailability() {
    if (!configured) {
      toast("Conecte o Supabase para salvar sua disponibilidade.", "error");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      toast("Entre novamente para salvar sua disponibilidade.", "error");
      return;
    }

    const { error: preferencesError } = await supabase.from("profiles").update({ booking_weekdays: weekdays }).eq("id", user.id);
    if (preferencesError) {
      setSaving(false);
      toast("Não foi possível salvar os dias habituais. Aplique o schema atualizado do Supabase e tente de novo.", "error");
      return;
    }

    const removedDates = Object.keys(savedStatuses).filter((date) => !(date in statuses));
    if (removedDates.length > 0) {
      const { error } = await supabase.from("artist_availability").delete().eq("user_id", user.id).in("availability_date", removedDates);
      if (error) {
        setSaving(false);
        toast("Não foi possível atualizar as datas marcadas.", "error");
        return;
      }
    }

    const changedDates = Object.entries(statuses)
      .filter(([date, status]) => savedStatuses[date] !== status)
      .map(([availability_date, status]) => ({ user_id: user.id, availability_date, status }));
    if (changedDates.length > 0) {
      const { error } = await supabase.from("artist_availability").upsert(changedDates, { onConflict: "user_id,availability_date" });
      if (error) {
        setSaving(false);
        toast("Não foi possível atualizar as datas marcadas.", "error");
        return;
      }
    }

    setSavedWeekdays(weekdays);
    setSavedStatuses({ ...statuses });
    setSaving(false);
    toast("Disponibilidade atualizada.");
  }

  const changedCount = weekdays.filter((day) => !savedWeekdays.includes(day)).length
    + savedWeekdays.filter((day) => !weekdays.includes(day)).length
    + Object.keys(statuses).filter((date) => savedStatuses[date] !== statuses[date]).length
    + Object.keys(savedStatuses).filter((date) => !(date in statuses)).length;

  return <div className="space-y-6">
    <section className="rounded-2xl border border-white/10 bg-[#222226] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#6C1EE7]/20 text-[#D6A0FF]"><CalendarDays className="size-5" /></span>
        <div>
          <h2 className="font-semibold">Dias habituais para contratação</h2>
          <p className="mt-1 text-sm leading-relaxed text-white/50">Selecione os dias da semana em que costuma aceitar shows. Você pode marcar datas específicas no calendário para substituir essa regra.</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BOOKING_WEEKDAYS.map((day) => {
          const selected = weekdays.includes(day.value);
          return <button key={day.value} type="button" onClick={() => toggleWeekday(day.value)} aria-pressed={selected} className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm transition ${selected ? "border-[#BA3BE7]/50 bg-[#6C1EE7]/20 text-white" : "border-white/10 bg-[#101010]/40 text-white/55 hover:border-white/20"}`}>
            <span className={`flex size-5 items-center justify-center rounded-md border ${selected ? "border-[#BA3BE7] bg-[#6C1EE7] text-white" : "border-white/25 text-transparent"}`}><Check className="size-3.5" /></span>{day.label}
          </button>;
        })}
      </div>
    </section>

    <section className="rounded-2xl border border-white/10 bg-[#222226] p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="font-semibold">Marcar datas no calendário</h2>
        <p className="mt-1 text-sm text-white/50">Escolha uma situação e toque nos dias. Toque outra vez para remover a marcação.</p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {statusOptions.map((option) => <button key={option.value} type="button" onClick={() => setMode(option.value)} aria-pressed={mode === option.value} className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${mode === option.value ? option.className : "border-white/10 bg-[#101010]/40 text-white/55 hover:border-white/20"}`}>
          {option.label}
        </button>)}
      </div>

      <MonthCalendar month={month} onMonthChange={setMonth} onSelectDate={markDate} statuses={statuses} />

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-white/55">
        {statusOptions.map((option) => <span key={option.value} className="inline-flex items-center gap-1.5"><i className={`size-2 rounded-full ${option.value === "available" ? "bg-emerald-300" : option.value === "busy" ? "bg-amber-300" : "bg-rose-300"}`} />{option.label}</span>)}
      </div>

      <p className="mt-5 rounded-xl border border-white/10 bg-[#101010]/40 px-4 py-3 text-xs leading-relaxed text-white/50">Dias sem marcação seguem os dias habituais acima. Uma data marcada como livre fica disponível mesmo que o dia da semana não esteja selecionado.</p>
    </section>

    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-white/40">{changedCount > 0 ? "Há alterações que ainda não foram salvas." : "Sua disponibilidade está atualizada."}</p>
      <button type="button" onClick={saveAvailability} disabled={saving || changedCount === 0} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#6C1EE7] px-5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7] disabled:cursor-not-allowed disabled:opacity-50">
        {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{saving ? "Salvando..." : "Salvar disponibilidade"}
      </button>
    </div>
  </div>;
}
