import Link from "next/link";
import { ArrowLeft, Dumbbell } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="glass-panel w-full max-w-lg rounded-[30px] p-8 text-center sm:p-10">
        <span className="iridescent mx-auto grid size-14 place-items-center rounded-2xl text-white">
          <Dumbbell size={23} aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-blue-700">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em]">That route slipped away</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          The page may have moved, or the address is incomplete.
        </p>
        <Link href="/" className="button-primary mt-7">
          <ArrowLeft size={17} aria-hidden="true" />
          Back home
        </Link>
      </section>
    </main>
  );
}
