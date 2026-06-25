import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PredictionData } from "@/lib/prediction-types";
import { Match } from "./data";
import * as fs from "fs";
import * as path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const PREDICTION_CACHE_FILE = path.join(process.cwd(), "src", "data", "prediction-cache.json");
const PREDICTION_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MODEL_CANDIDATES = [
  process.env.GEMINI_PRIMARY_MODEL || "gemini-2.5-pro",
  process.env.GEMINI_SECOND_MODEL || "gemini-2.5-flash",
  process.env.GEMINI_TERTIARY_MODEL || "gemini-2.0-flash",
].filter(Boolean);

const TEAM_TIER: Record<string, number> = {
  bra: 8,
  arg: 8,
  fra: 7,
  esp: 7,
  ger: 7,
  eng: 7,
  por: 7,
  ita: 6,
  ned: 6,
  bel: 6,
  uru: 6,
  usa: 5,
  mex: 5,
  can: 5,
  jpn: 5,
  kor: 5,
  aus: 5,
  mar: 5,
  sen: 5,
  gha: 5,
  cmr: 5,
  nga: 5,
  tun: 4,
  col: 4,
  chi: 4,
  ecu: 4,
  per: 4,
  par: 4,
  sui: 4,
  aut: 4,
  den: 4,
  swe: 4,
  nor: 4,
  pol: 4,
  cze: 4,
  tur: 4,
  irn: 4,
  sau: 4,
  qat: 4,
  crc: 4,
  hon: 4,
  jam: 4,
  pan: 4,
  cua: 4,
  civ: 4,
  hai: 4,
  cpv: 4,
};

type CachedPrediction = {
  timestamp: number;
  matchId: string;
  data: PredictionData;
};

