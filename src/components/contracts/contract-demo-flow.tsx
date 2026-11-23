"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addDemoReview, readStoredDemoReviews, removeStoredDemoReviews } from "@/lib/demo-reviews";
import { addUserNotification } from "@/lib/user-notifications";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CircleAlert, Clock3, MapPin, Star } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { useToast } from "@/components/providers/app-providers";
import { dateKey } from "@/lib/availability";
import { RankingMedal } from "@/components/ranking/ranking-medal";
import { readContractSimulation, saveContractSimulation, type ContractDraft as Draft, type ContractSimulationRole as SimulationRole, type StoredContractSimulation } from "@/lib/contract-simulations";

type Artist = { id: string; name: string; genre: string; imageUrl: string; rankingPosition?: number; estimatedPrice?: number | null; acceptsDifferentProposals?: boolean };
type Stage = "details" | "contract" | "artist" | "adjustment" | "payment" | "checkin" | "review" | "complete";

const steps = ["Proposta", "Artista", "Pagamento", "Check-in", "Finalização"];
const inputClass = "h-12 w-full rounded-xl border border-white/10 bg-[#101010]/70 px-3.5 text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-[#3EA6FF] focus:ring-2 focus:ring-[#3EA6FF]/20 sm:text-sm";

function initialDraft(estimatedPrice?: number | null): Draft {
  return {
    eventTitle: "", eventDate: "", startTime: "", endTime: "", venueName: "", venueAddress: "", venueType: "Espaço de eventos",
    performanceMinutes: "90", arrivalMinutes: "60", fee: estimatedPrice == null ? "" : String(estimatedPrice), transportationByArtist: false, mealProvided: false,
    lodgingProvided: false, soundCheck: true, equipmentProvided: true, dateConfirmed: false, timeConfirmed: false, venueConfirmed: false, extraTerms: "",
  };
}

function formatEventDate(value: string) {
  if (!value) return "A definir";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}

function followingDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toBrazilianDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

function fromBrazilianDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return "";
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return "";
  return `${year}-${month}-${day}`;
}

