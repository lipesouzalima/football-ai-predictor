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
