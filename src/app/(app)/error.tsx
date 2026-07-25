"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="glass-card mx-auto mt-16 max-w-lg rounded-[28px] p-8 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-600">
        <AlertTriangle size={24} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-[-0.04em]">
        This view needs another rep
      </h1>
      <p className="mt-2 leading-7 text-[var(--muted)]">
        Your data is safe. Reload this view, and if the problem continues check
        the connection status in Settings.
      </p>
      <button className="button-primary mt-6" type="button" onClick={reset}>
        <RefreshCw size={17} aria-hidden="true" />
        Try again
      </button>
    </section>
  );
}
