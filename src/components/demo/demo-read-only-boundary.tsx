"use client";

import type { FormEvent, MouseEvent, ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const demoSections = new Set([
  "dashboard",
  "workouts",
  "skills",
  "progress",
  "compare",
  "measurements",
  "goals",
  "activity",
  "settings",
]);

function toDemoRoute(href: string) {
  const url = new URL(href, window.location.origin);
  const section = url.pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const demoSection = demoSections.has(section) ? section : "dashboard";
  return `/demo/${demoSection}${url.search}${url.hash}`;
}

export function DemoReadOnlyBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();

  const keepLinksInDemo = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("/demo/")) return;

    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    event.stopPropagation();
    router.push(toDemoRoute(href));
  };

  const blockFormSubmit = (event: FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toast.info("This is a read-only preview", {
      description: "Create an account to save changes across devices.",
    });
  };

  return (
    <div onClickCapture={keepLinksInDemo} onSubmitCapture={blockFormSubmit}>
      <div className="mb-6 flex items-start gap-3 rounded-[22px] border border-cyan-200/70 bg-cyan-50/70 p-4 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-xl dark:border-cyan-300/15 dark:bg-cyan-300/[0.06] dark:text-slate-200">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-300">
          <ShieldCheck aria-hidden className="size-[18px]" />
        </span>
        <div>
          <p className="text-sm font-semibold">Read-only product preview</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Explore realistic data for Maya and Noah. Nothing you tap here
            changes an account or writes to the database.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
