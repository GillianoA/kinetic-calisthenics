"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  Clock3,
  Dumbbell,
  Flame,
  Medal,
  Plus,
  Scale,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ActivityItem,
  type PersonalRecord,
  type SkillSummary,
  dashboardDemo,
} from "@/lib/demo-data";
import { activityDetailToDisplay } from "@/lib/activity-format";
import {
  Avatar,
  EmptyState,
  GlassCard,
  InlineLink,
  MetricCard,
  PageHeader,
  ProgressRing,
  SectionHeader,
  StatusPill,
  cn,
} from "./ui/primitives";
import { useUnitPreference } from "./unit-preference-provider";
import {
  formatMetricWeightLabel,
  kilogramsToDisplay,
  recordUnitToDisplay,
  recordValueToDisplay,
  weightUnit,
} from "@/lib/units";

const quickActions = [
  {
    label: "Log workout",
    description: "Sets, reps & holds",
    href: "/workouts/new",
    icon: Dumbbell,
    color: "from-cyan-300/35 to-sky-300/10 text-sky-700 dark:text-cyan-300",
  },
  {
    label: "Update skill",
    description: "Record a milestone",
    href: "/skills/new",
    icon: Medal,
    color:
      "from-violet-300/35 to-fuchsia-300/10 text-violet-700 dark:text-violet-300",
  },
  {
    label: "Measurement",
    description: "Weight & body stats",
    href: "/measurements/new",
    icon: Scale,
    color:
      "from-emerald-300/35 to-teal-300/10 text-emerald-700 dark:text-emerald-300",
  },
];

