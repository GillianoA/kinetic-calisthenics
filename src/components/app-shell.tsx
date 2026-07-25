"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  ChartSpline,
  ChevronDown,
  Dumbbell,
  Gauge,
  LogOut,
  Medal,
  Menu,
  Plus,
  Ruler,
  Search,
  Settings2,
  Target,
  Users,
  X,
} from "lucide-react";
import { Avatar, cn } from "./ui/primitives";
import { usePartnerRealtime } from "@/hooks/use-partner-realtime";
import { UnitPreferenceProvider } from "./unit-preference-provider";
import type { UnitPreference } from "@/lib/units";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: Gauge, mobile: true },
  { label: "Workouts", href: "/workouts", icon: Dumbbell, mobile: true },
  { label: "Skills", href: "/skills", icon: Medal, mobile: true },
  { label: "Progress", href: "/progress", icon: ChartSpline, mobile: true },
  { label: "Compare", href: "/compare", icon: Users, mobile: true },
  { label: "Measurements", href: "/measurements", icon: Ruler, mobile: false },
  { label: "Goals", href: "/goals", icon: Target, mobile: false },
  { label: "Activity", href: "/activity", icon: Activity, mobile: false },
];

const moreNavigation = [
  ...navigation.filter((item) => !item.mobile),
  { label: "Settings", href: "/settings", icon: Settings2, mobile: false },
];

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[15px] border border-white/70 bg-gradient-to-br from-cyan-200 via-sky-400 to-violet-400 shadow-[0_10px_30px_-10px_rgba(14,165,233,.8),inset_0_1px_0_rgba(255,255,255,.9)]"
    >
      <Dumbbell className="size-5 text-white drop-shadow-sm" strokeWidth={2.5} />
      <span className="absolute -right-2 -top-2 size-6 rounded-full bg-white/60 blur-md" />
    </span>
  );
}

