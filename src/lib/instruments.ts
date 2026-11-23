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
    name: "Cordas",
    instruments: [
      "Viola caipira", "Guitarra de 12 cordas", "Guitarra slide", "Contrabaixo acústico",
      "Violoncelo", "Viola de arco", "Harpa", "Bandolim brasileiro", "Charango", "Banjo americano",
    ],
  },
  {
    name: "Teclas e eletrônicos",
    instruments: [
      "Órgão", "Órgão Hammond", "Sintetizador", "Controlador MIDI", "Keytar", "Sampler",
      "Drum machine", "Toca-discos / turntable", "Launchpad", "Produção musical ao vivo",
    ],
  },
  {
    name: "Sopros",
    instruments: [
      "Saxofone alto", "Saxofone tenor", "Saxofone barítono", "Flauta transversal", "Flautim",
      "Flauta doce", "Oboé", "Fagote", "Trompa", "Tuba", "Bombardino", "Cornetim", "Pífano",
    ],
  },
  {
    name: "Percussão",
    instruments: [
      "Cajón", "Congas", "Bongôs", "Djembe", "Timbales", "Marimba", "Vibrafone", "Xilofone",
      "Triângulo", "Zabumba", "Berimbau", "Alfaia", "Atabaque", "Talking drum", "Pratos",
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
  {
    name: "Regionais e tradicionais",
    instruments: [
      "Rabeca", "Viola de cocho", "Guitarra baiana", "Matraca", "Bacurinha", "Xequerê",
      "Kalimba", "Didgeridoo", "Sitar", "Alaúde", "Koto", "Guzheng", "Ocarina", "Escaleta",
    ],
  },
] as const;

export const MUSIC_INSTRUMENTS = [...new Set(MUSIC_INSTRUMENT_GROUPS.flatMap((group) => group.instruments))];

export function normalizeInstrument(instrument: string) {
  return instrument.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}