function QuickActionGrid({
  onLogWorkout,
  onUpdateSkill,
  onRecordMeasurement,
}: {
  onLogWorkout?: () => void;
  onUpdateSkill?: () => void;
  onRecordMeasurement?: () => void;
}) {
  const callbacks = [onLogWorkout, onUpdateSkill, onRecordMeasurement];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {quickActions.map(({ label, description, href, icon: Icon, color }, index) => {
        const content = (
          <>
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br",
                color,
              )}
            >
              <Icon aria-hidden className="size-5" />
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-sm font-semibold text-slate-950 dark:text-white">
                {label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                {description}
              </span>
            </span>
            <ArrowRight
              aria-hidden
              className="ml-auto size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-500 dark:text-slate-600"
            />
          </>
        );
        const className =
          "focus-ring group relative flex min-h-24 items-center gap-4 overflow-hidden rounded-[22px] border border-white/60 bg-white/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.85)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.08]";
        return callbacks[index] ? (
          <button
            key={href}
            type="button"
            onClick={callbacks[index]}
            className={className}
          >
            {content}
          </button>
        ) : (
          <Link key={href} href={href} className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}

function WeeklyChart({
  data,
  friendName,
}: {
  data: typeof dashboardDemo.workoutTrend;
  friendName: string;
}) {
  return (
    <div className="h-56 w-full" role="img" aria-label="Workouts completed this week by user">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barGap={4}
          margin={{ top: 8, right: 0, left: -24, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="rgba(148,163,184,.18)" />
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
          <Tooltip
            cursor={{ fill: "rgba(125,211,252,.08)" }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,.75)",
              background: "rgba(255,255,255,.9)",
              boxShadow: "0 18px 40px -24px rgba(15,23,42,.5)",
              fontSize: 12,
            }}
          />
          <Bar
            isAnimationActive={false}
            dataKey="current"
            name="You"
            fill="#06b6d4"
            radius={[7, 7, 2, 2]}
            maxBarSize={20}
          />
          <Bar
            isAnimationActive={false}
            dataKey="friend"
            name={friendName}
            fill="#8b5cf6"
            radius={[7, 7, 2, 2]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SkillSummaryCard({ skill }: { skill: SkillSummary }) {
  const unitPreference = useUnitPreference();
  const percent =
    skill.totalStages > 0
      ? Math.round((skill.completedStages / skill.totalStages) * 100)
      : null;
  return (
    <div className="flex items-center gap-4 rounded-[21px] border border-white/55 bg-white/38 p-4 dark:border-white/8 dark:bg-white/[0.035]">
      <ProgressRing
        value={percent}
        size={70}
        strokeWidth={7}
        label={percent === null ? "—" : `${percent}%`}
        sublabel={percent === null ? "no ladder" : undefined}
        ariaLabel={
          percent === null
            ? `${skill.name}: no progression ladder defined`
            : `${skill.name}: ${percent}% of progression ladder complete`
        }
        tone={skill.category === "balance" ? "violet" : "cyan"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
            {skill.name}
          </h3>
          <StatusPill tone={skill.status === "achieved" ? "success" : "warning"}>
            {skill.status.replace("_", " ")}
          </StatusPill>
        </div>
        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
          {skill.progression} · best{" "}
          {formatMetricWeightLabel(skill.bestLabel, unitPreference)}
        </p>
        <p className="mt-2 text-[11px] font-medium text-sky-700 dark:text-cyan-300">
          {skill.totalStages > 0
            ? `${skill.completedStages} of ${skill.totalStages} stages complete`
            : "Define progression stages to enable a percentage"}
        </p>
      </div>
    </div>
  );
}

function ActivityPreview({ item }: { item: ActivityItem }) {
  const unitPreference = useUnitPreference();
  return (
    <article className="flex gap-3 border-b border-slate-200/55 py-4 last:border-0 last:pb-0 dark:border-white/8">
      <Avatar
        initials={item.userInitials}
        name={item.userName}
        role={item.userRole}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {item.title}
          </p>
          <span className="shrink-0 text-[10px] text-slate-400">
            {item.userRole === "friend" ? "Friend" : "You"}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {activityDetailToDisplay(item, unitPreference)}
        </p>
      </div>
    </article>
  );
}

function RecordRow({
  record,
  friendName,
}: {
  record: PersonalRecord;
  friendName: string;
}) {
  const unitPreference = useUnitPreference();
  const displayedValue = recordValueToDisplay(
    record.value,
    record.unit,
    unitPreference,
  );
  const displayedDelta =
    record.delta
      ? recordValueToDisplay(record.delta, record.unit, unitPreference)
      : record.delta;
  const displayedUnit = recordUnitToDisplay(record.unit, unitPreference);
  return (
    <li className="flex items-center gap-3 border-b border-slate-200/55 py-3.5 last:border-0 dark:border-white/8">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-100/75 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300">
        <Trophy aria-hidden className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
          {record.exercise}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {record.userRole === "current" ? "You" : friendName} · {record.date}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-950 dark:text-white">
          {displayedValue} {displayedUnit}
        </p>
        {displayedDelta ? (
          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
            +{displayedDelta}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export type DashboardViewProps = {
  data?: typeof dashboardDemo;
  isEmpty?: boolean;
  onLogWorkout?: () => void;
  onUpdateSkill?: () => void;
  onRecordMeasurement?: () => void;
};

export function DashboardView({
  data = dashboardDemo,
  isEmpty = false,
  onLogWorkout,
  onUpdateSkill,
  onRecordMeasurement,
}: DashboardViewProps) {
  const unitPreference = useUnitPreference();
  const friendFirstName = data.friend.displayName.split(" ")[0] || "Partner";
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
  const ownWeeklySessions = data.workoutTrend.reduce(
    (total, point) => total + point.current,
    0,
  );
  const friendWeeklySessions = data.workoutTrend.reduce(
    (total, point) => total + point.friend,
    0,
  );
  const recentOwnWorkouts = data.workouts.filter(
    (workout) =>
      workout.userRole === "current" &&
      new Date(workout.date).getTime() >=
        now.getTime() - 30 * 24 * 60 * 60 * 1000,
  ).length;
  const hasPlannedWorkout =
    data.upcomingWorkout.title !== "Plan your next session";
  if (isEmpty) {
    return (
      <div className="space-y-7">
        <PageHeader
          eyebrow="Your training space"
          title={`Welcome, ${data.currentUser.displayName.split(" ")[0]}`}
          description="Your dashboard will come alive as soon as you record a session."
        />
        <GlassCard className="p-5 sm:p-7">
          <EmptyState
            icon={Dumbbell}
            title="Your first session starts here"
            description="Log a workout, update a skill, or add a body measurement. Every entry is securely saved and available across your devices."
            action={
              <Link
                href="/workouts/new"
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
              >
                <Plus aria-hidden className="size-4" />
                Log first workout
              </Link>
            }
          />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="dashboard-view space-y-7 sm:space-y-9">
      <PageHeader
        eyebrow={dateLabel}
        title={`${greeting}, ${data.currentUser.displayName.split(" ")[0]}`}
        description="Keep the next session intentional and let the long-term pattern do the talking."
        action={
          <div className="hidden items-center gap-2 sm:flex">
            <StatusPill tone="current">You</StatusPill>
            <StatusPill tone="friend">{data.friend.displayName}</StatusPill>
          </div>
        }
      />

      <QuickActionGrid
        onLogWorkout={onLogWorkout}
        onUpdateSkill={onUpdateSkill}
        onRecordMeasurement={onRecordMeasurement}
      />

      <section aria-label="Training overview">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Current streak"
            value={`${data.stats.streak} days`}
            detail="Consecutive training days"
            icon={Flame}
            accent="amber"
          />
          <MetricCard
            label="Workouts this week"
            value={data.stats.workoutsThisWeek}
            detail={`${ownWeeklySessions} completed since Monday`}
            icon={CalendarCheck2}
            accent="cyan"
          />
          <MetricCard
            label="Total workouts"
            value={data.stats.totalWorkouts}
            detail={`${recentOwnWorkouts} in the last 30 days`}
            icon={Dumbbell}
            accent="violet"
          />
          <MetricCard
            label="Current body weight"
            value={
              data.stats.currentWeight > 0
                ? `${kilogramsToDisplay(data.stats.currentWeight, unitPreference)} ${weightUnit(unitPreference)}`
                : "Not recorded"
            }
            detail="Latest private measurement"
            icon={Scale}
            accent="emerald"
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.8fr)]">
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Weekly consistency"
            description="Completed sessions since Monday"
            action={
              <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-cyan-500" /> You
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-violet-500" />{" "}
                  {friendFirstName}
                </span>
              </div>
            }
          />
          <WeeklyChart
            data={data.workoutTrend}
            friendName={friendFirstName}
          />
          <div className="mt-2 flex items-center justify-between rounded-2xl bg-sky-50/70 px-4 py-3 text-xs dark:bg-cyan-300/[0.06]">
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-950 dark:text-white">
                A shared week at a glance.
              </span>{" "}
              You logged {ownWeeklySessions}; {friendFirstName} logged{" "}
              {friendWeeklySessions}.
            </p>
            <Sparkles
              aria-hidden
              className="size-4 shrink-0 text-sky-500 dark:text-cyan-300"
            />
          </div>
        </GlassCard>

        <GlassCard elevated className="p-5 sm:p-6">
          <SectionHeader
            title="Up next"
            description="Your planned session"
            action={
              <StatusPill tone={hasPlannedWorkout ? "warning" : "neutral"}>
                {hasPlannedWorkout ? "Planned" : "Open"}
              </StatusPill>
            }
          />
          <div className="relative overflow-hidden rounded-[22px] border border-white/60 bg-gradient-to-br from-sky-100/90 via-white/45 to-violet-100/65 p-5 dark:border-white/10 dark:from-cyan-400/10 dark:via-white/[0.03] dark:to-violet-400/10">
            <span
              aria-hidden
              className="absolute -right-5 -top-8 size-32 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-400/15"
            />
            <div className="relative">
              <span className="grid size-11 place-items-center rounded-2xl border border-white/70 bg-white/60 text-sky-700 dark:border-white/10 dark:bg-white/8 dark:text-cyan-300">
                <Dumbbell aria-hidden className="size-5" />
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                {data.upcomingWorkout.title}
              </h3>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CalendarCheck2 aria-hidden className="size-3.5" />
                  {data.upcomingWorkout.dateLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock3 aria-hidden className="size-3.5" />
                  {data.upcomingWorkout.durationLabel}
                </span>
              </div>
              <Link
                href={hasPlannedWorkout ? "/workouts?status=planned" : "/workouts/new"}
                className="focus-ring mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
              >
                {hasPlannedWorkout ? "View planned sessions" : "Plan a session"}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Skill momentum"
            description="Progress uses the stages in each skill ladder."
            action={<InlineLink href="/skills">All skills</InlineLink>}
          />
          <div className="space-y-3">
            {data.skills.slice(0, 3).map((skill) => (
              <SkillSummaryCard key={skill.id} skill={skill} />
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Recent records"
            description="Your circle’s latest breakthroughs"
            action={<InlineLink href="/progress?tab=records">History</InlineLink>}
          />
          {data.records.length ? (
            <ul>
              {data.records.slice(0, 4).map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  friendName={friendFirstName}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Trophy}
              title="Records are waiting"
              description="Mark a set as a personal record to see it here."
            />
          )}
        </GlassCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Friend activity"
            description={`Shared updates from ${data.friend.displayName}`}
            action={<InlineLink href="/activity">Activity feed</InlineLink>}
          />
          <div>
            {data.activities
              .filter((item) => item.userRole === "friend")
              .slice(0, 3)
              .map((item) => (
                <ActivityPreview key={item.id} item={item} />
              ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="This week"
            description="A quick training pulse"
          />
          <dl className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-white/45 p-4 dark:bg-white/[0.04]">
              <dt className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Activity aria-hidden className="size-4 text-sky-500" />
                Training volume
              </dt>
              <dd className="text-sm font-semibold text-slate-950 dark:text-white">
                {data.stats.weeklyVolume.toLocaleString()} reps
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/45 p-4 dark:bg-white/[0.04]">
              <dt className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Medal aria-hidden className="size-4 text-violet-500" />
                Skill completion
              </dt>
              <dd className="text-sm font-semibold text-slate-950 dark:text-white">
                {data.stats.skillProgress}%
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/45 p-4 dark:bg-white/[0.04]">
              <dt className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <UserRound aria-hidden className="size-4 text-emerald-500" />
                Friend connection
              </dt>
              <dd>
                <StatusPill tone="success">In sync</StatusPill>
              </dd>
            </div>
          </dl>
        </GlassCard>
      </section>
    </div>
  );
}
