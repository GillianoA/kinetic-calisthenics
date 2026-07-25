"use client";

import { useMemo, useState } from "react";
import {
  Camera,
  ChevronDown,
  Eye,
  EyeOff,
  ImagePlus,
  LockKeyhole,
  Plus,
  Ruler,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  measurements as demoMeasurements,
  type MeasurementPoint,
} from "@/lib/demo-data";
import {
  Button,
  EmptyState,
  GlassCard,
  PageHeader,
  SectionHeader,
  StatusPill,
  cn,
} from "./ui/primitives";
import { useUnitPreference } from "./unit-preference-provider";
import {
  centimetersToDisplay,
  kilogramsToDisplay,
  lengthUnit,
  weightUnit,
} from "@/lib/units";

type MeasurementRange = "7d" | "30d" | "3m" | "6m" | "1y" | "all";
type MetricKey =
  | "weight"
  | "bodyFat"
  | "waist"
  | "chest"
  | "shoulders"
  | "upperArm";

const ranges: Array<{ value: MeasurementRange; label: string }> = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function MeasurementsView({
  measurements = demoMeasurements,
  photos = [],
  friendMeasurements = [],
  friendName,
  friendSharing = "none",
  friendPhotos = [],
  onAddMeasurement,
  onManagePrivacy,
  onAddPhoto,
  detailsShared = false,
}: {
  measurements?: MeasurementPoint[];
  photos?: Array<{ url: string; date: string }>;
  friendMeasurements?: MeasurementPoint[];
  friendName?: string;
  friendSharing?: "none" | "summary" | "detailed";
  friendPhotos?: Array<{ url: string; date: string }>;
  onAddMeasurement?: () => void;
  onManagePrivacy?: () => void;
  onAddPhoto?: () => void;
  detailsShared?: boolean;
}) {
  const unitPreference = useUnitPreference();
  const weightLabel = weightUnit(unitPreference);
  const lengthLabel = lengthUnit(unitPreference);
  const [range, setRange] = useState<MeasurementRange>("6m");
  const [metric, setMetric] = useState<MetricKey>("weight");
  const [showPhotos, setShowPhotos] = useState(false);
  const [person, setPerson] = useState<"current" | "friend">("current");
  const canonicalMeasurements =
    person === "friend" ? friendMeasurements : measurements;
  const activeMeasurements = useMemo(
    () =>
      canonicalMeasurements.map((measurement) => ({
        ...measurement,
        weight:
          measurement.weight == null
            ? null
            : kilogramsToDisplay(measurement.weight, unitPreference),
        waist:
          measurement.waist == null
            ? undefined
            : centimetersToDisplay(measurement.waist, unitPreference),
        chest:
          measurement.chest == null
            ? undefined
            : centimetersToDisplay(measurement.chest, unitPreference),
        shoulders:
          measurement.shoulders == null
            ? undefined
            : centimetersToDisplay(measurement.shoulders, unitPreference),
        upperArm:
          measurement.upperArm == null
            ? undefined
            : centimetersToDisplay(measurement.upperArm, unitPreference),
        forearm:
          measurement.forearm == null
            ? undefined
            : centimetersToDisplay(measurement.forearm, unitPreference),
        thigh:
          measurement.thigh == null
            ? undefined
            : centimetersToDisplay(measurement.thigh, unitPreference),
        calf:
          measurement.calf == null
            ? undefined
            : centimetersToDisplay(measurement.calf, unitPreference),
      })),
    [canonicalMeasurements, unitPreference],
  );
  const activePhotos = person === "friend" ? friendPhotos : photos;
  const activeDetailsShared =
    person === "friend" ? friendSharing === "detailed" : detailsShared;

  const metricOptions: Array<{
    value: MetricKey;
    label: string;
    unit: string;
  }> = [
    { value: "weight", label: "Body weight", unit: weightLabel },
    { value: "bodyFat", label: "Body fat", unit: "%" },
    { value: "waist", label: "Waist", unit: lengthLabel },
    { value: "chest", label: "Chest", unit: lengthLabel },
    { value: "shoulders", label: "Shoulders", unit: lengthLabel },
    { value: "upperArm", label: "Upper arm", unit: lengthLabel },
  ];
  const selectedMetric =
    metricOptions.find((item) => item.value === metric) ?? metricOptions[0];

  const visibleMeasurements = useMemo(() => {
    if (range === "all" || activeMeasurements.length === 0) {
      return activeMeasurements;
    }
    const days =
      range === "7d"
        ? 7
        : range === "30d"
          ? 30
          : range === "3m"
            ? 90
            : range === "6m"
              ? 182
              : 365;
    const newest = new Date(
      `${activeMeasurements.at(-1)?.date}T12:00:00Z`,
    );
    const cutoff = new Date(newest);
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    return activeMeasurements.filter(
      (measurement) =>
        new Date(`${measurement.date}T12:00:00Z`) >= cutoff,
    );
  }, [activeMeasurements, range]);

  const chartData = useMemo(
    () =>
      visibleMeasurements.map((measurement) => ({
        ...measurement,
        label: formatDateLabel(measurement.date),
      })),
    [visibleMeasurements],
  );

  const latest = activeMeasurements.at(-1);
  const previous = activeMeasurements.at(-2);

  if (!latest) {
    return (
      <div className="space-y-7">
        <PageHeader
          eyebrow="Measurements"
          title={
            person === "friend"
              ? `${friendName ?? "Your partner"} has not shared measurements`
              : "Your body, measured with context"
          }
          description={
            person === "friend"
              ? "Only explicitly shared measurement summaries or details appear here."
              : "Measurements stay private until you explicitly share them."
          }
        />
        {friendName ? (
          <GlassCard className="flex gap-1 p-1.5">
            {[
              { value: "current" as const, label: "You" },
              {
                value: "friend" as const,
                label: friendName.split(" ")[0] || "Partner",
              },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPerson(option.value)}
                aria-pressed={person === option.value}
                className={cn(
                  "focus-ring min-h-10 flex-1 rounded-xl px-4 text-xs font-semibold",
                  person === option.value
                    ? "bg-white text-slate-950 shadow-sm dark:bg-white/12 dark:text-white"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                {option.label}
              </button>
            ))}
          </GlassCard>
        ) : null}
        <GlassCard className="p-6">
          <EmptyState
            icon={Scale}
            title={
              person === "friend"
                ? "Nothing is shared in this view"
                : "Add your first measurement"
            }
            description={
              person === "friend"
                ? `${friendName ?? "Your partner"} controls the level of measurement detail you can see.`
                : "Start with body weight or record a complete set. You control what your friend can see."
            }
            action={
              person === "current" ? (
              <Button onClick={onAddMeasurement}>
                <Plus aria-hidden className="size-4" />
                Record measurement
              </Button>
              ) : undefined
            }
          />
        </GlassCard>
      </div>
    );
  }

  const rangeStart = visibleMeasurements[0];
  const change =
    rangeStart && latest[metric] != null && rangeStart[metric] != null
      ? Number(latest[metric]) - Number(rangeStart[metric])
      : null;

  return (
    <div className="measurements-view space-y-7">
      <PageHeader
        eyebrow="Measurements"
        title="Small changes, honest context"
        description="Track body measurements over time without turning a single number into the whole story."
        action={
          <Button onClick={onAddMeasurement}>
            <Plus aria-hidden className="size-4" />
            Record measurement
          </Button>
        }
      />

      {friendName ? (
        <GlassCard className="flex items-center justify-between gap-3 p-2">
          <div className="flex flex-1 gap-1 rounded-2xl bg-slate-100/55 p-1 dark:bg-white/[0.04]">
            {[
              { value: "current" as const, label: "Your measurements" },
              {
                value: "friend" as const,
                label: `${friendName.split(" ")[0] || "Partner"}’s shared view`,
              },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setPerson(option.value);
                  setShowPhotos(false);
                }}
                aria-pressed={person === option.value}
                className={cn(
                  "focus-ring min-h-10 flex-1 rounded-xl px-3 text-[11px] font-semibold",
                  person === option.value
                    ? "bg-white text-slate-950 shadow-sm dark:bg-white/12 dark:text-white"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </GlassCard>
      ) : null}

      <GlassCard className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid size-10 place-items-center rounded-2xl",
              activeDetailsShared
                ? "bg-violet-100 text-violet-700 dark:bg-violet-300/10 dark:text-violet-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300",
            )}
          >
            {activeDetailsShared ? (
              <Eye aria-hidden className="size-[18px]" />
            ) : (
              <LockKeyhole aria-hidden className="size-[18px]" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              {person === "friend"
                ? friendSharing === "detailed"
                  ? `${friendName ?? "Your partner"} shares detailed measurements`
                  : `${friendName ?? "Your partner"} shares a summary`
                : activeDetailsShared
                  ? "Detailed measurements shared"
                  : "Detailed measurements are private"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              {person === "friend"
                ? friendSharing === "detailed"
                  ? "All partner-visible body metrics can be viewed."
                  : "Only weight and body-fat trends are available."
                : activeDetailsShared
                  ? "Your accountability partner can view these details."
                  : "Your partner sees only the summary you allow."}
            </p>
          </div>
        </div>
        {person === "current" && onManagePrivacy ? (
          <button
            type="button"
            onClick={onManagePrivacy}
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-xs font-semibold text-sky-700 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-cyan-300 dark:hover:bg-cyan-300/10"
          >
            Manage privacy
          </button>
        ) : person === "current" ? (
          <a
            href="/settings#privacy"
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-xs font-semibold text-sky-700 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-cyan-300 dark:hover:bg-cyan-300/10"
          >
            Manage privacy
          </a>
        ) : null}
      </GlassCard>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Body weight",
            value:
              latest.weight == null
                ? "Not recorded"
                : `${latest.weight} ${weightLabel}`,
            delta:
              latest.weight != null && previous?.weight != null
                ? latest.weight - previous.weight
                : 0,
            icon: Scale,
            tone: "cyan",
          },
          {
            label: "Body fat",
            value:
              latest.bodyFat != null ? `${latest.bodyFat}%` : "Not recorded",
            delta:
              latest.bodyFat != null && previous?.bodyFat != null
                ? latest.bodyFat - previous.bodyFat
                : 0,
            icon: TrendingDown,
            tone: "violet",
          },
          {
            label: "Waist",
            value:
              latest.waist != null
                ? `${latest.waist} ${lengthLabel}`
                : "Not recorded",
            delta:
              latest.waist != null && previous?.waist != null
                ? latest.waist - previous.waist
                : 0,
            icon: Ruler,
            tone: "emerald",
          },
          {
            label: "Chest",
            value:
              latest.chest != null
                ? `${latest.chest} ${lengthLabel}`
                : "Not recorded",
            delta:
              latest.chest != null && previous?.chest != null
                ? latest.chest - previous.chest
                : 0,
            icon: TrendingUp,
            tone: "amber",
          },
        ].map(({ label, value, delta, icon: Icon, tone }) => {
          const toneClass = {
            cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-300",
            violet:
              "bg-violet-100 text-violet-700 dark:bg-violet-300/10 dark:text-violet-300",
            emerald:
              "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300",
            amber:
              "bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300",
          }[tone];
          return (
            <GlassCard key={label} className="p-5">
              <div className="flex items-start justify-between">
                <span className={cn("grid size-10 place-items-center rounded-2xl", toneClass)}>
                  <Icon aria-hidden className="size-[18px]" />
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    delta < 0
                      ? "text-emerald-600 dark:text-emerald-300"
                      : delta > 0
                        ? "text-sky-600 dark:text-cyan-300"
                        : "text-slate-400",
                  )}
                >
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)}
                </span>
              </div>
              <p className="mt-5 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {label}
              </p>
            </GlassCard>
          );
        })}
      </section>

      <GlassCard className="p-5 sm:p-7">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeader
            title={`${selectedMetric.label} trend`}
            description={`Last reading · ${formatDateLabel(latest.date)}`}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Measurement shown in chart</span>
              <select
                value={metric}
                onChange={(event) => setMetric(event.target.value as MetricKey)}
                className="focus-ring h-11 min-w-40 appearance-none rounded-xl border border-white/60 bg-white/55 pl-3 pr-9 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              >
                {metricOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              />
            </label>
            <div className="flex rounded-xl bg-slate-100/65 p-1 dark:bg-white/[0.04]">
              {ranges.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRange(item.value)}
                  aria-pressed={range === item.value}
                  className={cn(
                    "focus-ring min-h-11 rounded-lg px-2.5 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                    range === item.value
                      ? "bg-white text-slate-950 shadow-sm dark:bg-white/12 dark:text-white"
                      : "text-slate-600 dark:text-slate-300",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div
          className="h-72"
          role="img"
          aria-label={`${selectedMetric.label} trend in ${selectedMetric.unit}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="measurementGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(148,163,184,.16)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
              />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
              />
              <Tooltip
                formatter={(value) => [`${value} ${selectedMetric.unit}`, selectedMetric.label]}
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,.75)",
                  background: "rgba(255,255,255,.92)",
                  fontSize: 11,
                }}
              />
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey={metric}
                name={selectedMetric.label}
                connectNulls
                stroke="#06b6d4"
                strokeWidth={3}
                fill="url(#measurementGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-2xl bg-sky-50/65 px-4 py-3 dark:bg-cyan-300/[0.05]">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Change across the selected range
          </p>
          <p className="text-sm font-bold text-slate-950 dark:text-white">
            {change == null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)} ${selectedMetric.unit}`}
          </p>
        </div>
      </GlassCard>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Latest detailed set"
            description={`Recorded ${formatDateLabel(latest.date)}`}
            action={
              <StatusPill tone="neutral">
                {unitPreference === "imperial" ? "Imperial units" : "Metric units"}
              </StatusPill>
            }
          />
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["Shoulders", latest.shoulders, lengthLabel],
              ["Upper arm", latest.upperArm, lengthLabel],
              ["Forearm", latest.forearm, lengthLabel],
              ["Thigh", latest.thigh, lengthLabel],
              ["Calf", latest.calf, lengthLabel],
              ["Body fat", latest.bodyFat, "%"],
            ].map(([label, value, unit]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between rounded-2xl border border-white/55 bg-white/36 px-4 py-3 dark:border-white/8 dark:bg-white/[0.03]"
              >
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {label}
                </dt>
                <dd className="text-sm font-semibold text-slate-950 dark:text-white">
                  {value != null ? `${value} ${unit}` : "—"}
                </dd>
              </div>
            ))}
          </dl>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Progress photos"
            description="Private unless you change photo visibility"
            action={
              <button
                type="button"
                onClick={() => setShowPhotos((value) => !value)}
                className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-600 hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-300 dark:hover:bg-white/8"
              >
                {showPhotos ? (
                  <EyeOff aria-hidden className="size-4" />
                ) : (
                  <Eye aria-hidden className="size-4" />
                )}
                {showPhotos ? "Hide" : "Reveal"}
              </button>
            }
          />
          {activePhotos.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {activePhotos.map((photo) => (
              <div
                key={photo.url}
                className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/55 bg-gradient-to-br from-sky-100 via-slate-100 to-violet-100 dark:border-white/8 dark:from-cyan-400/10 dark:via-white/5 dark:to-violet-400/10"
              >
                {showPhotos ? (
                  <div
                    role="img"
                    aria-label={`Progress photo from ${photo.date}`}
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url("${photo.url}")` }}
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-white/45 backdrop-blur-xl dark:bg-slate-950/25">
                    <LockKeyhole
                      aria-hidden
                      className="size-5 text-slate-400"
                    />
                  </div>
                )}
                <span className="absolute inset-x-2 bottom-2 rounded-lg bg-white/70 px-2 py-1 text-center text-[9px] font-semibold text-slate-600 backdrop-blur dark:bg-slate-950/55 dark:text-slate-300">
                  {photo.date}
                </span>
              </div>
            ))}
          </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300/70 bg-white/25 px-4 py-7 text-center dark:border-white/10 dark:bg-white/[0.02]">
              <Camera
                aria-hidden
                className="mx-auto size-6 text-slate-300 dark:text-slate-600"
              />
              <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                No progress photos yet
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Photos stay private until your sharing settings allow them.
              </p>
            </div>
          )}
          {person === "current" ? (
            <Button
              variant="secondary"
              className="mt-3 w-full"
              onClick={onAddPhoto}
            >
              <ImagePlus aria-hidden className="size-4" />
              Add photo
            </Button>
          ) : null}
        </GlassCard>
      </section>
    </div>
  );
}
