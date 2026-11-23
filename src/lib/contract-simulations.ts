export type ContractDraft = {
  eventTitle: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueAddress: string;
  venueType: string;
  performanceMinutes: string;
  arrivalMinutes: string;
  fee: string;
  transportationByArtist: boolean;
  mealProvided: boolean;
  lodgingProvided: boolean;
  soundCheck: boolean;
  equipmentProvided: boolean;
  dateConfirmed: boolean;
  timeConfirmed: boolean;
  venueConfirmed: boolean;
  extraTerms: string;
};

export type ContractSimulationRole = "contractor" | "artist";
export type ContractSimulationStatus = "pending_artist" | "adjustment_requested" | "awaiting_payment" | "awaiting_checkin" | "completed" | "reviewed";

export type ContractSimulationReview = {
  rating: number;
  comment: string;
  createdAt: string;
};

export type StoredContractSimulation = {
  id: string;
  artistId: string;
  contractorId: string;
  draft: ContractDraft;
  status: ContractSimulationStatus;
  createdAt: string;
  acceptedAt?: string;
  paidAt?: string;
  changeRequest?: string;
  contractorCheckedIn?: boolean;
  artistCheckedIn?: boolean;
  contractorReview?: ContractSimulationReview;
  artistReview?: ContractSimulationReview;
};

function contractStorageKey(id: string) {
  return `tocala:contract-simulation:${encodeURIComponent(id)}`;
}

function isDraft(value: unknown): value is ContractDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;
  return typeof draft.eventTitle === "string" && typeof draft.eventDate === "string" && typeof draft.startTime === "string" && typeof draft.fee === "string";
}

export function readContractSimulation(id: string): StoredContractSimulation | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(contractStorageKey(id)) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    const simulation = parsed as Record<string, unknown>;
    if (simulation.id !== id || typeof simulation.artistId !== "string" || !isDraft(simulation.draft)) return null;

    const legacyStatus = simulation.status;
    const status: ContractSimulationStatus = legacyStatus === "pending"
      ? "pending_artist"
      : legacyStatus === "accepted"
        ? "awaiting_payment"
        : legacyStatus === "pending_artist" || legacyStatus === "adjustment_requested" || legacyStatus === "awaiting_payment" || legacyStatus === "awaiting_checkin" || legacyStatus === "completed" || legacyStatus === "reviewed"
          ? legacyStatus
          : "pending_artist";

    return {
      ...(parsed as StoredContractSimulation),
      contractorId: typeof simulation.contractorId === "string" ? simulation.contractorId : simulation.artistId,
      status,
    };
  } catch {
    return null;
  }
}

export function saveContractSimulation(simulation: StoredContractSimulation) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(contractStorageKey(simulation.id), JSON.stringify(simulation));
}
