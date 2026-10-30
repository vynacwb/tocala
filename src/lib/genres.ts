export const MUSIC_GENRES = [
  "MPB",
  "Rock",
  "Pop",
  "Sertanejo",
  "Jazz",
  "Blues",
  "Samba",
  "Pagode",
  "Eletrônica",
  "Hip-hop",
  "Soul",
  "Forró",
  "Outro",
] as const;

export function normalizeGenre(genre: string) {
  return genre.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}
