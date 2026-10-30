"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CircleAlert, Clock3, MapPin, Star } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { useToast } from "@/components/providers/app-providers";
import { dateKey } from "@/lib/availability";

type Artist = { id: string; name: string; genre: string; imageUrl: string };
type Stage = "details" | "contract" | "sent" | "artist" | "adjustment" | "checkin" | "review";
type Draft = {
  eventTitle: string; eventDate: string; startTime: string; endTime: string; venueName: string; venueAddress: string; venueType: string;
  performanceMinutes: string; arrivalMinutes: string; fee: string; transportationByArtist: boolean; mealProvided: boolean;
  lodgingProvided: boolean; soundCheck: boolean; equipmentProvided: boolean; dateConfirmed: boolean; timeConfirmed: boolean;
  venueConfirmed: boolean; extraTerms: string;
};

const steps = ["Proposta", "Aceite", "Artista", "Check-in", "Avaliação"];
const inputClass = "h-12 w-full rounded-xl border border-white/10 bg-[#101010]/70 px-3.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20";

function initialDraft(): Draft {
  return {
    eventTitle: "", eventDate: "", startTime: "", endTime: "", venueName: "", venueAddress: "", venueType: "Espaço de eventos",
    performanceMinutes: "90", arrivalMinutes: "60", fee: "", transportationByArtist: false, mealProvided: false,
    lodgingProvided: false, soundCheck: true, equipmentProvided: true, dateConfirmed: false, timeConfirmed: false, venueConfirmed: false, extraTerms: "",
  };
}

function formatEventDate(value: string) {
  if (!value) return "A definir";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-white/80">{label}</span>{children}</label>;
}

function CheckOption({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition ${checked ? "border-[#BA3BE7]/50 bg-[#6C1EE7]/15 text-white" : "border-white/10 bg-[#101010]/35 text-white/70 hover:border-white/20"}`}>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
    <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-[#BA3BE7] bg-[#6C1EE7] text-white" : "border-white/25 text-transparent"}`}><Check className="size-3.5" /></span>
    <span>{children}</span>
  </label>;
}

