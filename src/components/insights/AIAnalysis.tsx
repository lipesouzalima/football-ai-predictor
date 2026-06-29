"use client";

import { motion } from "framer-motion";
import { Activity, Brain, HeartPulse, Lightbulb, TrendingUp, User, History } from "lucide-react";
import { PredictionData } from "@/lib/prediction-types";

const cardBase =
  "rounded-[1.8rem] border border-slate-900/10 bg-white/95 p-5 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.55)] backdrop-blur-xl";

const insights = [
  {
    key: "tatica",
    icon: Activity,
    iconColor: "text-blue-600",
    bgAccent: "bg-blue-100",
    title: "Tática e grupo",
    field: "analise_matematica_grupo" as const,
  },
  {
    key: "desfalques",
    icon: HeartPulse,
    iconColor: "text-rose-600",
    bgAccent: "bg-rose-100",
    title: "Desfalques",
    field: "impacto_desfalques" as const,
  },
  {
    key: "historico",
    icon: History,
    iconColor: "text-indigo-600",
    bgAccent: "bg-indigo-100",
    title: "Histórico de Confrontos",
    field: "historico_confrontos" as const,
  },
  {
    key: "mercado",
    icon: TrendingUp,
    iconColor: "text-amber-700",
    bgAccent: "bg-amber-100",
    title: "Previsões de Analistas",
    field: "consenso_mercado" as const,
  },
];

export function AIAnalysis({
  data,
  homeColor = "#2563eb",
  awayColor = "#f97316",
}: {
  data: PredictionData;
  homeColor?: string;
  awayColor?: string;
}) {
  const confidence = Math.max(0, Math.min(100, data.previsao.confianca_percentual));

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="relative overflow-hidden rounded-[2rem] p-6 text-white shadow-[0_24px_80px_-42px_rgba(15,23,42,0.75)]"
        style={{
          background: `linear-gradient(110deg, ${homeColor}, ${awayColor})`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.28),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.22))]" />
        <Brain className="absolute -right-5 -top-6 h-36 w-36 text-white/10" />

        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/22 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/82 ring-1 ring-white/18 backdrop-blur-md">
            <Brain className="h-4 w-4" />
            Previsão da IA
          </div>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="font-heading text-7xl font-black leading-none tabular-nums tracking-[-0.06em] text-white sm:text-8xl">
                {data.previsao.gols_time_casa}
              </span>
              <span className="h-14 w-px bg-white/30" />
              <span className="font-heading text-7xl font-black leading-none tabular-nums tracking-[-0.06em] text-white sm:text-8xl">
                {data.previsao.gols_time_fora}
              </span>
            </div>

            <div className="min-w-36 rounded-[1.4rem] bg-white/22 p-4 ring-1 ring-white/18 backdrop-blur-md">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-white/68">Confiança</span>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/22">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence}%` }}
                    transition={{ type: "spring", damping: 25, stiffness: 80, delay: 0.25 }}
                    className="h-full rounded-full bg-white"
                  />
                </div>
                <span className="font-heading text-xl font-black tabular-nums text-white">{confidence}%</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {insights.map((item, index) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 120, delay: 0.08 * (index + 1) }}
          className={cardBase}
        >
          <div className="flex items-start gap-4">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.bgAccent}`}>
              <item.icon className={`h-5 w-5 ${item.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-heading text-base font-black tracking-[-0.02em] text-slate-950">{item.title}</h4>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{data[item.field]}</p>
            </div>
          </div>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120, delay: 0.32 }}
        className={cardBase}
      >
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-100">
            <User className="h-5 w-5 text-violet-700" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-heading text-base font-black tracking-[-0.02em] text-slate-950">Jogador chave</h4>
            <span className="mt-1 inline-block text-xs font-black uppercase tracking-[0.14em] text-violet-700">{data.jogador_chave.nome}</span>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{data.jogador_chave.insight}</p>
          </div>
        </div>
      </motion.div>

      {data.motivo_alteracao ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 120, delay: 0.4 }}
          className="rounded-[1.8rem] border border-amber-200/70 bg-amber-50/90 p-5 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.55)] backdrop-blur-xl"
        >
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100">
              <Lightbulb className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-heading text-base font-black tracking-[-0.02em] text-slate-950">Mudança de opinião</h4>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{data.motivo_alteracao}</p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
