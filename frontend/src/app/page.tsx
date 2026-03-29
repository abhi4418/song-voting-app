import { Button } from "@/components/ui/button";
import Link from "next/link";

const features = [
  {
    title: "Live playlist voting",
    description: "Let your audience push the next track to the top instead of shouting requests across the room.",
  },
  {
    title: "Creator controls",
    description: "Playlist owners can manage the queue, remove bad picks, and keep the session moving.",
  },
  {
    title: "Fast setup",
    description: "Create an account, publish a playlist, and start collecting votes in a few minutes.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
              QueuePulse
            </div>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              A shared music queue built for events, college fests, cafes, and community hangouts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-10 rounded-[2rem] border border-white/70 bg-white/70 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur lg:grid-cols-[1.3fr_0.7fr] lg:p-12">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Built for collaborative listening
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold text-slate-900 sm:text-5xl">
                Turn playlist requests into a clean, vote-driven queue.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Creators stay in control while listeners add songs and vote in real time. No messy admin panel,
                no confusing steps, just a shared queue that feels alive.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Create your first playlist</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/signin">Join an existing queue</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-slate-950 p-6 text-slate-50 shadow-2xl">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-400">
              <span>Live snapshot</span>
              <span>now playing</span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-sm text-slate-300">Top voted track</div>
                <div className="mt-2 text-2xl font-semibold">Midnight City</div>
                <div className="mt-1 text-sm text-slate-400">23 votes</div>
              </div>
              <div className="space-y-3 rounded-2xl border border-white/10 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Heat Waves</span>
                  <span className="text-slate-400">18</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Levitating</span>
                  <span className="text-slate-400">14</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Blinding Lights</span>
                  <span className="text-slate-400">12</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[1.5rem] border border-white/70 bg-white/75 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
            >
              <h2 className="text-xl font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
