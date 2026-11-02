/**
 * Sample-only financial data. Keep the simulation isolated from payment APIs,
 * bank accounts, balances and production contract records.
 */
export type SimulatedTransactionStatus = "released" | "in_escrow" | "upcoming" | "expense";

export type SimulatedTransaction = {
  id: string;
  title: string;
  counterparty: string;
  amountInCents: number;
  dateLabel: string;
  status: SimulatedTransactionStatus;
};

export const FINANCIAL_SIMULATION = {
  balanceInCents: 485000,
  receivedThisMonthInCents: 235000,
  awaitingPaymentInCents: 125000,
  escrowPreviewInCents: 80000,
  upcomingPaymentsCount: 2,
  nextPaymentDateLabel: "05 nov",
  transactions: [
    {
      id: "sample-show-aurora",
      title: "Cachê recebido",
      counterparty: "Casa Aurora",
      amountInCents: 180000,
      dateLabel: "02 nov · 09:42",
      status: "released",
    },
    {
      id: "sample-escrow-studio",
      title: "Em garantia simulada",
      counterparty: "Estúdio 8",
      amountInCents: 80000,
      dateLabel: "01 nov · 15:10",
      status: "in_escrow",
    },
    {
      id: "sample-expense-travel",
      title: "Despesa de locomoção",
      counterparty: "Exemplo demonstrativo",
      amountInCents: -35000,
      dateLabel: "30 out · 18:15",
      status: "expense",
    },
  ] satisfies SimulatedTransaction[],
} as const;

export const ESCROW_PREVIEW_STEPS = [
  { id: "contract", title: "Contrato aceito", description: "As duas partes confirmam os detalhes do evento." },
  { id: "deposit", title: "Pagamento protegido", description: "Etapa futura: o contratante deposita o valor na plataforma." },
  { id: "checkin", title: "Show e check-in", description: "A realização do evento é registrada pelas partes." },
  { id: "release", title: "Liberação do cachê", description: "Etapa futura: o valor é liberado conforme as regras do contrato." },
] as const;

export function formatSimulatedCurrency(amountInCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountInCents / 100);
}
