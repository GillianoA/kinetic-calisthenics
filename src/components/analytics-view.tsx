"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  Filter,
  Flame,
  Medal,
  Trophy,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  consistencyCalendar as demoConsistencyCalendar,
  exerciseTrend as demoExerciseTrend,
  monthlyWorkoutTrend as demoMonthlyWorkoutTrend,
  personalRecords as demoPersonalRecords,
  type PersonalRecord,
} from "@/lib/demo-data";
import {
  EmptyState,
  GlassCard,
  PageHeader,
  SectionHeader,
  StatusPill,
  cn,
} from "./ui/primitives";
import { useUnitPreference } from "./unit-preference-provider";
import {
  kilogramsToDisplay,
  recordUnitToDisplay,
  recordValueToDisplay,
  weightUnit,
} from "@/lib/units";

type Range = "7d" | "30d" | "3m" | "6m" | "1y" | "all";
type UserFilter = "both" | "current" | "friend";

const ranges: Array<{ value: Range; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
];

export type MuscleDistributionItem = {
  name: string;
  value: number;
  color: string;
};

const demoMuscleDistribution: MuscleDistributionItem[] = [
  { name: "Pull", value: 31, color: "#06b6d4" },
  { name: "Push", value: 27, color: "#8b5cf6" },
  { name: "Core", value: 22, color: "#22c55e" },
  { name: "Legs", value: 14, color: "#f59e0b" },
  { name: "Mobility", value: 6, color: "#94a3b8" },
];

const chartTooltipStyle = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.75)",
  background: "rgba(255,255,255,.92)",
  boxShadow: "0 18px 40px -24px rgba(15,23,42,.55)",
  fontSize: 12,
};

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring h-11 min-w-36 appearance-none rounded-2xl border border-white/60 bg-white/55 py-0 pl-4 pr-10 text-xs font-semibold text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:focus:ring-cyan-400/10"
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
      />
    </label>
  );
}

