import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Dumbbell,
  Flame,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Dumbbell,
    title: "Train with detail",
    text: "Workouts, sets, holds, added weight, assistance, tempo, and reusable templates.",
  },
  {
    icon: Target,
    title: "Master real skills",
    text: "Progression ladders turn handstands, levers, planche work, and custom skills into visible momentum.",
  },
  {
    icon: Users,
    title: "Stay accountable",
    text: "Share exactly what you choose with one trusted training partner and encourage each other.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-5 sm:px-7 lg:px-10">
      <div
        aria-hidden="true"
        className="iridescent absolute -left-28 top-20 h-72 w-72 rounded-full opacity-25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 top-64 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl"
      />

      <nav className="glass-panel relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-[22px] px-4 py-3 sm:px-5">
        <Link href="/" className="relative flex items-center gap-2.5" aria-label="Kinetic home">
          <span className="iridescent grid size-9 place-items-center rounded-[13px] text-white shadow-lg shadow-blue-500/20">
            <Dumbbell size={18} strokeWidth={2.6} aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-[-0.03em]">Kinetic</span>
        </Link>
        <div className="relative flex items-center gap-2">
          <Link
            href="/demo"
            className="hidden min-h-11 items-center rounded-xl px-3.5 text-sm font-semibold text-[var(--muted)] transition hover:bg-white/40 hover:text-[var(--foreground)] sm:inline-flex"
          >
            Live preview
          </Link>
          <Link href="/login" className="button-secondary !min-h-11 !rounded-xl !px-4 text-sm">
            Sign in
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 pb-20 pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:pt-24">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur-xl">
            <Sparkles size={15} aria-hidden="true" />
            Built for progress—not pressure
          </div>
          <h1 className="max-w-3xl text-[clamp(3.4rem,8vw,7.5rem)] font-[760] leading-[0.87] tracking-[-0.075em]">
            Stronger,
            <span className="text-gradient block pb-2">together.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)] sm:text-xl">
            Your private training space to log every rep, master calisthenics
            skills, and build consistency alongside someone you trust.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="button-primary px-5 sm:min-w-40">
              Create your space
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/demo" className="button-secondary px-5 sm:min-w-36">
              Explore the demo
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--muted)]">
            {["Private by default", "Real cloud sync", "Mobile ready"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="text-emerald-600" size={15} aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
          <div
            aria-hidden="true"
            className="iridescent absolute inset-10 rounded-[48px] opacity-40 blur-3xl"
          />
          <div className="glass-panel float-soft relative overflow-hidden rounded-[32px] p-3 sm:p-5">
            <div className="relative flex items-center justify-between border-b border-slate-400/10 px-2 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Thursday overview
                </p>
                <p className="mt-1 text-xl font-bold tracking-[-0.04em]">Momentum looks good</p>
              </div>
              <div className="grid size-11 place-items-center rounded-2xl bg-white/60 text-blue-600 shadow-sm">
                <BarChart3 size={20} aria-hidden="true" />
              </div>
            </div>
            <div className="relative mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric
                icon={<Flame size={18} aria-hidden="true" />}
                label="Current streak"
                value="12"
                unit="days"
                accent="from-orange-300/50 to-rose-300/40"
              />
              <Metric
                icon={<Dumbbell size={18} aria-hidden="true" />}
                label="This week"
                value="4"
                unit="workouts"
                accent="from-cyan-300/50 to-blue-300/40"
              />
              <Metric
                className="col-span-2 sm:col-span-1"
                icon={<Target size={18} aria-hidden="true" />}
                label="Skills achieved"
                value="7"
                unit="milestones"
                accent="from-violet-300/50 to-fuchsia-300/40"
              />
            </div>
            <div className="relative mt-3 grid gap-3 sm:grid-cols-[1.35fr_0.65fr]">
              <div className="glass-card min-h-56 rounded-[24px] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">Weekly training rhythm</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">You and your partner</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    +18%
                  </span>
                </div>
                <div className="mt-7 flex h-24 items-end gap-2.5" aria-label="Decorative weekly workout chart">
                  {[38, 58, 28, 77, 52, 90, 65].map((height, index) => (
                    <div key={height} className="flex flex-1 items-end gap-1">
                      <span
                        className="w-1/2 rounded-full bg-blue-500/80"
                        style={{ height: `${height}%` }}
                      />
                      <span
                        className="w-1/2 rounded-full bg-violet-400/45"
                        style={{ height: `${Math.max(22, height - (index % 3) * 15)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-[10px] font-medium text-[var(--muted)]">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                    <span key={`${day}-${index}`}>{day}</span>
                  ))}
                </div>
              </div>
              <div className="iridescent relative overflow-hidden rounded-[24px] p-5 text-white shadow-xl shadow-blue-500/20">
                <div className="absolute -right-8 -top-8 size-28 rounded-full border border-white/25" />
                <div className="absolute -right-2 top-5 size-16 rounded-full border border-white/20" />
                <p className="relative text-sm font-semibold text-white/80">Next milestone</p>
                <p className="relative mt-4 text-2xl font-bold tracking-[-0.05em]">L-sit</p>
                <p className="relative mt-1 text-sm text-white/75">15 sec clean hold</p>
                <div className="relative mt-8 h-2 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-3/4 rounded-full bg-white" />
                </div>
                <p className="relative mt-2 text-right text-xs font-semibold">75%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
              One shared rhythm
            </p>
            <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-[-0.045em] sm:text-4xl">
              Every useful signal. None of the noise.
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
            <ShieldCheck size={18} className="text-emerald-600" aria-hidden="true" />
            Row-level privacy protects every record
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="glass-card rounded-[26px] p-6 sm:p-7">
              <div className="iridescent relative grid size-12 place-items-center rounded-2xl text-white shadow-lg shadow-blue-500/15">
                <feature.icon size={21} aria-hidden="true" />
              </div>
              <h3 className="relative mt-6 text-xl font-bold tracking-[-0.035em]">
                {feature.title}
              </h3>
              <p className="relative mt-2 leading-7 text-[var(--muted)]">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  unit,
  accent,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  accent: string;
  className?: string;
}) {
  return (
    <div className={`glass-card overflow-hidden rounded-[23px] p-4 ${className}`}>
      <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${accent} blur-xl`} />
      <div className="relative flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
        <span className="text-blue-700">{icon}</span>
        {label}
      </div>
      <div className="relative mt-5 flex items-end gap-2">
        <span className="metric-number text-4xl font-bold">{value}</span>
        <span className="pb-1 text-xs font-medium text-[var(--muted)]">{unit}</span>
      </div>
    </div>
  );
}