export function ContractDemoFlow({ artist }: { artist: Artist }) {
  const [stage, setStage] = useState<Stage>("details");
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [buyerAccepted, setBuyerAccepted] = useState(false);
  const [artistAccepted, setArtistAccepted] = useState(false);
  const [changeRequest, setChangeRequest] = useState("");
  const [checkinConfirmed, setCheckinConfirmed] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const stageIndex = stage === "details" ? 0 : stage === "contract" ? 1 : stage === "sent" || stage === "artist" || stage === "adjustment" ? 2 : stage === "checkin" ? 3 : 4;

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.dateConfirmed || !draft.timeConfirmed || !draft.venueConfirmed) {
      toast("Confirme a data, o horário e o local para continuar.", "error");
      return;
    }
    if (draft.endTime && draft.endTime <= draft.startTime) {
      toast("O horário de término precisa ser depois do início.", "error");
      return;
    }
    setStage("contract");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveDemoReview() {
    try {
      sessionStorage.setItem("tocala-demo-contract-review", JSON.stringify({ artistId: artist.id, rating: reviewRating, comment: reviewComment.trim() }));
    } catch {
      toast("Não foi possível mostrar a avaliação simulada neste navegador.", "error");
      return;
    }
    router.push(`/perfil?artista=${encodeURIComponent(artist.id)}&avaliacaoDemo=1`);
  }

  const canGoBack = stage !== "details";
  function goBack() {
    const previous: Record<Exclude<Stage, "details">, Stage> = {
      contract: "details", sent: "contract", artist: "sent", adjustment: "artist", checkin: "artist", review: "checkin",
    };
    if (canGoBack) setStage(previous[stage as Exclude<Stage, "details">]);
    else router.back();
  }

  function summary() {
    return <div className="space-y-3 rounded-2xl border border-white/10 bg-[#151517] p-4 sm:p-5">
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <Image src={artist.imageUrl} alt="" width={48} height={48} unoptimized className="size-12 rounded-xl object-cover" />
        <div><p className="font-semibold">{artist.name}</p><p className="mt-0.5 text-xs text-white/50">{artist.genre}</p></div>
      </div>
      <h3 className="font-semibold">{draft.eventTitle || "Apresentação musical"}</h3>
      <p className="flex items-start gap-2 text-sm text-white/65"><CalendarDays className="mt-0.5 size-4 shrink-0 text-[#D6A0FF]" />{formatEventDate(draft.eventDate)}</p>
      <p className="flex items-start gap-2 text-sm text-white/65"><Clock3 className="mt-0.5 size-4 shrink-0 text-[#D6A0FF]" />{draft.startTime || "Horário a definir"}{draft.endTime ? `–${draft.endTime}` : ""} · {draft.performanceMinutes} min</p>
      <p className="flex items-start gap-2 text-sm text-white/65"><MapPin className="mt-0.5 size-4 shrink-0 text-[#D6A0FF]" />{draft.venueName || "Local a definir"}{draft.venueAddress ? ` · ${draft.venueAddress}` : ""}</p>
      <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-white/55">
        <span>Chegada: {draft.arrivalMinutes} min antes</span><span>Tipo: {draft.venueType}</span>
        {draft.fee && <span>Valor proposto: R$ {Number(draft.fee).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>}
      </div>
      <ul className="space-y-1 border-t border-white/10 pt-3 text-xs text-white/55">
        <li>Locomoção por conta do artista: {draft.transportationByArtist ? "Sim" : "Não"}</li>
        <li>Alimentação fornecida: {draft.mealProvided ? "Sim" : "Não"}</li>
        <li>Hospedagem fornecida: {draft.lodgingProvided ? "Sim" : "Não"}</li>
        <li>Passagem de som: {draft.soundCheck ? "Sim" : "Não"}</li>
        <li>Equipamento de som no local: {draft.equipmentProvided ? "Sim" : "Não"}</li>
      </ul>
      {draft.extraTerms && <p className="border-t border-white/10 pt-3 text-xs leading-relaxed text-white/55">Outras informações: {draft.extraTerms}</p>}
    </div>;
  }

  return <div className="min-h-dvh bg-[#101010] text-white">
    <header className="border-b border-white/10 bg-[#1A1A1A]/90 backdrop-blur-xl">
      <div className="relative mx-auto flex h-[calc(env(safe-area-inset-top)+72px)] max-w-[1040px] items-center justify-between px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:h-20 lg:pt-0">
        <button type="button" onClick={goBack} className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75 transition hover:border-[#BA3BE7] hover:text-white" aria-label="Voltar"><ArrowLeft className="size-5" /></button>
        <div className="absolute left-1/2 -translate-x-1/2 lg:static lg:ml-4 lg:translate-x-0"><Brand compact /></div>
        <span className="rounded-lg border border-amber-300/20 bg-amber-300/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-100">Simulação</span>
      </div>
    </header>
    <main className="mx-auto max-w-[760px] px-4 pb-14 pt-6 sm:px-6 sm:pt-9">
      <ol className="mb-6 grid grid-cols-5 gap-1" aria-label="Etapas da contratação fictícia">
        {steps.map((label, index) => <li key={label} className={`border-b-2 pb-2 text-center text-[9px] font-medium sm:text-[11px] ${index <= stageIndex ? "border-[#BA3BE7] text-[#E4C9FF]" : "border-white/10 text-white/35"}`}>{label}</li>)}
      </ol>
      <div className="mb-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] p-3.5 text-xs leading-relaxed text-amber-50/80">
        <p className="flex items-start gap-2"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-200" /><span><strong>Contrato Fictício.</strong> Esta demonstração não envia propostas, não coleta assinatura eletrônica e não salva contratos no Supabase.</span></p>
      </div>

      {stage === "details" && <section className="rounded-2xl border border-white/10 bg-[#222226] p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D6A0FF]">Etapa 1 · Detalhes do evento</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Criar proposta para {artist.name}</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">Preencha as condições que gostaria de combinar para a apresentação.</p>
        <form onSubmit={submitDetails} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Nome ou tipo do evento"><input required value={draft.eventTitle} onChange={(event) => update("eventTitle", event.target.value)} maxLength={100} placeholder="Ex.: Festa de aniversário da empresa" className={inputClass} /></Field></div>
            <Field label="Dia do evento"><input type="date" required min={dateKey(new Date())} value={draft.eventDate} onChange={(event) => update("eventDate", event.target.value)} className={inputClass} /></Field>
            <Field label="Tipo de local"><select value={draft.venueType} onChange={(event) => update("venueType", event.target.value)} className={inputClass}><option>Espaço de eventos</option><option>Bar ou restaurante</option><option>Evento corporativo</option><option>Festa particular</option><option>Festival</option><option>Outro</option></select></Field>
            <Field label="Horário de início"><input type="time" required value={draft.startTime} onChange={(event) => update("startTime", event.target.value)} className={inputClass} /></Field>
            <Field label="Horário de término (opcional)"><input type="time" value={draft.endTime} onChange={(event) => update("endTime", event.target.value)} className={inputClass} /></Field>
            <Field label="Duração da apresentação (min)"><input type="number" min="15" max="600" required value={draft.performanceMinutes} onChange={(event) => update("performanceMinutes", event.target.value)} className={inputClass} /></Field>
            <Field label="Chegar quantos minutos antes?"><input type="number" min="0" max="720" required value={draft.arrivalMinutes} onChange={(event) => update("arrivalMinutes", event.target.value)} className={inputClass} /></Field>
            <div className="sm:col-span-2"><Field label="Nome do local"><input required value={draft.venueName} onChange={(event) => update("venueName", event.target.value)} maxLength={120} placeholder="Nome da casa ou do espaço" className={inputClass} /></Field></div>
            <div className="sm:col-span-2"><Field label="Endereço completo"><input required value={draft.venueAddress} onChange={(event) => update("venueAddress", event.target.value)} maxLength={240} placeholder="Rua, número, cidade e estado" className={inputClass} /></Field></div>
            <Field label="Valor proposto (R$, opcional)"><input type="number" min="0" step="0.01" value={draft.fee} onChange={(event) => update("fee", event.target.value)} placeholder="0,00" className={inputClass} /></Field>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-white/85">Estrutura e logística</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <CheckOption checked={draft.transportationByArtist} onChange={(value) => update("transportationByArtist", value)}>Locomoção até o evento por conta do artista</CheckOption>
              <CheckOption checked={draft.mealProvided} onChange={(value) => update("mealProvided", value)}>Contratante fornece alimentação</CheckOption>
              <CheckOption checked={draft.lodgingProvided} onChange={(value) => update("lodgingProvided", value)}>Contratante fornece hospedagem</CheckOption>
              <CheckOption checked={draft.soundCheck} onChange={(value) => update("soundCheck", value)}>Incluir passagem de som antes do show</CheckOption>
              <CheckOption checked={draft.equipmentProvided} onChange={(value) => update("equipmentProvided", value)}>Som e equipamentos básicos no local</CheckOption>
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-white/85">Confirmações da proposta</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              <CheckOption checked={draft.dateConfirmed} onChange={(value) => update("dateConfirmed", value)}>Data confirmada</CheckOption>
              <CheckOption checked={draft.timeConfirmed} onChange={(value) => update("timeConfirmed", value)}>Horário confirmado</CheckOption>
              <CheckOption checked={draft.venueConfirmed} onChange={(value) => update("venueConfirmed", value)}>Local confirmado</CheckOption>
            </div>
          </div>
          <Field label="Outras condições ou observações (opcional)"><textarea value={draft.extraTerms} onChange={(event) => update("extraTerms", event.target.value)} maxLength={1200} rows={3} placeholder="Detalhes adicionais para conversar com o artista" className="w-full resize-y rounded-xl border border-white/10 bg-[#101010]/70 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" /></Field>
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6C1EE7] px-5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7]">Revisar contrato fictício <ArrowRight className="size-4" /></button>
        </form>
      </section>}

      {stage === "contract" && <section className="rounded-2xl border border-white/10 bg-[#222226] p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D6A0FF]">Etapa 2 · Revisão e aceite</p>
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
        <div className="mt-4"><CheckOption checked={buyerAccepted} onChange={setBuyerAccepted}>Li os detalhes e aceito continuar com esta proposta fictícia.</CheckOption></div>
        <button type="button" disabled={!buyerAccepted} onClick={() => setStage("sent")} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6C1EE7] px-5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7] disabled:cursor-not-allowed disabled:opacity-45">Aceitar e simular envio ao artista <ArrowRight className="size-4" /></button>
      </section>}

      {stage === "sent" && <section className="rounded-2xl border border-white/10 bg-[#222226] p-6 text-center sm:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-200"><Check className="size-8" /></span>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">Envio simulado</p>
        <h1 className="mt-2 text-2xl font-bold">Proposta preparada para {artist.name}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">Em uma versão futura, a proposta seria encaminhada ao artista para aceite ou contraproposta. Por enquanto, você pode simular a resposta aqui.</p>
        <div className="mx-auto mt-6 max-w-lg text-left">{summary()}</div>
        <button type="button" onClick={() => setStage("artist")} className="mt-6 inline-flex h-12 w-full max-w-lg items-center justify-center gap-2 rounded-xl bg-[#6C1EE7] px-5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7]">Simular resposta do artista <ArrowRight className="size-4" /></button>
      </section>}

      {stage === "artist" && <section className="rounded-2xl border border-white/10 bg-[#222226] p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D6A0FF]">Etapa 3 · Resposta do artista</p>
        <h1 className="mt-2 text-2xl font-bold">{artist.name}, você aceita a proposta?</h1>
        <p className="mt-2 text-sm text-white/55">Simule o outro lado do fluxo: aceitar as condições ou pedir um ajuste.</p>
        <div className="mt-5">{summary()}</div>
        <div className="mt-4"><CheckOption checked={artistAccepted} onChange={setArtistAccepted}>Confirmo, como artista, que aceito os detalhes desta proposta fictícia.</CheckOption></div>
        <button type="button" disabled={!artistAccepted} onClick={() => setStage("checkin")} className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6C1EE7] px-5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7] disabled:cursor-not-allowed disabled:opacity-45">Aceitar contrato fictício <Check className="size-4" /></button>
        <div className="my-5 border-t border-white/10" />
        <Field label="Ou descreva um ajuste para a proposta"><textarea value={changeRequest} onChange={(event) => setChangeRequest(event.target.value)} maxLength={800} rows={3} placeholder="Ex.: preciso alterar o horário de chegada para 90 minutos antes" className="w-full resize-y rounded-xl border border-white/10 bg-[#101010]/70 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" /></Field>
        <button type="button" disabled={!changeRequest.trim()} onClick={() => setStage("adjustment")} className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/15 text-sm font-semibold text-white/80 transition hover:border-[#BA3BE7] hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Solicitar ajuste</button>
      </section>}

      {stage === "adjustment" && <section className="rounded-2xl border border-white/10 bg-[#222226] p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D6A0FF]">Contraproposta fictícia</p>
        <h1 className="mt-2 text-2xl font-bold">O artista sugeriu um ajuste</h1>
        <p className="mt-2 text-sm text-white/55">Em um fluxo real, o contratante poderia responder ou negociar novamente.</p>
        <blockquote className="mt-5 rounded-xl border-l-2 border-[#BA3BE7] bg-[#101010]/50 p-4 text-sm leading-relaxed text-white/75">“{changeRequest}”</blockquote>
        <div className="mt-5">{summary()}</div>
        <button type="button" onClick={() => { update("extraTerms", [draft.extraTerms, `Ajuste simulado aceito: ${changeRequest}`].filter(Boolean).join("\n")); setArtistAccepted(true); setStage("checkin"); }} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6C1EE7] px-5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7]">Simular aceite do ajuste <Check className="size-4" /></button>
        <button type="button" onClick={() => setStage("details")} className="mt-2 h-11 w-full rounded-xl border border-white/15 text-sm text-white/70 transition hover:bg-white/5">Voltar e alterar proposta</button>
      </section>}

      {stage === "checkin" && <section className="rounded-2xl border border-white/10 bg-[#222226] p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D6A0FF]">Etapa 4 · Dia do evento</p>
        <h1 className="mt-2 text-2xl font-bold">Check-in no show</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">Esta tela é apenas demonstrativa. Em uma versão futura, poderia confirmar a chegada do artista no local.</p>
        <div className="mt-5">{summary()}</div>
        <div className="mt-4"><CheckOption checked={checkinConfirmed} onChange={setCheckinConfirmed}>Confirmo o check-in fictício para continuar à avaliação.</CheckOption></div>
        <button type="button" disabled={!checkinConfirmed} onClick={() => setStage("review")} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6C1EE7] px-5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7] disabled:cursor-not-allowed disabled:opacity-45">Continuar para avaliação <ArrowRight className="size-4" /></button>
      </section>}

      {stage === "review" && <section className="rounded-2xl border border-white/10 bg-[#222226] p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D6A0FF]">Etapa 5 · Avaliação</p>
        <h1 className="mt-2 text-2xl font-bold">Como foi o show de {artist.name}?</h1>
        <p className="mt-2 text-sm text-white/55">A avaliação ficará visível apenas nesta simulação, neste navegador.</p>
        <div className="mt-6 flex items-center justify-center gap-2" role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            return <button key={value} type="button" onClick={() => setReviewRating(value)} role="radio" aria-checked={reviewRating === value} aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`} className="rounded-lg p-1 text-amber-300 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]"><Star className={`size-9 ${value <= reviewRating ? "fill-current" : "fill-transparent"}`} /></button>;
          })}
        </div>
        <p className="mt-2 text-center text-sm font-semibold text-amber-100">{reviewRating} de 5 estrelas</p>
        <div className="mt-6"><Field label="Comentário (opcional)"><textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} rows={4} maxLength={800} placeholder="Conte o que achou da apresentação" className="w-full resize-y rounded-xl border border-white/10 bg-[#101010]/70 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" /></Field></div>
        <button type="button" onClick={saveDemoReview} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6C1EE7] px-5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7]">Enviar avaliação simulada e abrir perfil <ArrowRight className="size-4" /></button>
      </section>}
    </main>
  </div>;
}