function readPredictionCache(matchId: string): PredictionData | null {
  try {
    if (!fs.existsSync(PREDICTION_CACHE_FILE)) return null;
    const raw = fs.readFileSync(PREDICTION_CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as CachedPrediction[];
    const entry = parsed.find((item) => item.matchId === matchId);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > PREDICTION_CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function writePredictionCache(matchId: string, data: PredictionData) {
  try {
    const dir = path.dirname(PREDICTION_CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let items: CachedPrediction[] = [];
    if (fs.existsSync(PREDICTION_CACHE_FILE)) {
      const raw = fs.readFileSync(PREDICTION_CACHE_FILE, "utf-8");
      items = JSON.parse(raw) as CachedPrediction[];
    }

    const nextItems = items.filter((item) => item.matchId !== matchId);
    nextItems.push({ timestamp: Date.now(), matchId, data });
    fs.writeFileSync(PREDICTION_CACHE_FILE, JSON.stringify(nextItems, null, 2), "utf-8");
  } catch (error) {
    console.error("Prediction cache write error:", error);
  }
}

function buildHeuristicPrediction(match: Match): PredictionData {
  const homeCode = (match.homeTeam.code || match.homeTeam.name).toLowerCase();
  const awayCode = (match.awayTeam.code || match.awayTeam.name).toLowerCase();
  const homeTier = TEAM_TIER[homeCode] || 4;
  const awayTier = TEAM_TIER[awayCode] || 4;
  const edge = homeTier - awayTier + 1;

  let homeGoals = 1;
  let awayGoals = 1;

  if (edge >= 3) {
    homeGoals = 2;
    awayGoals = 0;
  } else if (edge >= 2) {
    homeGoals = 2;
    awayGoals = 1;
  } else if (edge >= 1) {
    homeGoals = 2;
    awayGoals = 1;
  } else if (edge <= -2) {
    homeGoals = 0;
    awayGoals = 2;
  } else {
    homeGoals = 1;
    awayGoals = 1;
  }

  return {
    previsao: {
      gols_time_casa: homeGoals,
      gols_time_fora: awayGoals,
      confianca_percentual: 66,
    },
    analise_matematica_grupo: `A leitura de apoio aponta um jogo com ligeira vantagem para ${match.homeTeam.name} em casa, com equilíbrio suficiente para que o resultado fique aberto até os minutos finais.`,
    impacto_desfalques: `Sem um boletim oficial completo, a leitura base assume que a escalação principal permanece próxima do esperado e que o contexto tático pesa mais do que o nome isolado.`,
    consenso_mercado: `O cenário mais provável é um jogo equilibrado, com pequena vantagem do mandante quando os detalhes de escalação não mudam o contexto do duelo.`,
    jogador_chave: {
      nome: match.homeTeam.name,
      insight: `O protagonista tende a ser o jogador mais decisivo do elenco principal, especialmente em uma partida em que a casa pode decidir a diferença.`,
    },
    motivo_alteracao: "A análise de apoio foi usada porque a IA principal não respondeu com a qualidade esperada; a leitura ficou mais conservadora e alinhada ao contexto do jogo.",
  };
}

async function fetchNews(query: string) {
  if (!process.env.NEWSAPI_KEY) return "Nenhuma notícia recente.";
  try {
    const res = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=pt&sortBy=publishedAt&pageSize=3`, {
      headers: {
        "X-Api-Key": process.env.NEWSAPI_KEY,
      },
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    if (data.articles && data.articles.length > 0) {
      return data.articles.map((a: any) => `- ${a.title}: ${a.description}`).join("\n");
    }
    return "Nenhuma notícia recente.";
  } catch (error) {
    console.error("NewsAPI Error:", error);
    return "Erro ao buscar notícias.";
  }
}

export async function generatePrediction(match: Match, previousPrediction?: PredictionData): Promise<PredictionData> {
  const homeNews = await fetchNews(`${match.homeTeam.name} seleção futebol desfalque OR lesão OR escalação`);
  const awayNews = await fetchNews(`${match.awayTeam.name} seleção futebol desfalque OR lesão OR escalação`);

  const previousContext = previousPrediction
    ? `\nPrevisão anterior guardada: ${JSON.stringify(previousPrediction)}\nUse essa como base e só mude se houver um sinal novo e claro. Se mudar, explique o motivo em motivo_alteracao.\n`
    : "";

  const prompt = `
Você é um analista estatístico sênior de futebol e especialista em teoria dos jogos.
Sua tarefa é analisar a partida entre ${match.homeTeam.name} e ${match.awayTeam.name} (${match.tournament} - ${match.group}) e gerar uma previsão realista com argumentos lógicos e frios.
${previousContext}
Notícias recentes (foco em desfalques e escalações):
${match.homeTeam.name}:
${homeNews}

${match.awayTeam.name}:
${awayNews}

Regras:
1. Baseie-se em notícias recentes, contexto de escalação, forma, histórico e matemática do grupo.
2. Mantenha a previsão estável quando não houver sinais novos. Não troque o palpite por tendência de curto prazo sem evidência robusta.
3. Se houver uma mudança relevante, escreva em motivo_alteracao uma frase curta explicando a razão principal.
4. Não use termos clichês, exclamações ou emojis.
5. Seja analítico, frio e coerente.
`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      previsao: {
        type: Type.OBJECT,
        properties: {
          gols_time_casa: { type: Type.INTEGER },
          gols_time_fora: { type: Type.INTEGER },
          confianca_percentual: { type: Type.INTEGER },
        },
        required: ["gols_time_casa", "gols_time_fora", "confianca_percentual"],
      },
      analise_matematica_grupo: { type: Type.STRING },
      impacto_desfalques: { type: Type.STRING },
      consenso_mercado: { type: Type.STRING },
      jogador_chave: {
        type: Type.OBJECT,
        properties: {
          nome: { type: Type.STRING },
          insight: { type: Type.STRING },
        },
        required: ["nome", "insight"],
      },
      motivo_alteracao: { type: Type.STRING },
    },
    required: ["previsao", "analise_matematica_grupo", "impacto_desfalques", "consenso_mercado", "jogador_chave"],
  };

  let lastError: unknown;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");

      const parsed = JSON.parse(text) as PredictionData;
      return {
        ...parsed,
        motivo_alteracao: parsed.motivo_alteracao?.trim() || "Previsão mantida sem sinais novos o suficiente para alterar o palpite.",
      };
    } catch (error) {
      lastError = error;
      console.warn(`Gemini model ${modelName} failed, trying fallback.`, error);
    }
  }

  console.error("Gemini Generation Error:", lastError);
  return buildHeuristicPrediction(match);
}

export async function getPrediction(match: Match, forceRefresh = false): Promise<PredictionData> {
  if (!forceRefresh) {
    const cached = readPredictionCache(match.id);
    if (cached) {
      return cached;
    }
  }

  const previousPrediction = forceRefresh ? undefined : readPredictionCache(match.id) ?? undefined;
  const prediction = await generatePrediction(match, previousPrediction);
  writePredictionCache(match.id, prediction);
  return prediction;
}
