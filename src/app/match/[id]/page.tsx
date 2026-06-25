import { MOCK_MATCHES, Match } from "@/lib/data";
import { getPrediction } from "@/lib/ai";
import { AIAnalysis } from "@/components/insights/AIAnalysis";
import { formatKickoffInBrazil, formatMatchDateInBrazil } from "@/lib/date-utils";
import { Clock3, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { TeamFlagImage } from "@/components/match/TeamFlagImage";
import { BackButton } from "@/components/match/BackButton";

async function getMatch(id: string): Promise<Match | undefined> {
  try {
    const { getMatches } = await import("@/lib/world-cup-data");
    const matches = await getMatches();
    return matches.find((m) => m.id === id);
  } catch {
    return MOCK_MATCHES.find((m) => m.id === id);
  }
}

function TeamHero({ team }: { team: Match["homeTeam"] }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-white/32 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_18px_52px_-24px_rgba(15,23,42,0.72)] ring-1 ring-white/46 sm:h-32 sm:w-32">
        <TeamFlagImage
          team={team}
          className="h-full w-full object-cover"
          fallbackClassName="font-heading text-2xl font-black text-white drop-shadow"
        />
      </div>
      <span className="mt-5 font-heading text-5xl font-black leading-none tracking-[-0.06em] text-white drop-shadow-sm sm:text-7xl">
        {team.code}
      </span>
      <span className="mt-2 max-w-[9rem] text-sm font-black text-white/72 sm:max-w-[12rem]">
        {team.name}
      </span>
    </div>
  );
}

export default async function MatchPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const match = await getMatch(params.id);

  if (!match) {
    notFound();
  }

  const prediction = await getPrediction(match);
  const homeColor = match.homeTeam.color || "#2563eb";
  const awayColor = match.awayTeam.color || "#f97316";
  const hasScore = match.status === "FINISHED" || match.status === "IN_PLAY";

  return (
    <main
      className="relative min-h-screen overflow-hidden selection:bg-white/30"
      style={{
        background: `linear-gradient(90deg, ${homeColor} 0%, ${homeColor} 50%, ${awayColor} 50%, ${awayColor} 100%)`,
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.25),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.34))]" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-7 sm:px-6 sm:pt-10">
        <BackButton />

        <section className="pt-8 sm:pt-12">
          <div className="mb-8 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/22 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/86 ring-1 ring-white/20 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              {match.tournament}{match.group ? ` · ${match.group}` : ""}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-8">
            <TeamHero team={match.homeTeam} />

            <div className="flex min-w-[5.5rem] flex-col items-center text-center sm:min-w-[8rem]">
              {hasScore ? (
                <div className="rounded-[2rem] bg-white/22 px-4 py-4 shadow-inner ring-1 ring-white/22 backdrop-blur-md sm:px-6">
                  <div className="font-heading text-5xl font-black tabular-nums leading-none tracking-tight text-white drop-shadow-sm sm:text-7xl">
                    {match.score?.home ?? 0}<span className="mx-1 text-white/58">:</span>{match.score?.away ?? 0}
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.6rem] bg-white/18 px-5 py-3 font-heading text-2xl font-black text-white/72 ring-1 ring-white/18 backdrop-blur-md sm:text-3xl">
                  VS
                </div>
              )}

              <div className="mt-8 rounded-[1.7rem] bg-slate-950/22 px-5 py-4 text-white shadow-lg ring-1 ring-white/12 backdrop-blur-md">
                <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/62">
                  <Clock3 className="h-3.5 w-3.5" />
                  Brasil
                </div>
                <div className="mt-2 font-heading text-4xl font-black leading-none tabular-nums tracking-tight sm:text-5xl">
                  {formatKickoffInBrazil(match.date)}
                </div>
                <div className="mt-2 text-xs font-black uppercase tracking-wide text-white/70">
                  {formatMatchDateInBrazil(match.date)}
                </div>
              </div>
            </div>

            <TeamHero team={match.awayTeam} />
          </div>
        </section>

        <section className="mt-12 rounded-[2.4rem] bg-white/72 p-4 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.75)] ring-1 ring-white/55 backdrop-blur-2xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Análise preditiva</p>
              <h2 className="font-heading text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Leitura do jogo
              </h2>
            </div>
          </div>
          <AIAnalysis data={prediction} homeColor={homeColor} awayColor={awayColor} />
        </section>
      </div>
    </main>
  );
}
