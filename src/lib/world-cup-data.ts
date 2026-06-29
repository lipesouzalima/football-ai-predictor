import { GoogleGenAI } from "@google/genai";
import { Match } from "./data";
import { BRAZIL_TIME_ZONE, formatBrazilDateLong, getBrazilDateParts, normalizeDateToBrazilIso } from "./date-utils";
import * as fs from "fs";
import * as path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CACHE_FILE = path.join(process.cwd(), "src", "data", "wc2026-cache.json");
const CACHE_TTL_MS = 15 * 60 * 1000;
const TARGET_LEAGUE = 1;
const TARGET_SEASON = 2026;

type CacheData = {
  timestamp: number;
  matches: Match[];
  phase: string;
  source?: string;
};

type ApiFootballFixture = {
  fixture?: {
    id?: number;
    date?: string;
    status?: { short?: string; long?: string; elapsed?: number | null };
  };
  league?: { name?: string; round?: string };
  teams?: {
    home?: { name?: string; code?: string; logo?: string };
    away?: { name?: string; code?: string; logo?: string };
  };
  goals?: { home?: number | null; away?: number | null };
};

type RawGeminiMatch = {
  homeTeamName?: string;
  homeTeamCode?: string;
  awayTeamName?: string;
  awayTeamCode?: string;
  date?: string;
  dateTimeISO?: string;
  kickoffBrazil?: string;
  status?: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
  tournament?: string;
  group?: string;
  venue?: string;
};

function readCache(): CacheData | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    const data = JSON.parse(raw) as CacheData;
    data.matches = data.matches.map(normalizeCachedMatch);
    if (Date.now() - data.timestamp < CACHE_TTL_MS) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(data: CacheData) {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.warn("[WorldCupData] Failed to write cache (likely read-only FS):", error);
  }
}

const FLAG_MAP: Record<string, string> = {
  BRA: "br", ARG: "ar", GER: "de", FRA: "fr", ESP: "es", POR: "pt",
  ENG: "gb-eng", ITA: "it", NED: "nl", BEL: "be", CRO: "hr", URU: "uy",
  USA: "us", MEX: "mx", CAN: "ca", JPN: "jp", KOR: "kr", AUS: "au",
  MAR: "ma", SEN: "sn", GHA: "gh", CMR: "cm", NGA: "ng", TUN: "tn",
  COL: "co", CHI: "cl", ECU: "ec", PER: "pe", PAR: "py", BOL: "bo",
  SUI: "ch", AUT: "at", DEN: "dk", SWE: "se", NOR: "no", FIN: "fi",
  POL: "pl", CZE: "cz", WAL: "gb-wls", SCO: "gb-sct", IRL: "ie",
  SRB: "rs", UKR: "ua", RUS: "ru", TUR: "tr", GRE: "gr", TÜR: "tr",
  IRN: "ir", KSA: "sa", QAT: "qa", UAE: "ae", IRQ: "iq",
  CHN: "cn", IND: "in", IDN: "id", THA: "th", VNM: "vn",
  EGY: "eg", ALG: "dz", CIV: "ci", COD: "cd", ZAF: "za", RSA: "za",
  CRC: "cr", HON: "hn", JAM: "jm", PAN: "pa", TTO: "tt",
  NZL: "nz", SAU: "sa", ROU: "ro", SVK: "sk", SVN: "si",
  HUN: "hu", ISL: "is", LUX: "lu", BIH: "ba", ALB: "al",
  MNE: "me", MKD: "mk", GEO: "ge", BHR: "bh", OMA: "om",
  JOR: "jo", UZB: "uz", TWN: "tw", CUW: "cw", HAI: "ht", CPV: "cv",
};

const COLOR_MAP: Record<string, string> = {
  BRA: "#18a957", ARG: "#58a9e8", GER: "#121212", FRA: "#1746d4",
  ESP: "#e11d2e", POR: "#0a8f47", ENG: "#f4f7fb", ITA: "#1266dc",
  NED: "#ff7a18", BEL: "#f2c300", CRO: "#ef233c", URU: "#52a9e9",
  USA: "#1d4ed8", MEX: "#0f9d58", CAN: "#ef233c", JPN: "#f7f7f7",
  KOR: "#e11d48", AUS: "#0c8f45", MAR: "#d21f3c", SEN: "#16a34a",
  GHA: "#facc15", CMR: "#0f9d58", NGA: "#12a366", TUN: "#e11d48",
  COL: "#ffd21f", CHI: "#d62828", ECU: "#f6c21a", PER: "#df1f32",
  PAR: "#d71920", SUI: "#ef233c", AUT: "#ed2939", DEN: "#c8102e",
  SWE: "#0b76bc", NOR: "#c8102e", POL: "#dc143c", TUR: "#e30a17", TÜR: "#e30a17",
  SAU: "#006c35", QAT: "#8a1538", IRN: "#239f40", NZL: "#111827",
  CRC: "#003f88", HON: "#0073cf", JAM: "#009b3a", PAN: "#005293",
  CUW: "#0066ff", CIV: "#ff8200", HAI: "#d21f3c", CPV: "#2454a6",
  BIH: "#1557d6", CZE: "#d7141a", RSA: "#007a4d", IRQ: "#ce1126",
  EGY: "#ce1126", ALG: "#00843d", JOR: "#007a3d", UZB: "#1eb7e6",
};

