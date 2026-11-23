"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mic2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  ESCROW_PREVIEW_STEPS,
  FINANCIAL_SIMULATION,
  formatSimulatedCurrency,
} from "@/lib/financial-simulation";

function SimulatedAmount({ amountInCents, hidden = false }: { amountInCents: number; hidden?: boolean }) {
  if (hidden) return <span aria-label="Valor oculto">••••••</span>;
  const amount = formatSimulatedCurrency(Math.abs(amountInCents));
  return <span>{amountInCents < 0 ? `− ${amount}` : amount}</span>;
}

export function FinancialDashboard() {
  const [balanceHidden, setBalanceHidden] = useState(false);

  return (
    <main className="mx-auto max-w-[1120px] px-4 pb-28 pt-[calc(env(safe-area-inset-top)+132px)] sm:px-6 lg:px-8 lg:pb-16 lg:pt-32">
      <div className="-mx-4 mb-6 flex items-center justify-between bg-[#6C1EE7] px-5 py-3.5 sm:-mx-6 sm:px-7 lg:mx-0 lg:mb-8 lg:bg-transparent lg:px-0 lg:py-0">
        <h1 className="text-2xl font-bold tracking-tight lg:text-4xl">Financeiro</h1>
        <Wallet className="size-6 text-white/90 lg:hidden" aria-hidden="true" />
        <p className="hidden rounded-full border border-[#BA3BE7]/40 bg-[#6C1EE7]/10 px-4 py-2 text-sm font-semibold text-[#D6A0FF] lg:block">Painel demonstrativo</p>
      </div>

      <div role="note" className="mb-5 flex items-start gap-3 rounded-2xl border border-[#FCB83D]/25 bg-[#FCB83D]/[0.08] px-4 py-3.5 text-sm leading-relaxed text-white/75 lg:mb-7">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FCB83D]/15 text-xs font-bold text-[#FCB83D]" aria-hidden="true">i</span>
        <p><strong className="font-semibold text-white">Simulação visual.</strong> Todos os valores e movimentações desta tela são fictícios. Nenhum pagamento, saldo real ou transferência está ativo.</p>
      </div>

      <section aria-label="Resumo simulado" className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-5">
        <article className="rounded-[26px] border border-white/10 bg-gradient-to-br from-[#30163D] via-[#211B26] to-[#1A1A1A] p-5 shadow-xl shadow-black/20 sm:p-7 lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/70 sm:text-base">Saldo disponível simulado</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#D6A0FF]">Sem valor financeiro real</p>
            </div>
            <button type="button" onClick={() => setBalanceHidden((value) => !value)} className="flex size-10 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7]" aria-label={balanceHidden ? "Mostrar valor simulado" : "Ocultar valor simulado"}>
              {balanceHidden ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          <p className="mt-1 text-[clamp(2.4rem,9vw,3.5rem)] font-bold leading-tight tracking-[-0.05em] sm:text-6xl" aria-live="polite">
            <SimulatedAmount amountInCents={FINANCIAL_SIMULATION.balanceInCents} hidden={balanceHidden} />
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/60 sm:text-base">
            <ArrowUpRight className="size-5 text-[#FCB83D]" aria-hidden="true" />
            <span><SimulatedAmount amountInCents={FINANCIAL_SIMULATION.receivedThisMonthInCents} hidden={balanceHidden} /> recebidos neste mês (simulação)</span>
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <a href="#atividade" className="group flex min-h-[112px] items-center gap-4 rounded-[22px] border border-white/10 bg-[#1B1B1B] p-4 transition hover:border-[#BA3BE7]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7] sm:p-5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#6C1EE7]/20 text-[#D6A0FF]"><Wallet className="size-7" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-white/60">A receber (simulado)</span>
              <span className="mt-1 block text-xl font-bold"><SimulatedAmount amountInCents={FINANCIAL_SIMULATION.awaitingPaymentInCents} hidden={balanceHidden} /></span>
              <span className="mt-1 block text-xs text-white/45">{FINANCIAL_SIMULATION.upcomingPaymentsCount} cachês · previsão {FINANCIAL_SIMULATION.nextPaymentDateLabel}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-[#D6A0FF] transition group-hover:translate-x-0.5" aria-hidden="true" />
          </a>

          <a href="#escrow" className="group flex min-h-[112px] items-center gap-4 rounded-[22px] border border-[#BA3BE7]/20 bg-[#251A2B] p-4 transition hover:border-[#BA3BE7]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#BA3BE7] sm:p-5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#6C1EE7]/30 text-[#D6A0FF]"><LockKeyhole className="size-6" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-white/60">Em fluxo de garantia</span>
              <span className="mt-1 block text-xl font-bold"><SimulatedAmount amountInCents={FINANCIAL_SIMULATION.escrowPreviewInCents} hidden={balanceHidden} /></span>
              <span className="mt-1 block text-xs text-[#D6A0FF]/75">Prévia fictícia do escrow</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-[#D6A0FF] transition group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>
      </section>

      <section id="atividade" className="mt-9 scroll-mt-28 lg:mt-12">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#BA3BE7]">Exemplos fictícios</p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">Atividade recente</h2>
          </div>
          <span className="pb-0.5 text-xs font-medium text-white/45">Demonstração</span>
        </div>
        <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#171717] px-4 sm:px-6">
          {FINANCIAL_SIMULATION.transactions.map((transaction) => {
            const isIncoming = transaction.amountInCents > 0;
            const isEscrow = transaction.status === "in_escrow";
            const Icon = isEscrow ? ShieldCheck : isIncoming ? Mic2 : ArrowUpRight;
            return (
              <article key={transaction.id} className="flex items-center gap-3 py-4 sm:gap-4 sm:py-5">
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${isEscrow ? "bg-[#6C1EE7]/25 text-[#D6A0FF]" : isIncoming ? "bg-[#6C1EE7]/20 text-[#D6A0FF]" : "bg-white/[0.06] text-white/50"}`}><Icon className="size-5" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {transaction.title}
                    <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/45">fictício</span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-white/50 sm:text-sm">{transaction.counterparty} · {transaction.dateLabel}</span>
                </span>
                <span className={`shrink-0 text-right text-sm font-bold sm:text-base ${isIncoming ? "text-[#D6A0FF]" : "text-white/85"}`}><SimulatedAmount amountInCents={transaction.amountInCents} hidden={balanceHidden} /></span>
              </article>
            );
          })}
        </div>
      </section>

      <section id="escrow" className="mt-9 scroll-mt-28 rounded-[24px] border border-[#711EC9]/45 bg-gradient-to-br from-[#21152A] to-[#151515] p-5 sm:p-7 lg:mt-12 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D6A0FF]">Planejamento futuro</p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">Como funcionará o fluxo escrow</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">A tela já organiza as etapas esperadas para contratos e pagamentos protegidos. O depósito, a custódia e a liberação ainda não estão implementados.</p>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-[#FCB83D]/25 bg-[#FCB83D]/10 px-3 py-1.5 text-xs font-semibold text-[#FCB83D]"><LockKeyhole className="size-3.5" aria-hidden="true" />Ainda indisponível</span>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ESCROW_PREVIEW_STEPS.map((step, index) => (
            <li key={step.id} className="relative rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-[#6C1EE7]/25 text-xs font-bold text-[#D6A0FF]">{index < 1 ? <Check className="size-4" /> : index + 1}</span>
                <span className="text-sm font-semibold">{step.title}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/50">{step.description}</p>
              {index < ESCROW_PREVIEW_STEPS.length - 1 && <ArrowRight className="absolute -right-2.5 top-6 z-10 hidden size-4 text-[#BA3BE7] lg:block" aria-hidden="true" />}
            </li>
          ))}
        </ol>
        <p className="mt-5 flex items-center gap-2 text-xs text-white/45"><CalendarClock className="size-4 text-[#BA3BE7]" aria-hidden="true" />Os dados desta demonstração ficam isolados em um módulo e não são persistidos.</p>
      </section>
    </main>
  );
}
