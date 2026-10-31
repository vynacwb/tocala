export const MUSIC_INSTRUMENT_GROUPS = [
  {
    name: "Mais tocados",
    instruments: [
      "Voz", "Violão", "Guitarra", "Baixo elétrico", "Bateria", "Teclado", "Piano",
      "Ukulele", "Saxofone", "Trompete", "Trombone", "Flauta", "Acordeon / sanfona",
      "Violino", "Viola", "Clarinete", "Gaita", "DJ / música eletrônica", "Percussão",
    ],
  },
  {
    name: "Samba e pagode",
    instruments: [
      "Cavaquinho", "Violão de 6 cordas", "Violão de 7 cordas", "Banjo", "Bandolim",
      "Pandeiro", "Tam-tam / tantã", "Cuíca", "Surdo", "Tamborim", "Rebolo",
      "Frigideira", "Timba", "Repique de mão", "Repinique", "Agogô", "Caixa",
      "Tarol", "Chocalho / ganzá", "Reco-reco", "Prato e faca",
    ],
  },
] as const;

export const MUSIC_INSTRUMENTS = [...new Set(MUSIC_INSTRUMENT_GROUPS.flatMap((group) => group.instruments))];

export function normalizeInstrument(instrument: string) {
  return instrument.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}
