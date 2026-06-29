import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PredictionData } from "@/lib/prediction-types";
import { Match, getFifaRanking } from "./data";
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

function hasMeaningfulKeyPlayer(data: PredictionData | undefined | null): boolean {
  if (!data?.jogador_chave) return false;
  const name = data.jogador_chave.nome?.trim() || "";
  const insight = data.jogador_chave.insight?.trim() || "";
  return name.length > 2 && insight.length > 12;
}

function isUsablePrediction(data: PredictionData | undefined | null): data is PredictionData {
  if (!data) return false;
  if (data.source && data.source !== "ai") return false;
  const hasScores = Boolean(
    data.previsao &&
    Number.isFinite(data.previsao.gols_time_casa) &&
    Number.isFinite(data.previsao.gols_time_fora) &&
    Number.isFinite(data.previsao.confianca_percentual)
  );
  return hasScores && hasMeaningfulKeyPlayer(data);
}

function readPredictionCache(matchId: string, status?: Match["status"]): PredictionData | null {
  try {
    if (!fs.existsSync(PREDICTION_CACHE_FILE)) return null;
    const raw = fs.readFileSync(PREDICTION_CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as CachedPrediction[];
    const validEntries = parsed.filter((item) => isUsablePrediction(item.data));

    if (validEntries.length !== parsed.length) {
      fs.writeFileSync(PREDICTION_CACHE_FILE, JSON.stringify(validEntries, null, 2), "utf-8");
    }

    const entry = validEntries.find((item) => item.matchId === matchId);
    if (!entry) return null;

    const isMatchFinished = status === "FINISHED";
    const ttl = isMatchFinished ? 30 * 24 * 60 * 60 * 1000 : 10 * 60 * 1000; // 30 days for finished matches, 10 mins for in_play/timed
    if (Date.now() - entry.timestamp > ttl) return null;
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

function isGenericInsight(text: string | null | undefined): boolean {
  if (!text) return true;
  const normalized = text.toLowerCase().trim();
  if (normalized.length < 10) return true;
  const placeholderPhrases = [
    "não há informações específicas",
    "sem dados disponíveis",
    "placeholder",
  ];
  return placeholderPhrases.some((phrase) => normalized.includes(phrase));
}


function clampPredictionValue(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function selectKeyPlayer(match: Match): { name: string; insight: string } {
  const homeName = (match.homeTeam.name || "").toLowerCase();
  const awayName = (match.awayTeam.name || "").toLowerCase();

  const playerMap: Record<string, { name: string; insight: string }> = {
    brasil: { name: "Vinícius Júnior", insight: "Ele tende a decidir o jogo porque cria superioridade em velocidade e costuma ser o nome mais perigoso quando a equipe precisa abrir o bloco adversário." },
    argentina: { name: "Lionel Messi", insight: "Ele costuma ser o jogador-chave porque transforma a pressão em oportunidade e consegue desequilibrar em poucos segundos." },
    frança: { name: "Kylian Mbappé", insight: "Ele tende a decidir o jogo por ter a combinação ideal de velocidade, finalização e capacidade de mudar o fluxo da partida." },
    espanha: { name: "Lamine Yamal", insight: "Ele pode decidir o jogo por causar desequilíbrio em faixa e abrir espaços em fases de ataque rápido." },
    alemanha: { name: "Florian Wirtz", insight: "Ele costuma ser o nome mais influente porque une criação, condução e presença em zonas decisivas." },
    inglaterra: { name: "Jude Bellingham", insight: "Ele tende a decidir por ser o elo entre o meio-campo e a frente, com presença em todas as fases do jogo." },
    portugal: { name: "Cristiano Ronaldo", insight: "Ele costuma ser o jogador-chave porque transforma momentos isolados em chances reais e altera a pressão defensiva do adversário." },
    itália: { name: "Federico Chiesa", insight: "Ele pode decidir o jogo por sua capacidade de desequilibrar em velocidade e provocar erros na defesa." },
    holanda: { name: "Cody Gakpo", insight: "Ele tende a ser o nome mais decisivo por unir movimentação, finalização e presença na área." },
    uruguai: { name: "Federico Valverde", insight: "Ele costuma decidir o jogo por sua intensidade e por ser o elo entre a proteção defensiva e a criação ofensiva." },
    méxico: { name: "Raúl Jiménez", insight: "Ele pode ser o jogador-chave por sua presença na área e pela capacidade de finalizar em momentos curtos." },
    japão: { name: "Takefusa Kubo", insight: "Ele tende a decidir por ser o principal criador e por abrir espaços com qualidade de passe e drible." },
    coreia: { name: "Son Heung-min", insight: "Ele costuma ser o nome mais impactante por sua capacidade de finalizar e mudar o jogo em poucas ações." },
    marrocos: { name: "Hakim Ziyech", insight: "Ele pode decidir o jogo por sua habilidade de criar, driblar e encontrar o último passe." },
    senegal: { name: "Sadio Mané", insight: "Ele tende a ser decisivo porque muda o jogo com velocidade, finalização e presença em transições." },
    colômbia: { name: "Luis Díaz", insight: "Ele costuma decidir em fases de ataque rápido porque gera perigo em cada corrida e cada aproximação da área." },
    ecuador: { name: "Enner Valencia", insight: "Ele tende a ser o nome mais importante por sua presença na área e por transformar oportunidades em gols." },
  };

  for (const [teamKey, player] of Object.entries(playerMap)) {
    if (homeName.includes(teamKey) || awayName.includes(teamKey)) {
      return player;
    }
  }

  return {
    name: `${match.homeTeam.name} x ${match.awayTeam.name}`,
    insight: "O jogador-chave tende a ser o nome que conseguir ganhar a segunda bola e criar a jogada mais perigosa em zonas decisivas.",
  };
}

function buildDeterministicPrediction(match: Match, previousPrediction?: PredictionData): PredictionData {
  const homeCode = (match.homeTeam.code || match.homeTeam.name).toLowerCase();
  const awayCode = (match.awayTeam.code || match.awayTeam.name).toLowerCase();
  const homeTier = TEAM_TIER[homeCode] || 4;
  const awayTier = TEAM_TIER[awayCode] || 4;
  const tierGap = homeTier - awayTier;
  const keyPlayer = selectKeyPlayer(match);

  let homeGoals = 1;
  let awayGoals = 1;
  let confidence = 66;
  let analysis = `O duelo parece fechado e deve se decidir por detalhes. ${match.homeTeam.name} tem mais chance de ditar o ritmo por jogar em casa, mas ${match.awayTeam.name} pode virar o jogo em transições curtas.`;
  let impact = `Sem um boletim completo, a leitura base é prudente: qualquer desfalque em posições-chave tende a pesar mais na equipe que depende mais de organização em campo.`;
  let market = `A linha mais coerente é um jogo de equilíbrio com o mandante levando mais volume de jogo e o visitante dependendo de uma passagem de qualidade para abrir o placar.`;
  let keyPlayerName = keyPlayer.name;
  let keyPlayerInsight = keyPlayer.insight;
  let alteration = "";

  if (tierGap >= 2) {
    homeGoals = 2;
    awayGoals = 0;
    confidence = 78;
    analysis = `${match.homeTeam.name} entra como favorito claro porque tem melhor encaixe de elenco e vantagem de atuar em casa. O jogo deve ficar mais controlado pelo mandante, com o rival dependendo de transições para incomodar.`;
    impact = `Qualquer desfalque defensivo ou no meio-campo pesa mais em ${match.homeTeam.name}, porque a equipe precisa manter a posse e a pressão para controlar o jogo.`;
    market = `O mercado tende a valorizar o mandante como favorito, mas o cenário mais seguro é esperar um jogo com domínio do local e menos espaço para o visitante.`;
    keyPlayerName = keyPlayer.name;
    keyPlayerInsight = keyPlayer.insight;
  } else if (tierGap >= 1) {
    homeGoals = 2;
    awayGoals = 1;
    confidence = 72;
    analysis = `${match.homeTeam.name} tem pequena vantagem por jogar em casa e por entrar com melhor contexto de elenco. ${match.awayTeam.name} pode incomodar, mas deve depender de momentos de transição.`;
    impact = `Se houver desfalques no setor criativo ou defensivo, a equipe da casa tende a sentir mais o peso porque precisa controlar o ritmo do jogo.`;
    market = `A leitura mais consistente é um confronto com domínio do mandante, mas com espaço para o visitante conseguir um gol em contraataque.`;
    keyPlayerName = keyPlayer.name;
    keyPlayerInsight = keyPlayer.insight;
  } else if (tierGap <= -2) {
    homeGoals = 0;
    awayGoals = 2;
    confidence = 74;
    analysis = `${match.awayTeam.name} chega com melhor leitura de jogo e pode explorar a pressão do mandante em transições. O duelo deve ficar mais aberto para o visitante do que para o time de casa.`;
    impact = `Se houver ausência de peças importantes no setor defensivo do mandante, o visitante ganha mais espaço para atacar com velocidade e objetividade.`;
    market = `A linha mais plausível é um jogo mais favorável ao visitante, sobretudo se o mandante não conseguir sustentar a posse de bola.`;
    keyPlayerName = keyPlayer.name;
    keyPlayerInsight = keyPlayer.insight;
  } else {
    homeGoals = 1;
    awayGoals = 1;
    confidence = 64;
    analysis = `O duelo parece muito fechado e deve se decidir por detalhes. ${match.homeTeam.name} e ${match.awayTeam.name} têm condições parecidas, então a diferença tende a vir de um erro, de uma bola parada ou de um momento decisivo.`;
    impact = `Qualquer desfalque em posições-chave pode mudar o equilíbrio do jogo, porque as equipes parecem próximas in nível e em forma.`;
    market = `O cenário mais racional é de jogo equilibrado, com pouca margem para grandes diferenças e bastante valor em detalhes.`;
    keyPlayerName = keyPlayer.name;
    keyPlayerInsight = keyPlayer.insight;
  }

  if (previousPrediction?.previsao) {
    const prevHome = previousPrediction.previsao.gols_time_casa;
    const prevAway = previousPrediction.previsao.gols_time_fora;
    if (Number.isFinite(prevHome) && Number.isFinite(prevAway)) {
      const delta = Math.abs(homeGoals - prevHome) + Math.abs(awayGoals - prevAway);
      if (delta <= 1) {
        homeGoals = prevHome;
        awayGoals = prevAway;
        alteration = "";
      } else {
        alteration = `A previsão de gols foi alterada de ${prevHome}x${prevAway} para ${homeGoals}x${awayGoals} com base no ajuste técnico recente das equipes.`;
      }
    }
  }


  return {
    previsao: {
      gols_time_casa: homeGoals,
      gols_time_fora: awayGoals,
      confianca_percentual: confidence,
    },
    historico_confrontos: `Com base nas posições de ranking e relevância, o histórico aponta para um duelo equilibrado onde a eficiência ofensiva tem sido o diferencial nos últimos confrontos.`,
    analise_matematica_grupo: analysis,
    impacto_desfalques: impact,
    consenso_mercado: market,
    jogador_chave: {
      nome: keyPlayerName,
      insight: keyPlayerInsight,
    },
    motivo_alteracao: alteration,
    source: "heuristic",
  };
}

function normalizeAiPrediction(parsed: Partial<PredictionData> | null | undefined, fallback: PredictionData): PredictionData {
  const safePrevisao = parsed?.previsao;
  const homeGoals = safePrevisao && Number.isFinite(safePrevisao.gols_time_casa)
    ? clampPredictionValue(safePrevisao.gols_time_casa, 0, 5)
    : fallback.previsao.gols_time_casa;
  const awayGoals = safePrevisao && Number.isFinite(safePrevisao.gols_time_fora)
    ? clampPredictionValue(safePrevisao.gols_time_fora, 0, 5)
    : fallback.previsao.gols_time_fora;
  const confidence = safePrevisao && Number.isFinite(safePrevisao.confianca_percentual)
    ? clampPredictionValue(safePrevisao.confianca_percentual, 0, 100)
    : fallback.previsao.confianca_percentual;

  const analysis = parsed?.analise_matematica_grupo?.trim();
  const history = parsed?.historico_confrontos?.trim();
  const impact = parsed?.impacto_desfalques?.trim();
  const market = parsed?.consenso_mercado?.trim();
  const keyName = parsed?.jogador_chave?.nome?.trim();
  const keyInsight = parsed?.jogador_chave?.insight?.trim();

  const resolvedKeyName = (keyName && keyName.length > 2) ? keyName : fallback.jogador_chave.nome;
  const resolvedKeyInsight = (keyInsight && keyInsight.length > 12 && !isGenericInsight(keyInsight)) ? keyInsight : fallback.jogador_chave.insight;

  return {
    previsao: { gols_time_casa: homeGoals, gols_time_fora: awayGoals, confianca_percentual: confidence },
    historico_confrontos: history && !isGenericInsight(history) ? history : fallback.historico_confrontos,
    analise_matematica_grupo: analysis && !isGenericInsight(analysis) ? analysis : fallback.analise_matematica_grupo,
    impacto_desfalques: impact && !isGenericInsight(impact) ? impact : fallback.impacto_desfalques,
    consenso_mercado: market && !isGenericInsight(market) ? market : fallback.consenso_mercado,
    jogador_chave: {
      nome: resolvedKeyName,
      insight: resolvedKeyInsight,
    },
    motivo_alteracao: parsed?.motivo_alteracao?.trim() || fallback.motivo_alteracao || "",
    source: "ai",
  };
}

export async function generatePrediction(match: Match, previousPrediction?: PredictionData): Promise<PredictionData> {
  const fallbackPrediction = buildDeterministicPrediction(match, previousPrediction);

  if (!process.env.GEMINI_API_KEY) {
    return fallbackPrediction;
  }

  const previousContext = previousPrediction
    ? `\nPrevisão anterior guardada: ${JSON.stringify(previousPrediction)}\nUse essa como base e só mude se houver um sinal novo e claro. Se mudar, explique a mudança de forma curta e objetiva no campo motivo_alteracao.\n`
    : "";

  const homeRank = getFifaRanking(match.homeTeam.code) || "sem ranking";
  const awayRank = getFifaRanking(match.awayTeam.code) || "sem ranking";

const prompt = `
Você é um analista estatístico sênior de futebol e especialista em teoria dos jogos.
Sua tarefa é analisar a partida entre ${match.homeTeam.name} e ${match.awayTeam.name} (${match.tournament} - ${match.group}) e gerar uma previsão útil e altamente assertiva para o usuário.

Use a ferramenta Google Search OBRIGATORIAMENTE para pesquisar na internet sobre a partida. Pesquise: histórico de confrontos diretos recentes (últimas 3-5 partidas), desfalques, lesões, cartões, escalações prováveis, clima técnico tático atual, e o consenso do mercado de apostas/analistas (odds, favoritos).

Contexto da partida:
- Mandante: ${match.homeTeam.name} (Código FIFA: ${match.homeTeam.code}, Ranking FIFA: #${homeRank})
- Visitante: ${match.awayTeam.name} (Código FIFA: ${match.awayTeam.code}, Ranking FIFA: #${awayRank})
- Competição: ${match.tournament}
- Fase/Grupo: ${match.group || "sem grupo"}
${previousContext}

Regras obrigatórias:
1. "Chain of Thought": Antes de preencher os insights finais, use os campos "pesquisa_*" para anotar o resultado das suas buscas na internet. Isso é seu rascunho de análise.
2. Não escreva frases vagas ou genéricas nos insights finais.
3. No campo 'historico_confrontos', resuma os últimos 3 a 5 confrontos diretos recentes que você pesquisou e como isso afeta a curva de desempenho e a confiança das equipes hoje.
4. No campo 'analise_matematica_grupo', detalhe o encaixe tático, pontos fortes/fracos atuais.
5. No campo 'impacto_desfalques', liste quem está fora (lesão/cartão) e como isso muda o time. Se não houver, informe que os times estão com força máxima.
6. No campo 'consenso_mercado', mostre as previsões e odds de vitória/empate/derrota de casas de apostas ou analistas esportivos.
7. No campo 'jogador_chave', aponte um jogador em boa fase (com nome) e por que ele decidirá o jogo.
8. Gere placares baseados na sua pesquisa, não restrinja a 1x1 ou 0x0. Se um time estiver voando, pode dar 3x0, 4x1. Use todo seu potencial preditivo.
9. Responda apenas em português brasileiro, mantendo postura sênior.
`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      pesquisa_historico: { type: Type.STRING, description: "Rascunho invisível sobre os últimos confrontos pesquisados." },
      pesquisa_desfalques: { type: Type.STRING, description: "Rascunho invisível sobre lesões e cartões." },
      pesquisa_taticas: { type: Type.STRING, description: "Rascunho invisível sobre o estado tático atual." },
      pesquisa_mercado: { type: Type.STRING, description: "Rascunho invisível sobre mercado de apostas." },
      previsao: {
        type: Type.OBJECT,
        properties: {
          gols_time_casa: { type: Type.INTEGER },
          gols_time_fora: { type: Type.INTEGER },
          confianca_percentual: { type: Type.INTEGER },
        },
        required: ["gols_time_casa", "gols_time_fora", "confianca_percentual"],
      },
      historico_confrontos: { type: Type.STRING },
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
    required: ["pesquisa_historico", "pesquisa_desfalques", "pesquisa_taticas", "pesquisa_mercado", "previsao", "historico_confrontos", "analise_matematica_grupo", "impacto_desfalques", "consenso_mercado", "jogador_chave"],
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
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");

      const parsed = JSON.parse(text) as Partial<PredictionData>;
      const normalizedPrediction = normalizeAiPrediction(parsed, fallbackPrediction);

      // Limpeza do motivo_alteracao de acordo com mudança real de opinião
      if (previousPrediction?.previsao) {
        const prevHome = previousPrediction.previsao.gols_time_casa;
        const prevAway = previousPrediction.previsao.gols_time_fora;
        const currHome = normalizedPrediction.previsao.gols_time_casa;
        const currAway = normalizedPrediction.previsao.gols_time_fora;
        if (currHome === prevHome && currAway === prevAway) {
          normalizedPrediction.motivo_alteracao = "";
        } else if (!normalizedPrediction.motivo_alteracao) {
          normalizedPrediction.motivo_alteracao = `Previsão de placar alterada de ${prevHome}x${prevAway} para ${currHome}x${currAway}.`;
        }
      } else {
        normalizedPrediction.motivo_alteracao = "";
      }

      if (normalizedPrediction.analise_matematica_grupo === fallbackPrediction.analise_matematica_grupo &&
          normalizedPrediction.impacto_desfalques === fallbackPrediction.impacto_desfalques &&
          normalizedPrediction.consenso_mercado === fallbackPrediction.consenso_mercado) {
        return fallbackPrediction;
      }
      return normalizedPrediction;
    } catch (error) {
      lastError = error;
      console.warn(`Gemini model ${modelName} failed, trying fallback.`, error);
    }
  }

  console.error("Gemini Generation Error:", lastError);
  return fallbackPrediction;
}

export async function getPrediction(match: Match, forceRefresh = false): Promise<PredictionData> {
  if (!forceRefresh) {
    const cached = readPredictionCache(match.id, match.status);
    if (cached) {
      return cached;
    }
  }

  const previousPrediction = forceRefresh ? undefined : readPredictionCache(match.id, match.status) ?? undefined;
  const prediction = await generatePrediction(match, previousPrediction);
  if (prediction.source === "ai") {
    writePredictionCache(match.id, prediction);
  }
  return prediction;
}