const CODE_ALIASES: Record<string, string> = {
  IVORY: "CIV",
  "COTE DIVOIRE": "CIV",
  "CÔTE DIVOIRE": "CIV",
  CURACAO: "CUW",
  CURAÇAO: "CUW",
  TURKIYE: "TUR",
  TÜRKIYE: "TUR",
  TURKEY: "TUR",
  "SOUTH AFRICA": "RSA",
  "KOREA REPUBLIC": "KOR",
  "IR IRAN": "IRN",
  "CABO VERDE": "CPV",
  "CONGO DR": "COD",
  CZECHIA: "CZE",
};

function normalizeCode(codeOrName = "") {
  const cleaned = codeOrName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/gi, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

  if (CODE_ALIASES[cleaned]) return CODE_ALIASES[cleaned];
  if (cleaned.length === 3) return cleaned;
  return cleaned.slice(0, 3) || "TBD";
}

function getFlagUrl(code: string): string {
  const isoCode = FLAG_MAP[code] || code.toLowerCase();
  return `https://flagcdn.com/${isoCode}.svg`;
}

function getTeamColor(code: string): string {
  return COLOR_MAP[code] || "#6366f1";
}

function normalizeStatus(raw = "TIMED"): Match["status"] {
  const value = raw.toUpperCase();
  if (["FINISHED", "FT", "AET", "PEN", "FULL_TIME"].includes(value)) return "FINISHED";
  if (["IN_PLAY", "LIVE", "1H", "2H", "HT", "ET", "BT", "P"].includes(value)) return "IN_PLAY";
  return "TIMED";
}

function normalizeCachedMatch(match: Match): Match {
  const homeCode = normalizeCode(match.homeTeam.code || match.homeTeam.name);
  const awayCode = normalizeCode(match.awayTeam.code || match.awayTeam.name);

  return {
    ...match,
    date: normalizeDateToBrazilIso(match.date),
    homeTeam: {
      ...match.homeTeam,
      code: homeCode,
      color: getTeamColor(homeCode),
      flagUrl: getFlagUrl(homeCode),
    },
    awayTeam: {
      ...match.awayTeam,
      code: awayCode,
      color: getTeamColor(awayCode),
      flagUrl: getFlagUrl(awayCode),
    },
  };
}

function makeMatchId(homeCode: string, awayCode: string, date: string, fallback: number | string) {
  const day = getBrazilDateParts(date).replaceAll("-", "");
  return `wc2026_${day}_${homeCode}_${awayCode}_${fallback}`;
}

function toMatchFromRaw(raw: RawGeminiMatch, index: number): Match | null {
  const homeName = raw.homeTeamName?.trim();
  const awayName = raw.awayTeamName?.trim();
  const rawDate = raw.dateTimeISO || raw.date || raw.kickoffBrazil;

  if (!homeName || !awayName || !rawDate) return null;

  const homeCode = normalizeCode(raw.homeTeamCode || homeName);
  const awayCode = normalizeCode(raw.awayTeamCode || awayName);
  const date = normalizeDateToBrazilIso(rawDate);
  const status = normalizeStatus(raw.status);

  return {
    id: makeMatchId(homeCode, awayCode, date, index),
    homeTeam: {
      name: homeName,
      code: homeCode,
      color: getTeamColor(homeCode),
      flagUrl: getFlagUrl(homeCode),
    },
    awayTeam: {
      name: awayName,
      code: awayCode,
      color: getTeamColor(awayCode),
      flagUrl: getFlagUrl(awayCode),
    },
    date,
    status,
    score: status === "FINISHED" || status === "IN_PLAY"
      ? { home: raw.homeGoals ?? 0, away: raw.awayGoals ?? 0 }
      : undefined,
    tournament: raw.tournament || "Copa do Mundo 2026",
    group: raw.group || raw.venue,
  };
}

function toMatchFromApiFootball(item: ApiFootballFixture, index: number): Match | null {
  const homeName = item.teams?.home?.name;
  const awayName = item.teams?.away?.name;
  const rawDate = item.fixture?.date;

  if (!homeName || !awayName || !rawDate) return null;

  const homeCode = normalizeCode(item.teams?.home?.code || homeName);
  const awayCode = normalizeCode(item.teams?.away?.code || awayName);
  const date = normalizeDateToBrazilIso(rawDate);
  const status = normalizeStatus(item.fixture?.status?.short || item.fixture?.status?.long);

  return {
    id: makeMatchId(homeCode, awayCode, date, item.fixture?.id || index),
    homeTeam: {
      name: homeName,
      code: homeCode,
      color: getTeamColor(homeCode),
      flagUrl: getFlagUrl(homeCode),
    },
    awayTeam: {
      name: awayName,
      code: awayCode,
      color: getTeamColor(awayCode),
      flagUrl: getFlagUrl(awayCode),
    },
    date,
    status,
    score: status === "FINISHED" || status === "IN_PLAY"
      ? { home: item.goals?.home ?? 0, away: item.goals?.away ?? 0 }
      : undefined,
    tournament: item.league?.name || "Copa do Mundo 2026",
    group: item.league?.round,
  };
}

