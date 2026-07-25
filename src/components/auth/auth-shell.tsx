import Link from "next/link";
import { Dumbbell, ShieldCheck, Sparkles } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-8 sm:px-6">
      <div
        aria-hidden="true"
        className="iridescent absolute -left-24 top-10 size-80 rounded-full opacity-25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-28 bottom-5 size-96 rounded-full bg-violet-400/20 blur-3xl"
      />
      <section className="glass-panel relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[30px] lg:grid-cols-[0.86fr_1.14fr]">
        <aside className="iridescent relative hidden min-h-[650px] overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 size-64 rounded-full border border-white/25"
          />
          <div
            aria-hidden="true"
            className="absolute -right-5 top-14 size-36 rounded-full border border-white/20"
          />
          <Link href="/" className="relative flex items-center gap-2.5 font-bold">
            <span className="grid size-10 place-items-center rounded-2xl bg-white/20 backdrop-blur-xl">
              <Dumbbell size={19} aria-hidden="true" />
            </span>
            Kinetic
          </Link>
          <div className="relative">
            <Sparkles size={28} className="mb-6 text-cyan-100" aria-hidden="true" />
            <p className="max-w-sm text-4xl font-bold leading-[1.05] tracking-[-0.055em]">
              Build strength that you can see.
            </p>
            <p className="mt-5 max-w-sm leading-7 text-white/76">
              One private space for honest training logs, clear skill milestones,
              and the right kind of accountability.
            </p>
          </div>
          <div className="relative flex items-center gap-2 text-sm font-medium text-white/80">
            <ShieldCheck size={18} aria-hidden="true" />
            Your records stay protected by database-level privacy
          </div>
        </aside>
        <div className="relative flex min-h-[610px] flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
          <Link
            href="/"
            className="mb-10 flex items-center gap-2.5 text-lg font-bold tracking-[-0.03em] lg:hidden"
          >
            <span className="iridescent grid size-9 place-items-center rounded-[13px] text-white">
              <Dumbbell size={17} aria-hidden="true" />
            </span>
            Kinetic
          </Link>
          <div className="max-w-md">
            <h1 className="text-3xl font-bold tracking-[-0.05em] sm:text-4xl">{title}</h1>
            <p className="mt-3 leading-7 text-[var(--muted)]">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
