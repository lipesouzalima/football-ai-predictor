import { MOCK_MATCHES, Match } from "@/lib/data";
import { MatchCard } from "@/components/match/MatchCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMatchDateInBrazil, getBrazilDateParts, getTodayInBrazil } from "@/lib/date-utils";
import { CalendarDays, RadioTower, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

async function getMatchData(): Promise<Match[]> {
  try {
    const { getMatches } = await import("@/lib/world-cup-data");
    return await getMatches();
  } catch {
    return MOCK_MATCHES;
  }
}

function byKickoff(a: Match, b: Match) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function groupMatchesByDay(matches: Match[]) {
  return matches.reduce<Record<string, Match[]>>((acc, match) => {
    const day = getBrazilDateParts(match.date);
    if (!acc[day]) acc[day] = [];
    acc[day].push(match);
    return acc;
  }, {});
}

export default async function Home() {
  const matches = (await getMatchData()).sort(byKickoff);
  const todayStr = getTodayInBrazil();

  const previousMatches = matches.filter((m) => getBrazilDateParts(m.date) < todayStr);
  const todayMatches = matches.filter((m) => getBrazilDateParts(m.date) === todayStr);
  const nextMatches = matches.filter((m) => getBrazilDateParts(m.date) > todayStr);
  const groupedNextMatches = groupMatchesByDay(nextMatches);

  return (
    <main className="app-shell selection:bg-indigo-200/80">
      <div className="color-orb left-[-6rem] top-16 bg-blue-400/45" />
      <div className="color-orb right-[-5rem] top-4 bg-orange-300/55 [animation-delay:1.2s]" />
      <div className="color-orb bottom-[-8rem] left-1/3 bg-emerald-300/35 [animation-delay:2.4s]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-16 pt-8 sm:px-6 md:pt-12">
        <header className="animate-fade-in mb-8">
          <div className="surface-container relative overflow-hidden rounded-[2rem] p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-0">
              <Sparkles className="absolute -right-2 top-4 h-24 w-24 text-slate-950/8" />
              <Sparkles className="absolute bottom-3 left-1/2 h-20 w-20 -translate-x-1/2 text-slate-950/7" />
            </div>
            <div className="relative z-10 flex items-start justify-between gap-5">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm ring-1 ring-white/70">
                  <RadioTower className="h-3.5 w-3.5 text-fuchsia-500" />
                  IA · Copa 2026
                </span>
                <h1 className="mt-5 max-w-xl font-heading text-5xl font-black leading-[0.92] tracking-[-0.07em] text-slate-950 text-balance sm:text-7xl">
                  IA Fut Predictor
                </h1>
                <p className="mt-4 max-w-lg text-base font-bold leading-relaxed text-slate-600 sm:text-lg">
                  Um app feito pra te ajudar a apostar certeiro com ajuda da IA - criado por Felipe Lima.
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="animate-slide-up" style={{ animationDelay: "0.08s", animationFillMode: "backwards" }}>
          <Tabs defaultValue="hoje" className="w-full">
            <TabsList className="surface-container grid w-full grid-cols-3 rounded-[1.6rem] p-1.5">
              <TabsTrigger value="anteriores" className="rounded-[1.2rem] text-xs font-black uppercase tracking-[0.14em] text-slate-500 transition-all data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-lg">
                Anteriores
              </TabsTrigger>
              <TabsTrigger value="hoje" className="rounded-[1.2rem] text-xs font-black uppercase tracking-[0.14em] text-slate-500 transition-all data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-lg">
                Hoje
              </TabsTrigger>
              <TabsTrigger value="proximos" className="rounded-[1.2rem] text-xs font-black uppercase tracking-[0.14em] text-slate-500 transition-all data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-lg">
                Próximos
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-5">
              <TabsContent value="anteriores" className="space-y-5 outline-none focus:ring-0">
                {previousMatches.length === 0 ? (
                  <EmptyState text="Nenhum jogo anterior encontrado." />
                ) : (
                  previousMatches.map((match) => <MatchCard key={match.id} match={match} />)
                )}
              </TabsContent>

              <TabsContent value="hoje" className="space-y-5 outline-none focus:ring-0">
                {todayMatches.length === 0 ? (
                  <EmptyState text="Nenhum jogo agendado para hoje no horário de Brasília." />
                ) : (
                  todayMatches.map((match) => <MatchCard key={match.id} match={match} />)
                )}
              </TabsContent>

              <TabsContent value="proximos" className="space-y-5 outline-none focus:ring-0">
                {nextMatches.length === 0 ? (
                  <EmptyState text="Nenhum próximo jogo encontrado." />
                ) : (
                  Object.entries(groupedNextMatches).map(([day, dayMatches]) => (
                    <div key={day} className="space-y-3">
                      <div className="flex items-center gap-3 px-1">
                        <div className="h-px flex-1 bg-slate-900/10" />
                        <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                          {formatMatchDateInBrazil(`${day}T12:00:00-03:00`)}
                        </span>
                        <div className="h-px flex-1 bg-slate-900/10" />
                      </div>
                      {dayMatches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  ))
                )}
              </TabsContent>
            </div>
          </Tabs>
        </section>
      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="surface-container flex flex-col items-center justify-center rounded-[2rem] px-8 py-16 text-center">
      <CalendarDays className="mb-4 h-10 w-10 text-slate-400" />
      <p className="text-sm font-extrabold text-slate-500">{text}</p>
    </div>
  );
}
