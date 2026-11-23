"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, FilePlus2, FileText, MapPin } from "lucide-react";
import { CONTRACT_SIMULATIONS_CHANGE_EVENT, listContractSimulations, type ContractSimulationRole, type ContractSimulationStatus, type StoredContractSimulation } from "@/lib/contract-simulations";

type ContractBucket = "active" | "analysis" | "progress" | "completed";

const bucketContent: Array<{ id: ContractBucket; title: string; description: string; accent: string }> = [
  { id: "active", title: "Ativos", description: "Contratos aceitos aguardando pagamento", accent: "text-[#8DCAFF]" },
  { id: "analysis", title: "Em análise", description: "Propostas e ajustes aguardando decisão", accent: "text-[#D6A0FF]" },
  { id: "progress", title: "Em progresso", description: "Eventos pagos na etapa de check-in", accent: "text-cyan-200" },
  { id: "completed", title: "Realizados", description: "Eventos finalizados ou avaliados", accent: "text-emerald-200" },
];

const statusLabels: Record<ContractSimulationStatus, string> = {
  pending_artist: "Aguardando análise do artista",
  adjustment_requested: "Ajuste solicitado pelo artista",
  awaiting_payment: "Aceito · pagamento pendente",
  awaiting_checkin: "Pagamento confirmado · check-ins",
  completed: "Evento finalizado · avaliação pendente",
  reviewed: "Evento realizado e avaliado",
};

function bucketFor(status: ContractSimulationStatus): ContractBucket {
  if (status === "pending_artist" || status === "adjustment_requested") return "analysis";
  if (status === "awaiting_payment") return "active";
  if (status === "awaiting_checkin") return "progress";
  return "completed";
}

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "Data a definir";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
}

function contractHref(contract: StoredContractSimulation, role: ContractSimulationRole) {
  return `/contratos/novo?artista=${encodeURIComponent(contract.artistId)}&simulacao=${encodeURIComponent(contract.id)}&papel=${role === "artist" ? "artista" : "contratante"}`;
}

function nextAction(contract: StoredContractSimulation, profileId: string): { label: string; role: ContractSimulationRole } | null {
  const isContractor = contract.contractorId === profileId;
  const isArtist = contract.artistId === profileId;

  if (contract.status === "pending_artist") return isArtist ? { label: "Analisar como artista", role: "artist" } : null;
  if (contract.status === "adjustment_requested") return isContractor ? { label: "Analisar ajuste", role: "contractor" } : null;
  if (contract.status === "awaiting_payment") return isContractor ? { label: "Realizar pagamento", role: "contractor" } : null;
  if (contract.status === "awaiting_checkin") {
    if (isContractor && !contract.contractorCheckedIn) return { label: "Check-in do contratante", role: "contractor" };
    if (isArtist && !contract.artistCheckedIn) return { label: "Check-in do artista", role: "artist" };
    return null;
  }
  if (contract.status === "completed") {
    if (isContractor && !contract.contractorReview) return { label: "Avaliar artista", role: "contractor" };
    if (isArtist && !contract.artistReview) return { label: "Avaliar contratante", role: "artist" };
    return null;
  }
  if (contract.status === "reviewed") return { label: "Ver contrato concluído", role: isContractor ? "contractor" : "artist" };
  return null;
}

function roleLabel(contract: StoredContractSimulation, profileId: string) {
  const roles = [contract.contractorId === profileId && "Contratante", contract.artistId === profileId && "Artista"].filter(Boolean);
  return roles.length === 2 ? "Contratante e artista (simulação própria)" : roles[0] || "Participante";
}

function conditionLabel(value: boolean) {
  return value ? "Sim" : "Não";
}

