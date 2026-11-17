export type ArtistPriceUnit = "hourly" | "show";

export function formatEstimatedArtistPrice(amount: number, unit: ArtistPriceUnit = "show") {
  const price = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(amount);
  return `${price} ${unit === "hourly" ? "por hora" : "por show"}`;
}
