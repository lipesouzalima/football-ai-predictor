"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Match } from "@/lib/data";
import { formatKickoffInBrazil, formatMatchDateInBrazil } from "@/lib/date-utils";
import { Sparkles } from "lucide-react";
import { Countdown } from "./Countdown";
import { TeamFlagImage } from "./TeamFlagImage";

function ResultDots({ color }: { color: string }) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <span className="h-3 w-3 rounded-md bg-white/35 shadow-sm" />
      <span className="h-3 w-3 rounded-md shadow-sm" style={{ backgroundColor: color }} />
      <span className="h-3 w-3 rounded-md bg-slate-950/28 shadow-sm" />
    </div>
  );
}

function TeamFlag({ matchSide, align }: { matchSide: Match["homeTeam"]; align: "left" | "right" }) {
  return (
    <div className={`flex flex-col items-center ${align === "left" ? "pl-1" : "pr-1"}`}>
      <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-white/32 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_12px_32px_-16px_rgba(15,23,42,0.7)] ring-1 ring-white/45 sm:h-[4.5rem] sm:w-[4.5rem]">
        <TeamFlagImage
          team={matchSide}
          className="h-full w-full object-cover"
          fallbackClassName="font-heading text-lg font-black text-white drop-shadow"
        />
      </div>
      <span className="mt-4 font-heading text-3xl font-black leading-none tracking-tight text-white drop-shadow-sm sm:text-4xl">
        {matchSide.code}
      </span>
      <span className="mt-1 max-w-[7.5rem] truncate text-center text-xs font-extrabold text-white/72">
        {matchSide.name}
      </span>
      <ResultDots color={matchSide.color} />
    </div>
  );
}

export function MatchCard({ match }: { match: Match }) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const isLive = match.status === "IN_PLAY";
  const isFinished = match.status === "FINISHED";
  const homeColor = match.homeTeam.color || "#2563eb";
  const awayColor = match.awayTeam.color || "#f97316";

  const handleOpen = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setIsNavigating(true);
    router.push(`/match/${match.id}`);
  };

  return (
    <div className="relative">
      <Link href={`/match/${match.id}`} onClick={handleOpen} className="block group">
        <motion.article
          whileHover={{ y: -6, scale: 1.012 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", damping: 24, stiffness: 220 }}
          className="watch-card-shadow relative isolate min-h-[17rem] overflow-hidden rounded-[2.4rem] text-white"
          style={{
            background: `linear-gradient(90deg, ${homeColor} 0%, ${homeColor} 50%, ${awayColor} 50%, ${awayColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.28),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.24))]" />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/22" />
          <div className="absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-white/12 blur-3xl" />
          <div className="absolute -right-12 top-0 h-44 w-44 rounded-full bg-white/14 blur-3xl" />

          <div className="relative z-10 flex min-h-[17rem] flex-col p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-white/20 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/86 ring-1 ring-white/20 backdrop-blur-md">
                {match.group || match.tournament}
              </span>
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-[0.68rem] font-black uppercase tracking-wider text-white shadow-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  Ao vivo
                </span>
              ) : isFinished ? (
                <span className="rounded-full bg-slate-950/28 px-3 py-1 text-[0.68rem] font-black uppercase tracking-wider text-white/82 ring-1 ring-white/16">
                  Encerrado
                </span>
              ) : (
                <Countdown targetDate={match.date} />
              )}
            </div>

            <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-1 pt-7">
              <TeamFlag matchSide={match.homeTeam} align="left" />

              <div className="flex min-w-[5.2rem] flex-col items-center justify-center px-1 text-center">
                {isFinished || isLive ? (
                  <div className="rounded-[1.7rem] bg-white/22 px-4 py-3 text-center shadow-inner ring-1 ring-white/18 backdrop-blur-md">
                    <div className="font-heading text-4xl font-black tabular-nums leading-none tracking-tight text-white drop-shadow-sm">
                      {match.score?.home ?? 0}<span className="mx-1 text-white/58">:</span>{match.score?.away ?? 0}
                    </div>
                  </div>
                ) : (
                  <span className="rounded-2xl bg-white/18 px-4 py-2 font-heading text-xl font-black tracking-tight text-white/70 ring-1 ring-white/18 backdrop-blur-md">
                    VS
                  </span>
                )}
                <span className="mt-5 rounded-full bg-slate-950/18 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/88 ring-1 ring-white/12">
                  {formatMatchDateInBrazil(match.date)}
                </span>
                <span className="mt-2 font-heading text-2xl font-black leading-none tracking-tight text-white drop-shadow-sm">
                  {formatKickoffInBrazil(match.date)}
                </span>
              </div>

              <TeamFlag matchSide={match.awayTeam} align="right" />
            </div>
          </div>
        </motion.article>
      </Link>

      {isNavigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-20 flex items-center justify-center rounded-[2.4rem] bg-slate-950/75 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center text-center text-white">
            <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/20">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-black uppercase tracking-[0.2em]">Gerando análise</span>
            </div>
            <div className="mt-4 h-1.5 w-44 overflow-hidden rounded-full bg-white/20">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.1, ease: "easeInOut" }}
                className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-white to-transparent"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