function DateField({ value, onChange, min }: { value: string; onChange: (value: string) => void; min: string }) {
  const [mode, setMode] = useState<"calendar" | "typing">("calendar");
  const [typedDate, setTypedDate] = useState(() => toBrazilianDate(value));

  function updateTypedDate(rawValue: string) {
    const digits = rawValue.replace(/\D/g, "").slice(0, 8);
    const formatted = digits.length <= 2 ? digits : digits.length <= 4 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    setTypedDate(formatted);
    onChange(fromBrazilianDate(formatted));
  }

  return <div>
    <span className="mb-2 block text-sm font-medium text-white/80">Dia do evento</span>
    {mode === "calendar" ? <input type="date" required min={min} value={value} onChange={(event) => onChange(event.target.value)} onClick={(event) => event.currentTarget.showPicker?.()} aria-label="Dia do evento" className={`${inputClass} cursor-pointer`} /> : <input type="text" required inputMode="numeric" autoComplete="off" maxLength={10} pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" placeholder="DD/MM/AAAA" value={typedDate} onChange={(event) => updateTypedDate(event.target.value)} aria-label="Dia do evento no formato dia, mês e ano" className={inputClass} />}
    {mode === "typing" && <p className="mt-1.5 text-xs text-white/40">Digite a data como dia/mês/ano.</p>}
    <div className="mt-2">
      <button type="button" onClick={() => { if (mode === "calendar") { setTypedDate(toBrazilianDate(value)); setMode("typing"); } else setMode("calendar"); }} aria-pressed={mode === "typing"} className="tap-target rounded-xl px-3 text-xs font-medium text-white/60 transition-all duration-200 hover:bg-white/5 hover:text-white">{mode === "calendar" ? "Digitar data" : "Usar calendário"}</button>
    </div>
  </div>;
}

function TimeField({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  const [mode, setMode] = useState<"clock" | "typing">("clock");
  const [clockOpen, setClockOpen] = useState(false);
  const [selecting, setSelecting] = useState<"hour" | "minute">("hour");
  const [typedTime, setTypedTime] = useState(value);
  const [selectedHour, setSelectedHour] = useState(value ? Number(value.slice(0, 2)) : 19);
  const [selectedMinute, setSelectedMinute] = useState(value ? Number(value.slice(3, 5)) : 0);

  function updateTypedTime(rawValue: string) {
    const digits = rawValue.replace(/\D/g, "").slice(0, 4);
    const formatted = digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
    setTypedTime(formatted);
    if (digits.length === 4) {
      const hour = Number(digits.slice(0, 2));
      const minute = Number(digits.slice(2));
      onChange(hour < 24 && minute < 60 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : "");
    } else onChange("");
  }

  function completeTypedHour() {
    const digits = typedTime.replace(/\D/g, "");
    if (digits.length > 0 && digits.length <= 2 && Number(digits) < 24) {
      const completed = `${digits.padStart(2, "0")}:00`;
      setTypedTime(completed);
      onChange(completed);
    }
  }

  function chooseHour(hour: number) {
    setSelectedHour(hour);
    setSelectedMinute(0);
    setSelecting("minute");
  }

  function chooseMinute(minute: number) {
    const formatted = `${String(selectedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    setSelectedMinute(minute);
    setTypedTime(formatted);
    onChange(formatted);
    setClockOpen(false);
    setSelecting("hour");
  }

  function chooseMinuteFromDial(event: React.MouseEvent<HTMLDivElement>) {
    if (selecting !== "minute") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaX = event.clientX - (bounds.left + bounds.width / 2);
    const deltaY = event.clientY - (bounds.top + bounds.height / 2);
    const degrees = (Math.atan2(deltaY, deltaX) * 180 / Math.PI + 450) % 360;
    chooseMinute(Math.round(degrees / 6) % 60);
  }

  function openClock() {
    if (value) {
      setSelectedHour(Number(value.slice(0, 2)));
    }
    setSelectedMinute(0);
    setMode("clock");
    setClockOpen(true);
    setSelecting("hour");
  }

  const dialPosition = (index: number, radius: number) => {
    const angle = (index * 30 - 90) * (Math.PI / 180);
    return { left: `calc(50% + ${Math.round(Math.cos(angle) * radius)}px)`, top: `calc(50% + ${Math.round(Math.sin(angle) * radius)}px)` };
  };
  const handAngle = selecting === "hour" ? (selectedHour % 12) * 30 : selectedMinute * 6;
  const handLength = selecting === "hour" && selectedHour >= 12 ? 58 : 98;

  return <div>
    <span className="mb-2 block text-sm font-medium text-white/80">{label}</span>
    <div>
      <input type="text" readOnly={mode === "clock"} required={required} pattern={mode === "typing" ? "(?:[01][0-9]|2[0-3]):[0-5][0-9]" : undefined} value={mode === "clock" ? value : typedTime} onChange={(event) => updateTypedTime(event.target.value)} onBlur={mode === "typing" ? completeTypedHour : undefined} onClick={mode === "clock" ? openClock : undefined} placeholder="HH:MM" inputMode={mode === "typing" ? "numeric" : undefined} aria-label={label} aria-expanded={mode === "clock" ? clockOpen : undefined} className={`${inputClass} ${mode === "clock" ? "cursor-pointer" : ""}`} />
    </div>
    <div className="mt-2 flex items-center gap-2">
      <button type="button" onClick={() => { if (mode === "clock") { setMode("typing"); setClockOpen(false); setTypedTime(value); } else { setMode("clock"); setSelectedHour(value ? Number(value.slice(0, 2)) : 19); setSelectedMinute(0); } }} aria-pressed={mode === "typing"} className="tap-target rounded-xl px-3 text-xs font-medium text-white/60 transition-all duration-200 hover:bg-white/5 hover:text-white">{mode === "clock" ? "Digitar horário" : "Usar relógio"}</button>
      {mode === "typing" && <span className="self-center text-xs text-white/40">Digite 19 para completar 19:00.</span>}
    </div>
    {clockOpen && mode === "clock" && <div className="relative z-20 mt-2 w-full max-w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A1D] p-3 shadow-2xl sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/50">{selecting === "hour" ? "Escolha a hora" : "Escolha os minutos"}</p>
          <div className="mt-2 flex items-center gap-1.5 font-semibold tabular-nums">
            <button type="button" onClick={() => setSelecting("hour")} aria-label="Selecionar hora" aria-pressed={selecting === "hour"} className={`tap-target rounded-lg px-2.5 text-2xl transition-all duration-200 ${selecting === "hour" ? "bg-[#1565C0] text-white ring-2 ring-[#3EA6FF]/60" : "bg-white/[0.06] text-white/70 hover:bg-white/10"}`}>{String(selectedHour).padStart(2, "0")}</button>
            <span className="text-2xl text-white/60">:</span>
            <button type="button" onClick={() => setSelecting("minute")} aria-label="Selecionar minutos" aria-pressed={selecting === "minute"} className={`tap-target rounded-lg px-2.5 text-2xl transition-all duration-200 ${selecting === "minute" ? "bg-[#1565C0] text-white ring-2 ring-[#3EA6FF]/60" : "bg-white/[0.06] text-white/70 hover:bg-white/10"}`}>{String(selectedMinute).padStart(2, "0")}</button>
          </div>
        </div>
        <button type="button" onClick={() => setClockOpen(false)} className="tap-target rounded-xl px-3 text-xs font-medium text-white/60 transition-all duration-200 hover:bg-white/5 hover:text-white">Fechar</button>
      </div>
      <div onClick={chooseMinuteFromDial} className={`relative mx-auto size-[248px] touch-manipulation rounded-full bg-[#29292D] sm:size-[280px] ${selecting === "minute" ? "cursor-crosshair" : ""}`} aria-label={selecting === "hour" ? "Mostrador de horas: números externos de 0 a 11 e internos de 12 a 23" : "Mostrador de minutos: toque para escolher minutos exatos"}>
        {selecting === "hour" ? <>{Array.from({ length: 12 }, (_, index) => <button key={`outer-${index}`} type="button" onClick={() => chooseHour(index)} style={dialPosition(index, 98)} className={`absolute z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs transition-all duration-200 before:absolute before:-inset-1.5 before:content-[''] sm:size-9 ${selectedHour === index ? "bg-[#1565C0] text-white ring-2 ring-[#8DCAFF]/60" : "text-white/85 hover:bg-white/10"}`}>{index}</button>)}{Array.from({ length: 12 }, (_, index) => { const hour = index + 12; return <button key={`inner-${hour}`} type="button" onClick={() => chooseHour(hour)} style={dialPosition(index, 58)} className={`absolute z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs transition-all duration-200 before:absolute before:-inset-1.5 before:content-[''] sm:size-9 ${selectedHour === hour ? "bg-[#1565C0] text-white ring-2 ring-[#8DCAFF]/60" : "text-white/70 hover:bg-white/10"}`}>{hour}</button>; })}</> : Array.from({ length: 12 }, (_, index) => { const minute = index * 5; return <button key={`minute-${minute}`} type="button" onClick={(event) => { event.stopPropagation(); chooseMinute(minute); }} style={dialPosition(index, 98)} aria-label={`${String(minute).padStart(2, "0")} minutos`} className={`absolute z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs transition-all duration-200 before:absolute before:-inset-1.5 before:content-[''] sm:size-9 ${selectedMinute === minute ? "bg-[#1565C0] text-white ring-2 ring-[#8DCAFF]/60" : "text-white/85 hover:bg-white/10"}`}>{String(minute).padStart(2, "0")}</button>; })}
        <span aria-hidden="true" className="absolute z-[1] w-0.5 rounded-full bg-[#3EA6FF]" style={{ left: "calc(50% - 1px)", top: `calc(50% - ${handLength}px)`, height: `${handLength}px`, transform: `rotate(${handAngle}deg)`, transformOrigin: "50% 100%" }} />
        <span className="absolute left-1/2 top-1/2 z-[2] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3EA6FF] shadow-[0_0_10px_#3EA6FF]" />
      </div>
      {selecting === "minute" && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/45"><button type="button" onClick={() => setSelecting("hour")} className="tap-target rounded-lg px-2 text-[#8DCAFF] transition-colors duration-200 hover:bg-white/5">Voltar para a hora</button><span className="min-w-0 flex-1 text-right">Toque no mostrador para escolher o minuto exato</span></div>}
    </div>}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-white/80">{label}</span>{children}</label>;
}

function CheckOption({ checked, onChange, children, tone = "artist" }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode; tone?: SimulationRole }) {
  const checkedClass = tone === "contractor" ? "border-[#3EA6FF]/55 bg-[#1565C0]/20 text-white" : "border-[#BA3BE7]/50 bg-[#6C1EE7]/15 text-white";
  const checkmarkClass = tone === "contractor" ? "border-[#3EA6FF] bg-[#1565C0] text-white" : "border-[#BA3BE7] bg-[#6C1EE7] text-white";
  return <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition ${checked ? checkedClass : "border-white/10 bg-[#101010]/35 text-white/70 hover:border-white/20"}`}>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
    <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${checked ? checkmarkClass : "border-white/25 text-transparent"}`}><Check className="size-3.5" /></span>
    <span>{children}</span>
  </label>;
}

export function ContractDemoFlow({ artist, isOwnProfile, simulationId, requestedRole = "contractor", viewerId }: { artist: Artist; isOwnProfile: boolean; simulationId?: string; requestedRole?: SimulationRole; viewerId?: string }) {
  const [stage, setStage] = useState<Stage>("details");
  const [draft, setDraft] = useState<Draft>(() => initialDraft(artist.estimatedPrice));
  const [activeSimulationId, setActiveSimulationId] = useState<string | null>(simulationId ?? null);
  const [storedSimulation, setStoredSimulation] = useState<StoredContractSimulation | null>(null);
  const [buyerAccepted, setBuyerAccepted] = useState(false);
  const [artistAccepted, setArtistAccepted] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [changeRequest, setChangeRequest] = useState("");
  const [checkinConfirmed, setCheckinConfirmed] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!simulationId) return;
    const timeout = window.setTimeout(() => {
      const stored = readContractSimulation(simulationId);
      if (!stored || stored.artistId !== artist.id) {
        toast("Esta proposta simulada não foi encontrada neste navegador.", "error");
        return;
      }
      setDraft(stored.draft);
      setActiveSimulationId(stored.id);
      setStoredSimulation(stored);
      setArtistAccepted(stored.status !== "pending_artist");
      setChangeRequest(stored.changeRequest ?? "");
      if (stored.status === "pending_artist") setStage("artist");
      else if (stored.status === "adjustment_requested") setStage("adjustment");
      else if (stored.status === "awaiting_payment") setStage("payment");
      else if (stored.status === "awaiting_checkin") setStage("checkin");
      else if (stored.status === "completed") setStage((requestedRole === "contractor" ? stored.contractorReview : stored.artistReview) ? "complete" : "review");
      else setStage("complete");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [artist.id, requestedRole, simulationId, toast]);

  const stageIndex = stage === "details" || stage === "contract" ? 0 : stage === "artist" || stage === "adjustment" ? 1 : stage === "payment" ? 2 : stage === "checkin" ? 3 : 4;
  const simulationRole: SimulationRole = !simulationId
    ? "contractor"
    : stage === "artist"
      ? "artist"
      : stage === "adjustment" || stage === "payment"
        ? "contractor"
        : requestedRole;
  const isContractorSimulation = simulationRole === "contractor";
  const rolePanelClass = isContractorSimulation ? "border-[#3EA6FF]/35 bg-[#10243A]" : "border-[#BA3BE7]/25 bg-[#222226]";
  const roleAccentTextClass = isContractorSimulation ? "text-[#8DCAFF]" : "text-[#D6A0FF]";
  const primaryActionClass = isContractorSimulation ? "bg-[#1565C0] hover:bg-[#1976D2]" : "bg-[#6C1EE7] hover:bg-[#BA3BE7]";
  const summaryClass = isContractorSimulation ? "border-[#3EA6FF]/25 bg-[#0D1B2A]" : "border-white/10 bg-[#151517]";

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.eventDate || draft.eventDate < dateKey(new Date())) {
      toast("Escolha uma data válida para o evento.", "error");
      return;
    }
    if (!draft.startTime) {
      toast("Escolha o horário de início no relógio ou digite a hora.", "error");
      return;
    }
    const pendingConfirmations = [
      !draft.dateConfirmed && "data",
      !draft.timeConfirmed && "horário",
      !draft.venueConfirmed && "local",
    ].filter(Boolean);
    if (pendingConfirmations.length) {
      toast(`No checklist ao final, confirme: ${pendingConfirmations.join(", ")}.`, "error");
      return;
    }
    if (draft.endTime && draft.endTime === draft.startTime) {
      toast("Os horários de início e término precisam ser diferentes. Para terminar após meia-noite, informe um horário menor que o início.", "error");
      return;
    }
    setStage("contract");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDemoReview() {
    if (!activeSimulationId) return;
    const current = readContractSimulation(activeSimulationId);
    if (!current) {
      toast("Este contrato fictício não foi encontrado neste navegador.", "error");
      return;
    }

    try {
      if (simulationRole === "contractor" && !isOwnProfile && isSupabaseConfigured()) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast("Entre na sua conta para compartilhar a avaliação com os outros participantes.", "error");
          return;
        }
        const oldReviews = readStoredDemoReviews().filter((review) => review.artistId === artist.id && /^[0-9a-f-]{36}$/i.test(review.artistId));
        const submissions = [
          ...oldReviews.map((review) => ({ source_id: review.id, artist_id: review.artistId, author_id: user.id, author_name: review.authorName, body: review.comment, rating: review.rating })),
          { source_id: `contract-${crypto.randomUUID()}`, artist_id: artist.id, author_id: user.id, author_name: "Contratante fictício", body: reviewComment.trim(), rating: reviewRating },
        ];
        const { error } = await supabase.from("demo_reviews").upsert(submissions, { onConflict: "source_id", ignoreDuplicates: true });
        if (error) {
          console.error("Falha ao salvar avaliação fictícia no Supabase:", { code: error.code, message: error.message, details: error.details, hint: error.hint });
          toast(error.code === "42501"
            ? "O Supabase bloqueou a avaliação. Confira se o perfil do artista está público e se você não está avaliando a própria conta."
            : "Não foi possível compartilhar a avaliação. Execute demo_reviews_migration.sql no SQL Editor do Supabase e tente novamente.", "error");
          return;
        }
        removeStoredDemoReviews(oldReviews.map((review) => review.id));
      } else if (simulationRole === "contractor" && !isOwnProfile) {
        addDemoReview({ artistId: artist.id, authorName: "Contratante fictício", rating: reviewRating, comment: reviewComment.trim() });
      }

      const review = { rating: reviewRating, comment: reviewComment.trim(), createdAt: new Date().toISOString() };
      const updated: StoredContractSimulation = simulationRole === "contractor"
        ? { ...current, contractorReview: review, status: current.artistReview ? "reviewed" : "completed" }
        : { ...current, artistReview: review, status: current.contractorReview ? "reviewed" : "completed" };
      saveContractSimulation(updated);
      setStoredSimulation(updated);
    } catch {
      toast("Não foi possível mostrar a avaliação simulada neste navegador.", "error");
      return;
    }
    toast("Avaliação fictícia registrada.");
    router.push("/");
  }

  function simulationHref(id: string, role: SimulationRole) {
    return `/contratos/novo?artista=${encodeURIComponent(artist.id)}&simulacao=${encodeURIComponent(id)}&papel=${role === "artist" ? "artista" : "contratante"}`;
  }

  function simulateProposalSend() {
    const createdSimulationId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const simulation: StoredContractSimulation = {
      id: createdSimulationId,
      artistId: artist.id,
      artistName: artist.name,
      artistGenre: artist.genre,
      contractorId: viewerId ?? artist.id,
      draft,
      status: "pending_artist",
      createdAt: new Date().toISOString(),
    };
    saveContractSimulation(simulation);
    setStoredSimulation(simulation);
    setActiveSimulationId(createdSimulationId);
    addUserNotification(artist.id, {
      type: "contract-proposal",
      simulationRole: "artist",
      title: "Novo contrato fictício para analisar",
      detail: `Você recebeu uma proposta para ${draft.eventTitle} em ${formatEventDate(draft.eventDate)}. Analise os detalhes como artista.`,
      href: simulationHref(createdSimulationId, "artist"),
      actionLabel: "Analisar contrato",
    });
    toast("Contrato fictício gerado. Abra a notificação para analisá-lo como artista.");
    router.push("/");
  }

  function acceptContract() {
    if (!activeSimulationId) return;
    const current = readContractSimulation(activeSimulationId);
    if (!current) return;
    const updated: StoredContractSimulation = { ...current, draft, status: "awaiting_payment", acceptedAt: new Date().toISOString() };
    saveContractSimulation(updated);
    setStoredSimulation(updated);
    addUserNotification(current.contractorId, {
      type: "contract-accepted",
      simulationRole: "contractor",
      title: "Contrato aceito: pagamento pendente",
      detail: `${artist.name} aceitou a proposta para ${draft.eventTitle}. Simule o pagamento protegido para continuar.`,
      href: simulationHref(current.id, "contractor"),
      actionLabel: "Realizar pagamento",
    });
    toast("Aceite registrado. O contratante recebeu a solicitação de pagamento.");
    router.push("/");
  }

  function requestAdjustment() {
    if (!activeSimulationId || !changeRequest.trim()) return;
    const current = readContractSimulation(activeSimulationId);
    if (!current) return;
    const updated: StoredContractSimulation = { ...current, status: "adjustment_requested", changeRequest: changeRequest.trim() };
    saveContractSimulation(updated);
    setStoredSimulation(updated);
    addUserNotification(current.contractorId, {
      type: "contract-accepted",
      simulationRole: "contractor",
      title: "O artista sugeriu um ajuste",
      detail: `Revise a contraproposta de ${artist.name} para ${draft.eventTitle}.`,
      href: simulationHref(current.id, "contractor"),
      actionLabel: "Analisar ajuste",
    });
    router.push("/");
  }

  function acceptAdjustment() {
    if (!activeSimulationId) return;
    const current = readContractSimulation(activeSimulationId);
    if (!current) return;
    const adjustedDraft = { ...current.draft, extraTerms: [current.draft.extraTerms, `Ajuste simulado aceito: ${current.changeRequest ?? changeRequest}`].filter(Boolean).join("\n") };
    const updated: StoredContractSimulation = { ...current, draft: adjustedDraft, status: "awaiting_payment", acceptedAt: new Date().toISOString() };
    saveContractSimulation(updated);
    setDraft(adjustedDraft);
    setStoredSimulation(updated);
    addUserNotification(current.contractorId, {
      type: "contract-payment",
      simulationRole: "contractor",
      title: "Ajuste aceito: pagamento pendente",
      detail: `O contrato fictício de ${draft.eventTitle} está pronto para o pagamento simulado.`,
      href: simulationHref(current.id, "contractor"),
      actionLabel: "Realizar pagamento",
    });
    router.push("/");
  }

  function confirmPayment() {
    if (!activeSimulationId || !paymentConfirmed) return;
    const current = readContractSimulation(activeSimulationId);
    if (!current) return;
    const updated: StoredContractSimulation = { ...current, status: "awaiting_checkin", paidAt: new Date().toISOString(), contractorCheckedIn: false, artistCheckedIn: false };
    saveContractSimulation(updated);
    setStoredSimulation(updated);
    addUserNotification(current.contractorId, {
      type: "contract-checkin",
      simulationRole: "contractor",
      title: "Pagamento confirmado: faça seu check-in",
      detail: `O pagamento fictício de ${draft.eventTitle} foi protegido. Confirme a presença como contratante.`,
      href: simulationHref(current.id, "contractor"),
      actionLabel: "Check-in do contratante",
    });
    addUserNotification(current.artistId, {
      type: "contract-checkin",
      simulationRole: "artist",
      title: "Evento liberado para check-in",
      detail: `O pagamento fictício de ${draft.eventTitle} foi confirmado. Confirme a presença como artista.`,
      href: simulationHref(current.id, "artist"),
      actionLabel: "Check-in do artista",
    });
    toast("Pagamento fictício confirmado. Os dois participantes receberam o check-in.");
    router.push("/");
  }

  function confirmCheckin() {
    if (!activeSimulationId || !checkinConfirmed) return;
    const current = readContractSimulation(activeSimulationId);
    if (!current) return;
    const updated: StoredContractSimulation = {
      ...current,
      contractorCheckedIn: simulationRole === "contractor" ? true : current.contractorCheckedIn,
      artistCheckedIn: simulationRole === "artist" ? true : current.artistCheckedIn,
    };
    const bothCheckedIn = Boolean(updated.contractorCheckedIn && updated.artistCheckedIn);
    updated.status = bothCheckedIn ? "completed" : "awaiting_checkin";
    saveContractSimulation(updated);
    setStoredSimulation(updated);

    if (bothCheckedIn) {
      addUserNotification(updated.contractorId, {
        type: "contract-completed", simulationRole: "contractor", title: "Evento finalizado. Avaliar?", detail: `Os dois check-ins de ${draft.eventTitle} foram confirmados. Avalie a apresentação como contratante.`, href: simulationHref(updated.id, "contractor"), actionLabel: "Avaliar artista",
      });
      addUserNotification(updated.artistId, {
        type: "contract-completed", simulationRole: "artist", title: "Evento finalizado. Avaliar?", detail: `Os dois check-ins de ${draft.eventTitle} foram confirmados. Avalie a experiência como artista.`, href: simulationHref(updated.id, "artist"), actionLabel: "Avaliar contratante",
      });
      toast("Evento finalizado. As avaliações foram enviadas aos dois participantes.");
    } else {
      const waitingRole: SimulationRole = simulationRole === "contractor" ? "artist" : "contractor";
      const waitingProfileId = waitingRole === "artist" ? updated.artistId : updated.contractorId;
      addUserNotification(waitingProfileId, {
        type: "contract-checkin", simulationRole: waitingRole, title: "Falta o seu check-in", detail: `A outra parte confirmou presença em ${draft.eventTitle}. Confirme também para finalizar o evento.`, href: simulationHref(updated.id, waitingRole), actionLabel: "Confirmar check-in",
      });
      toast("Seu check-in foi registrado. Falta a confirmação da outra parte.");
    }
    router.push("/");
  }

  function goBack() {
    if (!simulationId && stage === "contract") setStage("details");
    else if (simulationId) router.push("/");
    else router.back();
  }

  function summary() {
    const finishesNextDay = Boolean(draft.endTime && draft.startTime && draft.endTime < draft.startTime);
    return <div className={`space-y-3 rounded-2xl border p-4 sm:p-5 ${summaryClass}`}>
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <Image src={artist.imageUrl} alt="" width={48} height={48} unoptimized className="size-12 rounded-xl object-cover" />
        <div className="min-w-0"><p className="flex items-center gap-2 break-words font-semibold [overflow-wrap:anywhere]">{artist.name}<RankingMedal position={artist.rankingPosition} compact /></p><p className="mt-0.5 break-words text-xs text-white/50 [overflow-wrap:anywhere]">{artist.genre}</p></div>
      </div>
      <h3 className="break-words font-semibold [overflow-wrap:anywhere]">{draft.eventTitle || "Apresentação musical"}</h3>
      <p className="flex items-start gap-2 text-sm text-white/65"><CalendarDays className={`mt-0.5 size-4 shrink-0 ${roleAccentTextClass}`} /><span className="min-w-0 break-words [overflow-wrap:anywhere]">{formatEventDate(draft.eventDate)}</span></p>
      <p className="flex items-start gap-2 text-sm text-white/65"><Clock3 className={`mt-0.5 size-4 shrink-0 ${roleAccentTextClass}`} /><span className="min-w-0 break-words [overflow-wrap:anywhere]">Início {draft.startTime || "a definir"}{draft.endTime ? ` · término ${draft.endTime}${finishesNextDay ? ` (${formatEventDate(followingDate(draft.eventDate))}, dia seguinte)` : ""}` : ""} · {draft.performanceMinutes} min</span></p>
      <p className="flex items-start gap-2 text-sm text-white/65"><MapPin className={`mt-0.5 size-4 shrink-0 ${roleAccentTextClass}`} /><span className="min-w-0 break-words [overflow-wrap:anywhere]">{draft.venueName || "Local a definir"}{draft.venueAddress ? ` · ${draft.venueAddress}` : ""}</span></p>
      <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-white/55">
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">Chegada: {draft.arrivalMinutes} min antes</span><span className="min-w-0 break-words [overflow-wrap:anywhere]">Tipo: {draft.venueType}</span>
        <span className="col-span-2 min-w-0 break-words font-medium text-white/75 [overflow-wrap:anywhere]">Valor proposto: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(draft.fee))}</span>
      </div>
      <ul className="space-y-1 border-t border-white/10 pt-3 text-xs text-white/55 [&>li]:break-words [&>li]:[overflow-wrap:anywhere]">
        <li>Locomoção por conta do artista: {draft.transportationByArtist ? "Sim" : "Não"}</li>
        <li>Alimentação fornecida: {draft.mealProvided ? "Sim" : "Não"}</li>
        <li>Hospedagem fornecida: {draft.lodgingProvided ? "Sim" : "Não"}</li>
        <li>Passagem de som: {draft.soundCheck ? "Sim" : "Não"}</li>
        <li>Equipamento de som no local: {draft.equipmentProvided ? "Sim" : "Não"}</li>
      </ul>
      {draft.extraTerms && <p className="min-w-0 break-words border-t border-white/10 pt-3 text-xs leading-relaxed text-white/55 [overflow-wrap:anywhere]">Outras informações: {draft.extraTerms}</p>}
    </div>;
  }

  return <div className="min-h-dvh bg-[#101010] text-white">
    <header className="border-b border-white/10 bg-[#1A1A1A]/90 backdrop-blur-xl">
      <div className="relative mx-auto flex h-[calc(env(safe-area-inset-top)+72px)] max-w-[1040px] items-center justify-between px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:h-20 lg:pt-0">
        <button type="button" onClick={goBack} className={`tap-target flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75 transition-all duration-200 hover:text-white active:scale-95 ${isContractorSimulation ? "hover:border-[#3EA6FF]" : "hover:border-[#BA3BE7]"}`} aria-label="Voltar"><ArrowLeft className="size-5" /></button>
        <div className="absolute left-1/2 -translate-x-1/2 lg:static lg:ml-4 lg:translate-x-0"><Brand compact /></div>
        <span className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${isContractorSimulation ? "border-[#3EA6FF]/40 bg-[#1565C0]/20 text-[#8DCAFF]" : "border-[#BA3BE7]/35 bg-[#6C1EE7]/20 text-[#D6A0FF]"}`}>{isContractorSimulation ? "Contratante simulado" : "Visão do artista"}</span>
      </div>
    </header>
    <main className="mx-auto max-w-[760px] px-4 pb-14 pt-6 sm:px-6 sm:pt-9">
      <ol className="mb-6 grid grid-cols-5 gap-1" aria-label="Etapas da contratação fictícia">
        {steps.map((label, index) => <li key={label} className={`border-b-2 pb-2 text-center text-[9px] font-medium sm:text-[11px] ${index <= stageIndex ? isContractorSimulation ? "border-[#3EA6FF] text-[#8DCAFF]" : "border-[#BA3BE7] text-[#E4C9FF]" : "border-white/10 text-white/35"}`}>{label}</li>)}
      </ol>
      <div className={`mb-5 rounded-xl border p-3.5 text-xs leading-relaxed ${isContractorSimulation ? "border-[#3EA6FF]/35 bg-[#1565C0]/[0.12] text-[#CBE8FF]" : "border-[#BA3BE7]/30 bg-[#6C1EE7]/[0.10] text-[#E4C9FF]"}`}>
        <p className="flex items-start gap-2"><CircleAlert className={`mt-0.5 size-4 shrink-0 ${roleAccentTextClass}`} /><span><strong>{isContractorSimulation ? "Simulação do contratante." : "Simulação da resposta do artista."}</strong> {isContractorSimulation ? "Nesta tela você representa a pessoa que está contratando o artista. " : "Nesta tela você representa o artista que recebeu a proposta. "}A conta e o perfil são reais e persistentes; somente este fluxo é fictício e não cria documento jurídico, assinatura ou cobrança.</span></p>
      </div>

      {stage === "details" && <section className={`rounded-2xl border p-5 sm:p-7 ${rolePanelClass}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${roleAccentTextClass}`}>Etapa 1 · Detalhes do evento</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Criar proposta para {artist.name}</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">Preencha as condições que gostaria de combinar para a apresentação.</p>
        <form onSubmit={submitDetails} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Nome ou tipo do evento"><input required value={draft.eventTitle} onChange={(event) => update("eventTitle", event.target.value)} maxLength={100} placeholder="Ex.: Festa de aniversário da empresa" className={inputClass} /></Field></div>
            <DateField value={draft.eventDate} onChange={(value) => update("eventDate", value)} min={dateKey(new Date())} />
            <Field label="Tipo de local"><select value={draft.venueType} onChange={(event) => update("venueType", event.target.value)} className={inputClass}><option>Espaço de eventos</option><option>Bar ou restaurante</option><option>Evento corporativo</option><option>Festa particular</option><option>Festival</option><option>Outro</option></select></Field>
            <TimeField label="Horário de início" required value={draft.startTime} onChange={(value) => update("startTime", value)} />
            <div><TimeField label="Horário de término (opcional)" value={draft.endTime} onChange={(value) => update("endTime", value)} /><p className="mt-1.5 text-xs text-white/40">Se for antes do início, o término será no dia seguinte.</p></div>
            <Field label="Duração da apresentação (min)"><input type="number" min="15" max="600" required value={draft.performanceMinutes} onChange={(event) => update("performanceMinutes", event.target.value)} className={inputClass} /></Field>
            <Field label="Chegar quantos minutos antes?"><input type="number" min="0" max="720" required value={draft.arrivalMinutes} onChange={(event) => update("arrivalMinutes", event.target.value)} className={inputClass} /></Field>
            <div className="sm:col-span-2"><Field label="Nome do local"><input required value={draft.venueName} onChange={(event) => update("venueName", event.target.value)} maxLength={120} placeholder="Nome da casa ou do espaço" className={inputClass} /></Field></div>
            <div className="sm:col-span-2"><Field label="Endereço completo"><input required value={draft.venueAddress} onChange={(event) => update("venueAddress", event.target.value)} maxLength={240} placeholder="Rua, número, cidade e estado" className={inputClass} /></Field></div>
            <Field label="Valor proposto"><span className="flex h-12 w-full items-center overflow-hidden rounded-xl border border-white/10 bg-[#101010]/70 transition focus-within:border-[#3EA6FF] focus-within:ring-2 focus-within:ring-[#3EA6FF]/20"><span className="pl-3.5 text-sm text-white/55">R$</span><input type="number" required min="0.01" step="0.01" value={draft.fee} onChange={(event) => update("fee", event.target.value)} placeholder="0,00" aria-label="Valor proposto em reais" className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-white outline-none placeholder:text-white/30" /></span>{artist.estimatedPrice != null && <span className="mt-1.5 block text-xs text-white/40">Valor estimado do perfil: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(artist.estimatedPrice)}{artist.acceptsDifferentProposals ? " · aceita propostas diferentes" : ""}</span>}</Field>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-white/85">Estrutura e logística</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <CheckOption tone={simulationRole} checked={draft.transportationByArtist} onChange={(value) => update("transportationByArtist", value)}>Locomoção até o evento por conta do artista</CheckOption>
              <CheckOption tone={simulationRole} checked={draft.mealProvided} onChange={(value) => update("mealProvided", value)}>Contratante fornece alimentação</CheckOption>
              <CheckOption tone={simulationRole} checked={draft.lodgingProvided} onChange={(value) => update("lodgingProvided", value)}>Contratante fornece hospedagem</CheckOption>
              <CheckOption tone={simulationRole} checked={draft.soundCheck} onChange={(value) => update("soundCheck", value)}>Incluir passagem de som antes do show</CheckOption>
              <CheckOption tone={simulationRole} checked={draft.equipmentProvided} onChange={(value) => update("equipmentProvided", value)}>Som e equipamentos básicos no local</CheckOption>
            </div>
          </div>
          <div>
            <h2 className="mb-1 text-sm font-semibold text-white/85">Confirmações da proposta</h2>
            <p className="mb-3 text-xs text-white/50">Marque os três itens depois de revisar a data, os horários e o endereço.</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <CheckOption tone={simulationRole} checked={draft.dateConfirmed} onChange={(value) => update("dateConfirmed", value)}>Data confirmada</CheckOption>
              <CheckOption tone={simulationRole} checked={draft.timeConfirmed} onChange={(value) => update("timeConfirmed", value)}>Horário confirmado</CheckOption>
              <CheckOption tone={simulationRole} checked={draft.venueConfirmed} onChange={(value) => update("venueConfirmed", value)}>Local confirmado</CheckOption>
            </div>
          </div>
          <Field label="Outras condições ou observações (opcional)"><textarea value={draft.extraTerms} onChange={(event) => update("extraTerms", event.target.value)} maxLength={1200} rows={3} wrap="soft" placeholder="Detalhes adicionais para conversar com o artista" className="min-w-0 w-full resize-y break-words rounded-xl border border-white/10 bg-[#101010]/70 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#3EA6FF] focus:ring-2 focus:ring-[#3EA6FF]/20 [overflow-wrap:anywhere]" /></Field>
          <button type="submit" className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition ${primaryActionClass}`}>Revisar contrato fictício <ArrowRight className="size-4" /></button>
        </form>
      </section>}

      {stage === "contract" && <section className={`rounded-2xl border p-5 sm:p-7 ${rolePanelClass}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${roleAccentTextClass}`}>Etapa 2 · Revisão e aceite</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Contrato Fictício</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">Confira a proposta antes de simular o aceite do contratante.</p>
        <div className="mt-6">{summary()}</div>
        <div className="mt-5 rounded-xl border border-white/10 bg-[#101010]/40 p-4 text-sm leading-relaxed text-white/65">
          <h2 className="mb-2 font-semibold text-white/85">Condições desta simulação</h2>
          <p>Esta tela demonstra como os detalhes de uma apresentação poderiam ser organizados entre contratante e artista. Datas, horários, valores e condições acima são uma proposta de exemplo, sujeita a conversa e confirmação de ambas as partes.</p>
          <p className="mt-2">Este protótipo não produz documento contratual, não verifica identidade, não processa pagamentos e não registra consentimentos em um sistema.</p>
          <h3 className="mb-1 mt-4 font-semibold text-white/85">Dados e privacidade nesta demonstração</h3>
          <p>As informações digitadas servem apenas para montar este resumo temporário. Não inclua dados pessoais ou sensíveis; a proposta não é enviada nem gravada no sistema.</p>
        </div>
        <div className="mt-4"><CheckOption tone={simulationRole} checked={buyerAccepted} onChange={setBuyerAccepted}>Li os detalhes e aceito continuar com esta proposta fictícia.</CheckOption></div>
        <button type="button" disabled={!buyerAccepted} onClick={simulateProposalSend} className={`mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45 ${primaryActionClass}`}>Gerar contrato e notificar o artista <ArrowRight className="size-4" /></button>
      </section>}

      {stage === "artist" && <section className={`rounded-2xl border p-5 sm:p-7 ${rolePanelClass}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${roleAccentTextClass}`}>Etapa 3 · Resposta do artista</p>
        <h1 className="mt-2 text-2xl font-bold">{artist.name}, você aceita a proposta?</h1>
        <p className="mt-2 text-sm text-white/55">{isOwnProfile ? "Você está analisando a proposta recebida pelo seu próprio perfil. O aceite atualizará a simulação e gerará uma nova notificação." : "Simule o outro lado do fluxo: aceitar as condições ou pedir um ajuste."}</p>
        <div className="mt-5">{summary()}</div>
        <div className="mt-4"><CheckOption tone={simulationRole} checked={artistAccepted} onChange={setArtistAccepted}>Confirmo, como artista, que aceito os detalhes desta proposta fictícia.</CheckOption></div>
        <button type="button" disabled={!artistAccepted} onClick={acceptContract} className={`mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45 ${primaryActionClass}`}>Aceitar contrato fictício <Check className="size-4" /></button>
        <div className="my-5 border-t border-white/10" />
        <Field label="Ou descreva um ajuste para a proposta"><textarea value={changeRequest} onChange={(event) => setChangeRequest(event.target.value)} maxLength={800} rows={3} wrap="soft" placeholder="Ex.: preciso alterar o horário de chegada para 90 minutos antes" className="min-w-0 w-full resize-y break-words rounded-xl border border-white/10 bg-[#101010]/70 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20 [overflow-wrap:anywhere]" /></Field>
        <button type="button" disabled={!changeRequest.trim()} onClick={requestAdjustment} className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/15 text-sm font-semibold text-white/80 transition hover:border-[#BA3BE7] hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Solicitar ajuste ao contratante</button>
      </section>}

      {stage === "adjustment" && <section className={`rounded-2xl border p-5 sm:p-7 ${rolePanelClass}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${roleAccentTextClass}`}>Contraproposta fictícia</p>
        <h1 className="mt-2 text-2xl font-bold">O artista sugeriu um ajuste</h1>
        <p className="mt-2 text-sm text-white/55">Em um fluxo real, o contratante poderia responder ou negociar novamente.</p>
        <blockquote className="mt-5 min-w-0 max-w-full break-words whitespace-pre-wrap rounded-xl border-l-2 border-[#3EA6FF] bg-[#101010]/50 p-4 text-sm leading-relaxed text-white/75 [overflow-wrap:anywhere]">“{changeRequest}”</blockquote>
        <div className="mt-5">{summary()}</div>
        <button type="button" onClick={acceptAdjustment} className={`mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition ${primaryActionClass}`}>Aceitar ajuste e preparar pagamento <Check className="size-4" /></button>
        <button type="button" onClick={() => setStage("details")} className="mt-2 h-11 w-full rounded-xl border border-white/15 text-sm text-white/70 transition hover:bg-white/5">Voltar e alterar proposta</button>
      </section>}

      {stage === "payment" && <section className={`rounded-2xl border p-5 sm:p-7 ${rolePanelClass}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${roleAccentTextClass}`}>Etapa 3 · Pagamento protegido</p>
        <h1 className="mt-2 text-2xl font-bold">Pagamento via Fluxo escrow</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">O artista aceitou o contrato. Agora você está simulando o contratante pagando ao aplicativo antes do evento.</p>
        <div className="mt-5">{summary()}</div>
        <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-sm leading-relaxed text-amber-50/80"><strong>Pagamento fictício.</strong> Nenhuma cobrança será feita e nenhum valor será transferido ou retido nesta demonstração.</div>
        <div className="mt-4"><CheckOption tone={simulationRole} checked={paymentConfirmed} onChange={setPaymentConfirmed}>Confirmo o pagamento simulado de {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(draft.fee))} para continuar.</CheckOption></div>
        <button type="button" disabled={!paymentConfirmed} onClick={confirmPayment} className={`mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45 ${primaryActionClass}`}>Pagar ao aplicativo e liberar check-ins <ArrowRight className="size-4" /></button>
      </section>}

      {stage === "checkin" && <section className={`rounded-2xl border p-5 sm:p-7 ${rolePanelClass}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${roleAccentTextClass}`}>Etapa 4 · Dia do evento</p>
        <h1 className="mt-2 text-2xl font-bold">Check-in do {simulationRole === "contractor" ? "contratante" : "artista"}</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">Os dois participantes precisam confirmar presença. O evento só será finalizado quando ambos fizerem o check-in.</p>
        <div className="mt-5">{summary()}</div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className={`rounded-xl border p-3 text-sm ${storedSimulation?.contractorCheckedIn ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-black/15 text-white/55"}`}><strong className="block text-white/85">Contratante</strong>{storedSimulation?.contractorCheckedIn ? "Check-in confirmado" : "Aguardando confirmação"}</div>
          <div className={`rounded-xl border p-3 text-sm ${storedSimulation?.artistCheckedIn ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-black/15 text-white/55"}`}><strong className="block text-white/85">Artista</strong>{storedSimulation?.artistCheckedIn ? "Check-in confirmado" : "Aguardando confirmação"}</div>
        </div>
        {((simulationRole === "contractor" && storedSimulation?.contractorCheckedIn) || (simulationRole === "artist" && storedSimulation?.artistCheckedIn))
          ? <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">Seu check-in já foi confirmado. Volte ao início e aguarde a outra parte.</div>
          : <><div className="mt-4"><CheckOption tone={simulationRole} checked={checkinConfirmed} onChange={setCheckinConfirmed}>Confirmo minha presença como {simulationRole === "contractor" ? "contratante" : "artista"} neste evento fictício.</CheckOption></div>
            <button type="button" disabled={!checkinConfirmed} onClick={confirmCheckin} className={`mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45 ${primaryActionClass}`}>Confirmar meu check-in <ArrowRight className="size-4" /></button></>}
      </section>}

      {stage === "review" && <section className={`rounded-2xl border p-5 sm:p-7 ${rolePanelClass}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${roleAccentTextClass}`}>Etapa 5 · Evento finalizado</p>
        <h1 className="mt-2 text-2xl font-bold">{simulationRole === "contractor" ? `Como foi o show de ${artist.name}?` : "Como foi a experiência com o contratante?"}</h1>
        <p className="mt-2 text-sm text-white/55">Os dois check-ins foram confirmados. Esta avaliação pertence somente ao fluxo fictício.</p>
        <div className="mt-6 flex items-center justify-center gap-2" role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            return <button key={value} type="button" onClick={() => setReviewRating(value)} role="radio" aria-checked={reviewRating === value} aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`} className={`rounded-lg p-1 text-amber-300 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 ${isContractorSimulation ? "focus-visible:outline-[#3EA6FF]" : "focus-visible:outline-[#BA3BE7]"}`}><Star className={`size-9 ${value <= reviewRating ? "fill-current" : "fill-transparent"}`} /></button>;
          })}
        </div>
        <p className="mt-2 text-center text-sm font-semibold text-amber-100">{reviewRating} de 5 estrelas</p>
        <div className="mt-6"><Field label="Comentário (opcional)"><textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} rows={4} maxLength={800} wrap="soft" placeholder="Conte como foi a experiência" className={`min-w-0 w-full resize-y break-words rounded-xl border border-white/10 bg-[#101010]/70 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/30 [overflow-wrap:anywhere] ${isContractorSimulation ? "focus:border-[#3EA6FF] focus:ring-2 focus:ring-[#3EA6FF]/20" : "focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20"}`} /></Field></div>
        <button type="button" onClick={saveDemoReview} className={`mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition ${primaryActionClass}`}>Enviar avaliação fictícia <ArrowRight className="size-4" /></button>
      </section>}

      {stage === "complete" && <section className={`rounded-2xl border p-6 text-center sm:p-10 ${rolePanelClass}`}>
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-200"><Check className="size-8" /></span>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">Fluxo concluído</p>
        <h1 className="mt-2 text-2xl font-bold">Esta participação já foi avaliada</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">O contrato, o pagamento, os dois check-ins e as avaliações ficaram registrados nesta simulação.</p>
        <button type="button" onClick={() => router.push("/")} className={`mt-6 inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition ${primaryActionClass}`}>Voltar para o início <ArrowRight className="size-4" /></button>
      </section>}
    </main>
  </div>;
}