async function fetchMatchesFromApiFootball(): Promise<Match[]> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return [];

  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 1);
  const to = new Date(today);
  to.setDate(today.getDate() + 3);

  const params = new URLSearchParams({
    league: String(TARGET_LEAGUE),
    season: String(TARGET_SEASON),
    from: getBrazilDateParts(from),
    to: getBrazilDateParts(to),
    timezone: BRAZIL_TIME_ZONE,
  });

  const response = await fetch(`https://v3.football.api-sports.io/fixtures?${params.toString()}`, {
    headers: { "x-apisports-key": key },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`API-Football HTTP ${response.status}`);
  }

  const data = await response.json();
  const rows = Array.isArray(data.response) ? data.response as ApiFootballFixture[] : [];

  return rows
    .map(toMatchFromApiFootball)
    .filter((match): match is Match => Boolean(match))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

async function fetchMatchesFromGemini(): Promise<Match[]> {
  const today = formatBrazilDateLong();

  const prompt = `
Você é um coletor de dados esportivos. Use Google Search e priorize a agenda oficial da FIFA para a Copa do Mundo FIFA 2026.

Data de hoje no Brasil: ${today}
Timezone obrigatório: ${BRAZIL_TIME_ZONE} (BRT, UTC-03:00).

Retorne SOMENTE JSON válido, sem markdown, com esta forma:
{
  "matches": [
    {
      "homeTeamName": "Curaçao",
      "homeTeamCode": "CUW",
      "awayTeamName": "Côte d'Ivoire",
      "awayTeamCode": "CIV",
      "dateTimeISO": "2026-06-25T17:00:00-03:00",
      "status": "TIMED",
      "homeGoals": null,
      "awayGoals": null,
      "tournament": "Copa do Mundo 2026",
      "group": "Fase de Grupos",
      "venue": "Philadelphia Stadium"
    }
  ]
}

Regras críticas:
- Traga todos os jogos de ontem, hoje e dos próximos 3 dias considerando a data no Brasil.
- Inclua jogos de TODAS as fases: Fase de Grupos, 16 avos de final (Round of 32), Oitavas de final, Quartas, Semifinal e Final. Especifique a fase no campo "group".
- Converta todos os horários para ${BRAZIL_TIME_ZONE}; nunca use horário local dos EUA/México/Canadá sem converter.
- Use códigos FIFA de três letras. Para Curaçao use CUW; Côte d'Ivoire use CIV; Türkiye use TUR; South Africa use RSA; Cabo Verde use CPV.
- Se não tiver placar final, use homeGoals e awayGoals como null.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");

  let cleaned = text.trim();
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  const data = JSON.parse(cleaned) as { matches?: RawGeminiMatch[] };
  const rows = Array.isArray(data.matches) ? data.matches : [];

  return rows
    .map(toMatchFromRaw)
    .filter((match): match is Match => Boolean(match))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

async function fetchFreshMatches(): Promise<{ matches: Match[]; source: string }> {
  try {
    const matches = await fetchMatchesFromApiFootball();
    if (matches.length > 0) {
      return { matches, source: "api-football" };
    }
  } catch (error) {
    console.error("API-Football Fetch Error:", error);
  }

  const matches = await fetchMatchesFromGemini();
  return { matches, source: "gemini-google-search" };
}

export async function getMatches(): Promise<Match[]> {
  const cached = readCache();
  if (cached) {
    console.log(`[WorldCupData] Serving from cache (${cached.source || "unknown"})`);
    return cached.matches;
  }

  console.log("[WorldCupData] Fetching fresh World Cup data...");
  try {
    const { matches, source } = await fetchFreshMatches();
    writeCache({ timestamp: Date.now(), matches, phase: "auto", source });
    return matches;
  } catch (error) {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, "utf-8");
        const stale = JSON.parse(raw) as CacheData;
        console.log("[WorldCupData] Serving stale cache due to fetch error");
        return stale.matches;
      }
    } catch {}

    const { MOCK_MATCHES } = await import("./data");
    return MOCK_MATCHES;
  }
}

export async function refreshMatches(): Promise<Match[]> {
  console.log("[WorldCupData] Force refresh...");
  const { matches, source } = await fetchFreshMatches();
  writeCache({ timestamp: Date.now(), matches, phase: "auto", source });
  return matches;
}