function ConsistencyHeatmap({
  data,
}: {
  data: Array<{ day: number; intensity: number }>;
}) {
  const columns = Math.min(12, Math.max(1, data.length));
  return (
    <div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        role="img"
        aria-label="Twelve-week workout consistency heat map. Darker cells indicate more training."
      >
        {data.map((day) => (
          <span
            key={day.day}
            title={`Day ${day.day}: ${day.intensity} logged sessions`}
            className={cn(
              "aspect-square min-h-3 rounded-[4px]",
              day.intensity === 0 && "bg-slate-200/65 dark:bg-white/7",
              day.intensity === 1 && "bg-cyan-200 dark:bg-cyan-400/25",
              day.intensity === 2 && "bg-cyan-400 dark:bg-cyan-400/60",
              day.intensity === 3 && "bg-cyan-600 dark:bg-cyan-300",
            )}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
        Less
        {[0, 1, 2, 3].map((level) => (
          <span
            key={level}
            className={cn(
              "size-3 rounded-[3px]",
              level === 0 && "bg-slate-200/65 dark:bg-white/7",
              level === 1 && "bg-cyan-200 dark:bg-cyan-400/25",
              level === 2 && "bg-cyan-400 dark:bg-cyan-400/60",
              level === 3 && "bg-cyan-600 dark:bg-cyan-300",
            )}
          />
        ))}
        More
      </div>
    </div>
  );
}

export type AnalyticsSummary = {
  weeklyAverage: string;
  volumeChange: string;
  longestStreak: string;
  currentStreak: string;
  skillsAchieved: string;
  skillsThisPeriod: string;
};

export type AnalyticsViewProps = {
  monthlyTrend?: Array<{ label: string; current: number; friend: number }>;
  exerciseTrend?: Array<{
    label: string;
    pullUps: number;
    dips: number;
    hold: number;
    addedWeight: number;
  }>;
  heatmap?: Array<{ day: number; intensity: number }>;
  records?: PersonalRecord[];
  muscleDistribution?: MuscleDistributionItem[];
  summary?: AnalyticsSummary;
  friendName?: string;
  empty?: boolean;
};

export function AnalyticsView({
  monthlyTrend = demoMonthlyWorkoutTrend,
  exerciseTrend = demoExerciseTrend,
  heatmap = demoConsistencyCalendar,
  records = demoPersonalRecords,
  muscleDistribution = demoMuscleDistribution,
  friendName = "Partner",
  summary = {
    weeklyAverage: "3.7",
    volumeChange: "+18%",
    longestStreak: "11 d",
    currentStreak: "6 days",
    skillsAchieved: "7",
    skillsThisPeriod: "2",
  },
  empty = false,
}: AnalyticsViewProps) {
  const unitPreference = useUnitPreference();
  const displayedWeightUnit = weightUnit(unitPreference);
  const friendFirstName = friendName.split(" ")[0] || "Partner";
  const [range, setRange] = useState<Range>("6m");
  const [user, setUser] = useState<UserFilter>("both");
  const [exercise, setExercise] = useState("all");
  const [category, setCategory] = useState("all");

  const recordRows = useMemo(
    () =>
      records.filter((record) => {
        if (user === "both") return true;
        return record.userRole === user;
      }),
    [records, user],
  );
  const periodLength =
    range === "7d"
      ? 1
      : range === "30d"
        ? 1
        : range === "3m"
          ? 3
          : range === "6m"
            ? 6
            : range === "1y"
              ? 12
              : Number.POSITIVE_INFINITY;
  const visibleMonthlyTrend = monthlyTrend.slice(-periodLength);
  const visibleExerciseTrend = useMemo(
    () =>
      exerciseTrend.slice(-periodLength).map((point) => ({
        ...point,
        addedWeight: kilogramsToDisplay(
          point.addedWeight,
          unitPreference,
        ),
      })),
    [exerciseTrend, periodLength, unitPreference],
  );
  const heatmapDays =
    range === "7d"
      ? 7
      : range === "30d"
        ? 30
        : range === "3m"
          ? 84
          : heatmap.length;
  const visibleHeatmap = heatmap.slice(-heatmapDays);
  const visibleMuscleDistribution =
    category === "all"
      ? muscleDistribution
      : muscleDistribution.filter(
          (item) => item.name.toLowerCase() === category,
        );

  if (empty) {
    return (
      <div className="space-y-7">
        <PageHeader
          eyebrow="Progress"
          title="Patterns become progress"
          description="Charts and trends appear after you log your first workout."
        />
        <GlassCard className="p-6">
          <EmptyState
            icon={ChartNoAxesCombined}
            title="Not enough data yet"
            description="Log two or more workouts to unlock meaningful trends and comparisons."
          />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="analytics-view space-y-7">
      <PageHeader
        eyebrow="Progress"
        title="Your training, in motion"
        description="Find the patterns behind your strength, skill, and consistency."
        action={
          <div className="flex items-center gap-2">
            <StatusPill tone="current">You</StatusPill>
            <StatusPill tone="friend">{friendFirstName}</StatusPill>
          </div>
        }
      />

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="grid size-9 place-items-center rounded-xl bg-sky-100 text-sky-700 dark:bg-cyan-300/10 dark:text-cyan-300">
              <Filter aria-hidden className="size-4" />
            </span>
            Filters
          </div>
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1 lg:justify-end lg:overflow-visible lg:pb-0">
            <FilterSelect
              label="User"
              value={user}
              onChange={(value) => setUser(value as UserFilter)}
            >
              <option value="both">You + {friendFirstName}</option>
              <option value="current">You only</option>
              <option value="friend">{friendFirstName} only</option>
            </FilterSelect>
            <FilterSelect
              label="Exercise"
              value={exercise}
              onChange={setExercise}
            >
              <option value="all">All exercises</option>
              <option value="pull-up">Pull-up</option>
              <option value="dip">Dip</option>
              <option value="l-sit">L-sit</option>
            </FilterSelect>
            <FilterSelect
              label="Movement category"
              value={category}
              onChange={setCategory}
            >
              <option value="all">All movement groups</option>
              <option value="push">Push</option>
              <option value="pull">Pull</option>
              <option value="core">Core</option>
              <option value="legs">Legs</option>
            </FilterSelect>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100/60 p-1 sm:grid-cols-6 dark:bg-white/[0.04]">
          {ranges.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRange(item.value)}
              aria-pressed={range === item.value}
              className={cn(
                "focus-ring min-h-11 rounded-xl px-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                range === item.value
                  ? "bg-white text-slate-950 shadow-sm dark:bg-white/12 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </GlassCard>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Weekly average",
            value: summary.weeklyAverage,
            detail: "workouts per week",
            icon: CalendarDays,
            tone: "text-sky-600 bg-sky-100 dark:bg-cyan-300/10 dark:text-cyan-300",
          },
          {
            label: "Training volume",
            value: summary.volumeChange,
            detail: "versus previous period",
            icon: Activity,
            tone: "text-violet-600 bg-violet-100 dark:bg-violet-300/10 dark:text-violet-300",
          },
          {
            label: "Longest streak",
            value: summary.longestStreak,
            detail: `current streak: ${summary.currentStreak}`,
            icon: Flame,
            tone: "text-amber-600 bg-amber-100 dark:bg-amber-300/10 dark:text-amber-300",
          },
          {
            label: "Skills achieved",
            value: summary.skillsAchieved,
            detail: `${summary.skillsThisPeriod} in this period`,
            icon: Medal,
            tone: "text-emerald-600 bg-emerald-100 dark:bg-emerald-300/10 dark:text-emerald-300",
          },
        ].map(({ label, value, detail, icon: Icon, tone }) => (
          <GlassCard key={label} className="p-5">
            <span className={cn("grid size-9 place-items-center rounded-xl", tone)}>
              <Icon aria-hidden className="size-4" />
            </span>
            <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
              {value}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">
              {label}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">{detail}</p>
          </GlassCard>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Workout frequency"
            description="Monthly completed sessions"
            action={
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {range}
              </span>
            }
          />
          <div className="h-72" role="img" aria-label="Monthly workout frequency chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={visibleMonthlyTrend}
                margin={{ top: 8, right: 10, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="currentArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.38} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="friendArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(148,163,184,.16)" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                {user !== "friend" ? (
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="current"
                    name="You"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fill="url(#currentArea)"
                  />
                ) : null}
                {user !== "current" ? (
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="friend"
                    name={friendFirstName}
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fill="url(#friendArea)"
                  />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Muscle distribution"
            description="By completed working sets"
          />
          <div className="h-48" role="img" aria-label="Muscle group distribution chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={visibleMuscleDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={4}
                  stroke="transparent"
                >
                  {visibleMuscleDistribution.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {visibleMuscleDistribution.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between text-[11px]"
              >
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {item.value}%
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Strength progression"
            description={
              exercise === "all"
                ? "Repetition trends across core movements"
                : `Trend for ${exercise}`
            }
          />
          <div className="h-72" role="img" aria-label="Repetition progression line chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
              data={visibleExerciseTrend}
                margin={{ top: 8, right: 10, left: -24, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="rgba(148,163,184,.16)" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                />
                {exercise === "all" || exercise === "pull-up" ? (
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="pullUps"
                    name="Pull-ups"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                ) : null}
                {exercise === "all" || exercise === "dip" ? (
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="dips"
                    name="Dips"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Hold & weighted work"
            description="Static hold seconds and added load"
          />
          <div className="h-72" role="img" aria-label="Hold time and weighted exercise progression chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={visibleExerciseTrend}
                margin={{ top: 8, right: 10, left: -24, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="rgba(148,163,184,.16)" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                />
                {exercise === "all" || exercise === "l-sit" ? (
                  <Bar
                    isAnimationActive={false}
                    dataKey="hold"
                    name="Hold (sec)"
                    fill="#22c55e"
                    radius={[6, 6, 2, 2]}
                    maxBarSize={18}
                  />
                ) : null}
                {exercise !== "l-sit" ? (
                  <Bar
                    isAnimationActive={false}
                    dataKey="addedWeight"
                    name={`Added load (${displayedWeightUnit})`}
                    fill="#f59e0b"
                    radius={[6, 6, 2, 2]}
                    maxBarSize={18}
                  />
                ) : null}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Consistency calendar"
            description="Your last 12 weeks of recorded sessions"
            action={
              <StatusPill tone="success">
                {visibleHeatmap.reduce(
                  (total, day) => total + day.intensity,
                  0,
                )}{" "}
                sessions
              </StatusPill>
            }
          />
          <ConsistencyHeatmap data={visibleHeatmap} />
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Personal record history"
            description="Latest verified bests"
          />
          <ul className="space-y-2">
            {recordRows.map((record) => (
              <li
                key={record.id}
                className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/36 p-3 dark:border-white/8 dark:bg-white/[0.035]"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300">
                  <Trophy aria-hidden className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {record.exercise}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {record.date} ·{" "}
                    {record.userRole === "current" ? "You" : friendFirstName}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-950 dark:text-white">
                  {recordValueToDisplay(
                    record.value,
                    record.unit,
                    unitPreference,
                  )}{" "}
                  {recordUnitToDisplay(record.unit, unitPreference)}
                </p>
              </li>
            ))}
          </ul>
        </GlassCard>
      </section>
    </div>
  );
}
