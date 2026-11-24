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
  artistName?: string;
  artistGenre?: string;
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

export type SimulatedContractRow = {
  id: string;
  artist_id: string;
  contractor_id: string;
  artist_name: string;
  artist_genre: string;
  draft: ContractDraft;
  status: ContractSimulationStatus;
  change_request: string | null;
  contractor_checked_in: boolean;
  artist_checked_in: boolean;
  contractor_review: ContractSimulationReview | null;
  artist_review: ContractSimulationReview | null;
  accepted_at: string | null;
  paid_at: string | null;
  created_at: string;
};

export function contractFromDatabase(row: SimulatedContractRow): StoredContractSimulation {
  return {
    id: row.id,
    artistId: row.artist_id,
    contractorId: row.contractor_id,
    artistName: row.artist_name,
    artistGenre: row.artist_genre,
    draft: row.draft,
    status: row.status,
    changeRequest: row.change_request ?? undefined,
    contractorCheckedIn: row.contractor_checked_in,
    artistCheckedIn: row.artist_checked_in,
    contractorReview: row.contractor_review ?? undefined,
    artistReview: row.artist_review ?? undefined,
    acceptedAt: row.accepted_at ?? undefined,
    paidAt: row.paid_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function contractToDatabase(simulation: StoredContractSimulation) {
  return {
    id: simulation.id,
    artist_id: simulation.artistId,
    contractor_id: simulation.contractorId,
    artist_name: simulation.artistName ?? "",
    artist_genre: simulation.artistGenre ?? "",
    draft: simulation.draft,
    status: simulation.status,
    change_request: simulation.changeRequest ?? null,
    contractor_checked_in: simulation.contractorCheckedIn ?? false,
    artist_checked_in: simulation.artistCheckedIn ?? false,
    contractor_review: simulation.contractorReview ?? null,
    artist_review: simulation.artistReview ?? null,
    accepted_at: simulation.acceptedAt ?? null,
    paid_at: simulation.paidAt ?? null,
    created_at: simulation.createdAt,
  };
}

const CONTRACT_STORAGE_PREFIX = "tocala:contract-simulation:";
export const CONTRACT_SIMULATIONS_CHANGE_EVENT = "tocala:contract-simulations-change";

function contractStorageKey(id: string) {
  return `${CONTRACT_STORAGE_PREFIX}${encodeURIComponent(id)}`;
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
  window.dispatchEvent(new Event(CONTRACT_SIMULATIONS_CHANGE_EVENT));
}

export function listContractSimulations(profileId?: string) {
  if (typeof window === "undefined") return [];
  const simulations: StoredContractSimulation[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(CONTRACT_STORAGE_PREFIX)) continue;
    const encodedId = key.slice(CONTRACT_STORAGE_PREFIX.length);
    let id = encodedId;
    try { id = decodeURIComponent(encodedId); } catch { /* Keep the stored key as a fallback. */ }
    const simulation = readContractSimulation(id);
    if (!simulation) continue;
    if (profileId && simulation.artistId !== profileId && simulation.contractorId !== profileId) continue;
    simulations.push(simulation);
  }
  return simulations.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
