import { MOCK_MATCHES, Match } from "@/lib/data";
import { MatchCard } from "@/components/match/MatchCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBrazilDateParts, getTodayInBrazil } from "@/lib/date-utils";
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

export default async function Home() {
  const matches = (await getMatchData()).sort(byKickoff);
  const todayStr = getTodayInBrazil();

  const previousMatches = matches.filter((m) => getBrazilDateParts(m.date) < todayStr);
  const todayMatches = matches.filter((m) => getBrazilDateParts(m.date) === todayStr);
  const nextMatches = matches.filter((m) => getBrazilDateParts(m.date) > todayStr);

  return (
    <main className="app-shell selection:bg-indigo-200/80">
      <div className="color-orb left-[-6rem] top-16 bg-blue-400/45" />
      <div className="color-orb right-[-5rem] top-4 bg-orange-300/55 [animation-delay:1.2s]" />
      <div className="color-orb bottom-[-8rem] left-1/3 bg-emerald-300/35 [animation-delay:2.4s]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-16 pt-8 sm:px-6 md:pt-12">
        <header className="animate-fade-in mb-8">
          <div className="surface-container rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-5">
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
              <div className="relative hidden h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.8rem] border border-white/60 bg-white/35 shadow-2xl sm:flex">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.7),transparent_45%)]" />
                <Sparkles className="absolute left-3 top-4 h-7 w-7 text-slate-950/12" />
                <Sparkles className="absolute bottom-4 right-3 h-8 w-8 text-slate-950/10" />
                <Sparkles className="absolute right-2 top-2 h-5 w-5 text-slate-950/12" />
                <Sparkles className="h-8 w-8 text-amber-400" />
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
                  nextMatches.map((match) => <MatchCard key={match.id} match={match} />)
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