export function AppShell({
  children,
  user = {
    name: "Maya Chen",
    initials: "MC",
    email: "maya@example.com",
  },
  notificationCount = 3,
  onSignOut,
  basePath = "",
  readOnly = false,
  theme = "system",
  realtimeEnabled = true,
  unitPreference = "metric",
}: {
  children: ReactNode;
  user?: { name: string; initials: string; email?: string };
  notificationCount?: number;
  onSignOut?: () => void;
  basePath?: string;
  readOnly?: boolean;
  theme?: "system" | "light" | "dark";
  realtimeEnabled?: boolean;
  unitPreference?: UnitPreference;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const morePanelRef = useRef<HTMLElement>(null);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  usePartnerRealtime(!readOnly && realtimeEnabled);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    applyTheme();
    if (theme !== "system") return;
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    if (!moreOpen) return;
    const panel = morePanelRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    const trigger = moreTriggerRef.current;
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [moreOpen]);
  const route = (href: string) => `${basePath}${href}`;

  const isActive = (href: string) => {
    const destination = route(href);
    return (
      pathname === destination || pathname.startsWith(`${destination}/`)
    );
  };

  return (
    <UnitPreferenceProvider preference={unitPreference}>
      <div className="app-shell relative min-h-dvh overflow-x-clip bg-[#eef7ff] text-slate-950 dark:bg-[#06101f] dark:text-white">
      <a
        href="#main-content"
        className="focus-ring fixed left-4 top-3 z-[200] -translate-y-20 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0"
      >
        Skip to content
      </a>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <span className="absolute -left-24 -top-28 size-[28rem] rounded-full bg-cyan-300/30 blur-[100px] dark:bg-cyan-500/12" />
        <span className="absolute right-[-14rem] top-[8%] size-[34rem] rounded-full bg-violet-300/25 blur-[120px] dark:bg-violet-500/10" />
        <span className="absolute bottom-[-18rem] left-[38%] size-[38rem] rounded-full bg-sky-200/35 blur-[120px] dark:bg-sky-500/8" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[270px] border-r border-white/45 bg-white/42 p-5 backdrop-blur-3xl lg:flex lg:flex-col dark:border-white/8 dark:bg-[#081426]/58">
        <Link
          href={route("/dashboard")}
          className="focus-ring flex items-center gap-3 rounded-2xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <BrandMark />
          <span>
            <span className="block text-base font-semibold tracking-[-0.03em]">
              Kinetic
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              train together
            </span>
          </span>
        </Link>

        <nav className="mt-10 flex-1" aria-label="Primary navigation">
          <ul className="space-y-1.5">
            {navigation.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={route(href)}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "focus-ring group relative flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                    isActive(href)
                      ? "bg-white/75 text-slate-950 shadow-[0_12px_32px_-20px_rgba(14,116,144,.55),inset_0_1px_0_rgba(255,255,255,.9)] dark:bg-white/10 dark:text-white"
                      : "text-slate-500 hover:bg-white/45 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-white",
                  )}
                >
                  {isActive(href) ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 h-6 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 to-sky-600 shadow-[0_0_16px_rgba(34,211,238,.85)]"
                    />
                  ) : null}
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-[18px]",
                      isActive(href) && "text-sky-600 dark:text-cyan-300",
                    )}
                  />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-5 rounded-[22px] border border-white/60 bg-white/46 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <Avatar initials={user.initials} name={user.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {user.email ?? "Your account"}
              </p>
            </div>
            {readOnly ? (
              <span className="rounded-lg bg-sky-100/80 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-sky-700 dark:bg-cyan-300/10 dark:text-cyan-300">
                Demo
              </span>
            ) : (
              <button
                type="button"
                aria-label="Sign out"
                onClick={onSignOut}
                className="focus-ring grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"
              >
                <LogOut aria-hidden className="size-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="relative lg:pl-[270px]">
        <header className="sticky top-0 z-30 border-b border-white/35 bg-[#eef7ff]/70 px-4 pb-3 pt-[max(.75rem,env(safe-area-inset-top))] backdrop-blur-2xl sm:px-7 lg:px-9 dark:border-white/8 dark:bg-[#06101f]/70">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
            <Link
              href={route("/dashboard")}
              aria-label="Kinetic dashboard"
              className="focus-ring flex items-center gap-2 rounded-2xl lg:hidden"
            >
              <BrandMark />
              <span className="hidden text-sm font-semibold tracking-tight min-[390px]:block">
                Kinetic
              </span>
            </Link>

            <form
              role="search"
              className="hidden w-full max-w-sm md:block"
              onSubmit={(event) => {
                event.preventDefault();
                const query = searchQuery.trim();
                if (!query) return;
                router.push(
                  `${route("/workouts")}?q=${encodeURIComponent(query)}`,
                );
              }}
            >
              <label className="relative block">
                <span className="sr-only">
                  Search workouts and exercises
                </span>
                <Search
                  aria-hidden
                  className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search workouts or exercises"
                  className="focus-ring h-11 w-full rounded-2xl border border-white/60 bg-white/48 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/6 dark:text-white dark:focus:border-cyan-400/40 dark:focus:ring-cyan-400/10"
                />
              </label>
            </form>

            <div className="ml-auto flex items-center gap-2">
              <Link
                href={
                  readOnly ? route("/workouts") : route("/workouts/new")
                }
                className="focus-ring hidden min-h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(15,23,42,.7)] transition hover:-translate-y-0.5 sm:inline-flex dark:bg-white dark:text-slate-950"
              >
                <Plus aria-hidden className="size-4" />
                {readOnly ? "Browse workouts" : "Log workout"}
              </Link>
              <Link
                href={route("/activity")}
                aria-label={
                  notificationCount
                    ? `${notificationCount} unread notifications`
                    : "Notifications"
                }
                className="focus-ring relative grid size-11 place-items-center rounded-2xl border border-white/60 bg-white/48 text-slate-600 transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
              >
                <Bell aria-hidden className="size-[18px]" />
                {notificationCount > 0 ? (
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-cyan-500 ring-2 ring-white dark:ring-[#0d1b32]" />
                ) : null}
              </Link>
              <Link
                href={route("/settings")}
                aria-label="Settings and profile"
                className="focus-ring flex h-11 items-center gap-2 rounded-2xl border border-white/60 bg-white/48 px-1.5 pr-2.5 transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/10 dark:bg-white/6"
              >
                <Avatar
                  initials={user.initials}
                  name={user.name}
                  size="sm"
                />
                <ChevronDown
                  aria-hidden
                  className="hidden size-3.5 text-slate-400 sm:block"
                />
              </Link>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto min-h-[calc(100dvh-68px)] w-full max-w-[1500px] px-4 pb-28 pt-7 sm:px-7 lg:px-9 lg:pb-10 lg:pt-9"
        >
          {children}
        </main>
      </div>

      {moreOpen ? (
        <div className="fixed inset-0 z-[55] lg:hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <section
            ref={morePanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            id="mobile-more-navigation"
            className="glass-panel absolute inset-x-3 bottom-[calc(88px+env(safe-area-inset-bottom))] rounded-[24px] p-3"
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <p
                id="mobile-more-title"
                className="text-sm font-semibold text-slate-950 dark:text-white"
              >
                More
              </p>
              <button
                type="button"
                aria-label="Close more navigation"
                onClick={() => setMoreOpen(false)}
                className="focus-ring grid size-11 place-items-center rounded-2xl text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-300"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <nav aria-label="More navigation">
              <ul className="grid grid-cols-2 gap-2">
                {moreNavigation.map(({ label, href, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={route(href)}
                      onClick={() => setMoreOpen(false)}
                      aria-current={isActive(href) ? "page" : undefined}
                      className={cn(
                        "focus-ring flex min-h-14 items-center gap-3 rounded-2xl px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                        isActive(href)
                          ? "bg-sky-50 text-sky-700 dark:bg-cyan-300/10 dark:text-cyan-200"
                          : "bg-white/45 text-slate-700 dark:bg-white/[0.05] dark:text-slate-200",
                      )}
                    >
                      <Icon aria-hidden className="size-[18px]" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </section>
        </div>
      ) : null}

      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] left-[max(.75rem,env(safe-area-inset-left))] right-[max(.75rem,env(safe-area-inset-right))] z-50 rounded-[24px] border border-white/65 bg-white/72 p-1.5 shadow-[0_18px_60px_-24px_rgba(15,23,42,.55),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-3xl lg:hidden dark:border-white/12 dark:bg-[#0b1930]/82"
      >
        <ul className="grid grid-cols-6">
          {navigation
            .filter((item) => item.mobile)
            .map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={route(href)}
                  aria-label={label}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "focus-ring flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                    isActive(href)
                      ? "bg-gradient-to-b from-white to-sky-50 text-sky-700 shadow-[0_8px_24px_-14px_rgba(2,132,199,.7)] dark:from-white/14 dark:to-cyan-300/5 dark:text-cyan-300"
                      : "text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white",
                  )}
                >
                  <Icon aria-hidden className="size-[19px]" />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          <li>
            <button
              ref={moreTriggerRef}
              type="button"
              aria-label="More"
              aria-expanded={moreOpen}
              aria-controls="mobile-more-navigation"
              onClick={() => setMoreOpen((open) => !open)}
              className={cn(
                "focus-ring flex min-h-[58px] w-full flex-col items-center justify-center gap-1 rounded-[18px] text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                moreNavigation.some((item) => isActive(item.href))
                  ? "bg-gradient-to-b from-white to-sky-50 text-sky-700 shadow-[0_8px_24px_-14px_rgba(2,132,199,.7)] dark:from-white/14 dark:to-cyan-300/5 dark:text-cyan-300"
                  : "text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white",
              )}
            >
              <Menu aria-hidden className="size-[19px]" />
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>
      </div>
    </UnitPreferenceProvider>
  );
}

export function MobileQuickAction({
  href = "/workouts/new",
  label = "Log workout",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="focus-ring fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 grid size-14 place-items-center rounded-full bg-slate-950 text-white shadow-[0_18px_40px_-14px_rgba(15,23,42,.75)] transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:hidden dark:bg-white dark:text-slate-950"
    >
      <Plus aria-hidden className="size-5" />
    </Link>
  );
}
