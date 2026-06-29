export type PredictionData = {
  previsao: {
    gols_time_casa: number;
    gols_time_fora: number;
    confianca_percentual: number;
  };
  historico_confrontos: string;
  analise_matematica_grupo: string;
  impacto_desfalques: string;
  consenso_mercado: string;
  jogador_chave: {
    nome: string;
    insight: string;
  };
  motivo_alteracao?: string;
  source?: "ai" | "heuristic";
};
