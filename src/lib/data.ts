export type Match = {
  id: string;
  homeTeam: { name: string; code: string; color: string; flagUrl?: string };
  awayTeam: { name: string; code: string; color: string; flagUrl?: string };
  date: string;
  status: "FINISHED" | "IN_PLAY" | "TIMED";
  score?: { home: number; away: number };
  tournament: string;
  group?: string;
};

export const FIFA_RANKINGS: Record<string, number> = {
  ARG: 1, ESP: 2, FRA: 3, ENG: 4, POR: 5, BRA: 6, MAR: 7, NED: 8, BEL: 9, GER: 10,
  CRO: 11, ITA: 12, COL: 13, MEX: 14, SEN: 15, URU: 16, USA: 17, JPN: 18, SUI: 19, IRN: 20,
  DEN: 20, AUT: 22, TUR: 22, ECU: 23, UKR: 24, KOR: 25, AUS: 27, SWE: 28, HUN: 29, CAN: 30,
  WAL: 30, SRB: 32, CIV: 33, QAT: 35, EGY: 36, POL: 36, RUS: 37, NGA: 38, SCO: 39, SCOTLAND: 39,
  TUN: 41, PER: 42, CHI: 43, PAN: 43, ALG: 44, SVK: 44, ROU: 45, CZE: 47, SAU: 61, PAR: 62,
  UZB: 62, FIN: 63, GHA: 64, ALB: 66, CPV: 67, JOR: 68, UAE: 69, MKD: 70, ISL: 72, MNE: 73,
  GEO: 74, NOR: 74, BIH: 75, OMA: 76, HON: 79, BHR: 80, BOL: 84, LUX: 85, HAI: 85, CUW: 86,
  CHN: 88, NZL: 95, TTO: 100, THA: 101, VNM: 116, IND: 121, IDN: 134, TWN: 166
};

export function getFifaRanking(code: string): number | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  return FIFA_RANKINGS[normalized] || null;
}


// Copa do Mundo 2026 - Mocks baseados no horário local: 2026-06-23T18:43:43-03:00
export const MOCK_MATCHES: Match[] = [
  // Anteriores
  {
    id: "match_1",
    tournament: "World Cup 2026",
    group: "Grupo A",
    homeTeam: { name: "Brasil", code: "BRA", color: "#009c3b", flagUrl: "https://flagcdn.com/br.svg" },
    awayTeam: { name: "França", code: "FRA", color: "#002395", flagUrl: "https://flagcdn.com/fr.svg" },
    date: "2026-06-22T16:00:00-03:00",
    status: "FINISHED",
    score: { home: 2, away: 1 },
  },
  // Hoje
  {
    id: "match_2",
    tournament: "World Cup 2026",
    group: "Grupo B",
    homeTeam: { name: "Argentina", code: "ARG", color: "#75aadb", flagUrl: "https://flagcdn.com/ar.svg" },
    awayTeam: { name: "Alemanha", code: "GER", color: "#000000", flagUrl: "https://flagcdn.com/de.svg" },
    date: "2026-06-23T14:00:00-03:00",
    status: "FINISHED",
    score: { home: 1, away: 1 },
  },
  {
    id: "match_3",
    tournament: "World Cup 2026",
    group: "Grupo C",
    homeTeam: { name: "Espanha", code: "ESP", color: "#c60b1e", flagUrl: "https://flagcdn.com/es.svg" },
    awayTeam: { name: "Portugal", code: "POR", color: "#006600", flagUrl: "https://flagcdn.com/pt.svg" },
    date: "2026-06-23T19:30:00-03:00", // ~40 min from current context time
    status: "TIMED",
  },
  // Próximos
  {
    id: "match_4",
    tournament: "World Cup 2026",
    group: "Grupo D",
    homeTeam: { name: "Inglaterra", code: "ENG", color: "#ffffff", flagUrl: "https://flagcdn.com/gb-eng.svg" },
    awayTeam: { name: "Itália", code: "ITA", color: "#0064a8", flagUrl: "https://flagcdn.com/it.svg" },
    date: "2026-06-24T16:00:00-03:00",
    status: "TIMED",
  },
];
