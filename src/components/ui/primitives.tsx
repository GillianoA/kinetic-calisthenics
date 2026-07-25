import {
  forwardRef,
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { ArrowUpRight, Inbox, LoaderCircle } from "lucide-react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function GlassCard({
  className,
  children,
  elevated = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-panel relative overflow-hidden rounded-[26px] border border-white/55 bg-white/58 shadow-[0_22px_70px_-36px_rgba(15,35,68,0.42),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl dark:border-white/12 dark:bg-[#0d1b32]/66 dark:shadow-[0_28px_80px_-40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]",
        elevated &&
          "glass-panel--elevated shadow-[0_26px_80px_-32px_rgba(45,140,255,0.32),inset_0_1px_0_rgba(255,255,255,0.95)]",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/35"
      />
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-sky-600 dark:text-cyan-300">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-slate-950 text-white shadow-[0_12px_28px_-12px_rgba(15,23,42,.75)] hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50",
  secondary:
    "border-white/65 bg-white/64 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,.85)] hover:bg-white/90 dark:border-white/15 dark:bg-white/8 dark:text-white dark:hover:bg-white/14",
  ghost:
    "border-transparent bg-transparent text-slate-600 hover:bg-white/60 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
  danger:
    "border-rose-200 bg-rose-50/80 text-rose-700 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>(function Button(
  { className, variant = "primary", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-slate-950",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
});

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = "cyan",
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  accent?: "cyan" | "violet" | "amber" | "emerald";
}) {
  const accents = {
    cyan: "from-cyan-400/22 via-sky-400/10 to-transparent text-sky-700 dark:text-cyan-300",
    violet:
      "from-violet-400/22 via-fuchsia-400/8 to-transparent text-violet-700 dark:text-violet-300",
    amber:
      "from-amber-300/25 via-orange-300/8 to-transparent text-amber-700 dark:text-amber-300",
    emerald:
      "from-emerald-300/22 via-teal-300/8 to-transparent text-emerald-700 dark:text-emerald-300",
  };
  return (
    <GlassCard className="metric-card group min-h-36 p-5">
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-80 transition-opacity group-hover:opacity-100",
          accents[accent],
        )}
      />
      <div className="relative flex h-full flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {label}
          </span>
          <span className="grid size-9 place-items-center rounded-xl border border-white/60 bg-white/55 dark:border-white/10 dark:bg-white/8">
            <Icon aria-hidden className="size-4" />
          </span>
        </div>
        <div>
          <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
            {value}
          </p>
          {detail ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {detail}
            </p>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "current" | "friend" | "success" | "warning";
}) {
  const tones = {
    neutral:
      "border-slate-200/80 bg-white/60 text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-slate-300",
    current:
      "border-cyan-200 bg-cyan-50/80 text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200",
    friend:
      "border-violet-200 bg-violet-50/80 text-violet-800 dark:border-violet-300/20 dark:bg-violet-300/10 dark:text-violet-200",
    success:
      "border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200",
    warning:
      "border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  name,
  role = "current",
  size = "md",
  avatarUrl,
}: {
  initials: string;
  name: string;
  role?: "current" | "friend";
  size?: "sm" | "md" | "lg";
  avatarUrl?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`${name}'s profile`}
      className={cn(
        "avatar-grid relative grid shrink-0 place-items-center rounded-full border border-white/70 font-bold shadow-[inset_0_1px_0_rgba(255,255,255,.8)]",
        role === "current"
          ? "bg-gradient-to-br from-cyan-200 via-sky-100 to-blue-200 text-sky-900"
          : "bg-gradient-to-br from-violet-200 via-fuchsia-100 to-indigo-200 text-violet-900",
        size === "sm" && "size-8 text-[10px]",
        size === "md" && "size-10 text-xs",
        size === "lg" && "size-14 text-sm",
      )}
      style={
        avatarUrl
          ? {
              backgroundImage: `url("${avatarUrl.replaceAll('"', "%22")}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              color: "transparent",
            }
          : undefined
      }
    >
      {initials}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className="empty-state flex min-h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300/80 bg-white/30 px-6 py-10 text-center dark:border-white/15 dark:bg-white/[0.03]">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-cyan-300/10 dark:text-cyan-300">
        <Icon aria-hidden className="size-5" />
      </span>
      <h3 className="font-semibold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function InlineLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      className="focus-ring inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-cyan-300 dark:hover:text-cyan-100"
    >
      {children}
      <ArrowUpRight aria-hidden className="size-3.5" />
    </a>
  );
}

export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
      {label}
    </span>
  );
}

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-2xl bg-slate-200/70 dark:bg-white/8 motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div
      aria-label="Loading dashboard"
      aria-busy="true"
      className="space-y-6"
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-[26px]" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-80 rounded-[26px]" />
        <Skeleton className="h-80 rounded-[26px]" />
      </div>
    </div>
  );
}

export function ProgressRing({
  value,
  size = 84,
  strokeWidth = 8,
  label,
  sublabel,
  ariaLabel,
  tone = "cyan",
}: {
  value: number | null;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  ariaLabel?: string;
  tone?: "cyan" | "violet" | "emerald" | "amber";
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeValue = value === null ? 0 : Math.max(0, Math.min(100, value));
  const dashOffset = circumference - (safeValue / 100) * circumference;
  const tones = {
    cyan: "stroke-cyan-500 dark:stroke-cyan-300",
    violet: "stroke-violet-500 dark:stroke-violet-300",
    emerald: "stroke-emerald-500 dark:stroke-emerald-300",
    amber: "stroke-amber-500 dark:stroke-amber-300",
  };

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        ariaLabel ??
        (value === null
          ? `${label ?? "Progress"}: no progression ladder`
          : `${label ?? "Progress"}: ${safeValue}%`)
      }
    >
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200/70 dark:stroke-white/8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn(
            "transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none",
            tones[tone],
          )}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold tracking-tight text-slate-950 dark:text-white">
          {label ?? `${Math.round(safeValue)}%`}
        </span>
        {sublabel ? (
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {sublabel}
          </span>
        ) : null}
      </span>
    </div>
  );
}