function ContractCard({ contract, profileId }: { contract: StoredContractSimulation; profileId: string }) {
  const action = nextAction(contract, profileId);
  const isContractorAction = action?.role === "contractor";
  const draft = contract.draft;

  return <article className="overflow-hidden rounded-[22px] border border-white/10 bg-[#1B1B1E] shadow-xl shadow-black/10">
    <div className="border-b border-white/[0.07] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Contrato fictício · {roleLabel(contract, profileId)}</p>
          <h3 className="mt-2 break-words text-xl font-bold tracking-tight text-white [overflow-wrap:anywhere]">{draft.eventTitle || "Apresentação musical"}</h3>
          <p className="mt-1 text-sm text-white/55">{contract.artistName || "Artista contratado"}{contract.artistGenre ? ` · ${contract.artistGenre}` : ""}</p>
        </div>
        <span className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${bucketFor(contract.status) === "completed" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : bucketFor(contract.status) === "progress" ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : bucketFor(contract.status) === "active" ? "border-[#3EA6FF]/30 bg-[#1565C0]/15 text-[#8DCAFF]" : "border-[#BA3BE7]/30 bg-[#6C1EE7]/15 text-[#D6A0FF]"}`}>{statusLabels[contract.status]}</span>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-white/65 sm:grid-cols-2">
        <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-[#D6A0FF]" /><span>{formatDate(draft.eventDate)}</span></p>
        <p className="flex items-start gap-2"><Clock3 className="mt-0.5 size-4 shrink-0 text-[#D6A0FF]" /><span>{draft.startTime || "Horário a definir"}{draft.endTime ? ` às ${draft.endTime}` : ""} · {draft.performanceMinutes} min</span></p>
        <p className="flex items-start gap-2 sm:col-span-2"><MapPin className="mt-0.5 size-4 shrink-0 text-[#D6A0FF]" /><span className="break-words [overflow-wrap:anywhere]">{draft.venueName || "Local a definir"}{draft.venueAddress ? ` · ${draft.venueAddress}` : ""}</span></p>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-white/[0.07] bg-black/15 p-4 sm:grid-cols-3">
        <div><p className="text-[10px] uppercase tracking-wider text-white/35">Valor</p><p className="mt-1 font-semibold text-white">{formatCurrency(draft.fee)}</p></div>
        <div><p className="text-[10px] uppercase tracking-wider text-white/35">Chegada</p><p className="mt-1 font-semibold text-white">{draft.arrivalMinutes} min antes</p></div>
        <div><p className="text-[10px] uppercase tracking-wider text-white/35">Criado em</p><p className="mt-1 font-semibold text-white">{formatCreatedAt(contract.createdAt)}</p></div>
      </div>
    </div>

    <div className="p-5 sm:p-6">
      {contract.status === "awaiting_checkin" && <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <p className={`rounded-xl border p-3 text-xs ${contract.contractorCheckedIn ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" : "border-white/10 text-white/50"}`}><strong className="block text-sm text-white/80">Contratante</strong>{contract.contractorCheckedIn ? "Check-in confirmado" : "Check-in pendente"}</p>
        <p className={`rounded-xl border p-3 text-xs ${contract.artistCheckedIn ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" : "border-white/10 text-white/50"}`}><strong className="block text-sm text-white/80">Artista</strong>{contract.artistCheckedIn ? "Check-in confirmado" : "Check-in pendente"}</p>
      </div>}

      <details className="group rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-white/75 marker:hidden">Ver todas as condições <span className="ml-1 text-[#D6A0FF] group-open:hidden">+</span><span className="ml-1 hidden text-[#D6A0FF] group-open:inline">−</span></summary>
        <div className="mt-4 grid gap-2 border-t border-white/[0.07] pt-4 text-xs leading-relaxed text-white/55 sm:grid-cols-2">
          <p>Tipo de local: <strong className="text-white/75">{draft.venueType}</strong></p>
          <p>Locomoção pelo artista: <strong className="text-white/75">{conditionLabel(draft.transportationByArtist)}</strong></p>
          <p>Alimentação fornecida: <strong className="text-white/75">{conditionLabel(draft.mealProvided)}</strong></p>
          <p>Hospedagem fornecida: <strong className="text-white/75">{conditionLabel(draft.lodgingProvided)}</strong></p>
          <p>Passagem de som: <strong className="text-white/75">{conditionLabel(draft.soundCheck)}</strong></p>
          <p>Equipamento no local: <strong className="text-white/75">{conditionLabel(draft.equipmentProvided)}</strong></p>
          {contract.changeRequest && <p className="break-words sm:col-span-2 [overflow-wrap:anywhere]">Ajuste solicitado: <strong className="text-white/75">{contract.changeRequest}</strong></p>}
          {draft.extraTerms && <p className="break-words sm:col-span-2 [overflow-wrap:anywhere]">Observações: <strong className="whitespace-pre-wrap text-white/75">{draft.extraTerms}</strong></p>}
        </div>
      </details>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/40">{action ? "Próxima etapa disponível" : contract.status === "reviewed" ? "Fluxo concluído" : "Aguardando a outra parte"}</p>
        {action && <Link href={contractHref(contract, action.role)} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition ${isContractorAction ? "bg-[#1565C0] hover:bg-[#1976D2]" : "bg-[#6C1EE7] hover:bg-[#BA3BE7]"}`}>{action.label}<ArrowRight className="size-4" /></Link>}
      </div>
    </div>
  </article>;
}

export function ContractsDashboard({ profileId }: { profileId: string }) {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback);
    window.addEventListener(CONTRACT_SIMULATIONS_CHANGE_EVENT, callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener(CONTRACT_SIMULATIONS_CHANGE_EVENT, callback);
    };
  }, []);
  const getSnapshot = useCallback(() => JSON.stringify(listContractSimulations(profileId)), [profileId]);
  const serialized = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  const contracts = useMemo(() => JSON.parse(serialized) as StoredContractSimulation[], [serialized]);

  return <main className="mx-auto max-w-[1120px] px-4 pb-28 pt-[calc(env(safe-area-inset-top)+132px)] sm:px-6 lg:px-8 lg:pb-16 lg:pt-32">
    <div className="-mx-4 mb-6 flex items-center justify-between bg-[#6C1EE7] px-5 py-3.5 sm:-mx-6 sm:px-7 lg:mx-0 lg:mb-8 lg:bg-transparent lg:px-0 lg:py-0">
      <div><p className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-[#BA3BE7] lg:block">Central de contratações</p><h1 className="text-2xl font-bold tracking-tight lg:mt-2 lg:text-4xl">Meus contratos</h1></div>
      <FileText className="size-6 text-white/90 lg:hidden" aria-hidden="true" />
      <p className="hidden rounded-full border border-[#BA3BE7]/40 bg-[#6C1EE7]/10 px-4 py-2 text-sm font-semibold text-[#D6A0FF] lg:block">{contracts.length} {contracts.length === 1 ? "contrato" : "contratos"}</p>
    </div>

    <div role="note" className="mb-7 flex items-start gap-3 rounded-2xl border border-[#FCB83D]/25 bg-[#FCB83D]/[0.08] px-4 py-3.5 text-sm leading-relaxed text-white/75">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FCB83D]/15 text-xs font-bold text-[#FCB83D]" aria-hidden="true">i</span>
      <p><strong className="font-semibold text-white">Contratos fictícios.</strong> Esta área acompanha somente as simulações criadas neste navegador. Nenhum documento jurídico ou pagamento real é gerado.</p>
    </div>

    <section aria-label="Resumo dos contratos" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {bucketContent.map((bucket) => {
        const count = contracts.filter((contract) => bucketFor(contract.status) === bucket.id).length;
        return <a key={bucket.id} href={`#${bucket.id}`} className="rounded-2xl border border-white/10 bg-[#1B1B1B] p-4 transition hover:border-[#BA3BE7]/40"><span className={`text-2xl font-bold ${bucket.accent}`}>{count}</span><span className="mt-1 block text-sm font-semibold text-white/80">{bucket.title}</span><span className="mt-1 hidden text-xs leading-relaxed text-white/40 sm:block">{bucket.description}</span></a>;
      })}
    </section>

    {contracts.length === 0 ? <section className="mt-8 rounded-[24px] border border-dashed border-white/15 bg-[#171717] px-5 py-14 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#6C1EE7]/15 text-[#D6A0FF]"><FilePlus2 className="size-8" /></span>
      <h2 className="mt-5 text-xl font-bold">Nenhum contrato por enquanto</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/50">Abra um perfil de artista e crie uma proposta fictícia. Ela aparecerá aqui com todas as etapas.</p>
      <Link href="/#explorar" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#6C1EE7] px-5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7]">Explorar artistas<ArrowRight className="size-4" /></Link>
    </section> : <div className="mt-10 space-y-12">
      {bucketContent.map((bucket) => {
        const items = contracts.filter((contract) => bucketFor(contract.status) === bucket.id);
        return <section key={bucket.id} id={bucket.id} className="scroll-mt-28" aria-labelledby={`${bucket.id}-title`}>
          <div className="mb-4 flex items-end justify-between gap-4"><div><h2 id={`${bucket.id}-title`} className="text-xl font-bold sm:text-2xl">{bucket.title}</h2><p className="mt-1 text-sm text-white/45">{bucket.description}</p></div><span className={`text-sm font-semibold ${bucket.accent}`}>{items.length}</span></div>
          {items.length > 0 ? <div className="grid gap-5">{items.map((contract) => <ContractCard key={contract.id} contract={contract} profileId={profileId} />)}</div> : <div className="rounded-2xl border border-dashed border-white/10 px-5 py-7 text-center text-sm text-white/35">Nenhum contrato nesta etapa.</div>}
        </section>;
      })}
    </div>}
  </main>;
}
