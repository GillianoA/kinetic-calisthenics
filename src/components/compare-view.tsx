"use client";

import {
  Activity,
  Award,
  CalendarCheck2,
  CheckCircle2,
  Dumbbell,
  Flame,
  Hand,
  Medal,
  MessageCircleHeart,
  Sparkles,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import {
  accountability as demoAccountability,
  activities as demoActivities,
  challenges as demoChallenges,
  currentUser as demoCurrentUser,
  friendUser as demoFriendUser,
  personalRecords as demoPersonalRecords,
  type ActivityItem,
  type ChallengeSummary,
  type DemoProfile,
  type PersonalRecord,
} from "@/lib/demo-data";
import { activityDetailToDisplay } from "@/lib/activity-format";
import {
  Avatar,
  Button,
  EmptyState,
  GlassCard,
  PageHeader,
  ProgressRing,
  SectionHeader,
  StatusPill,
  cn,
} from "./ui/primitives";
import { useUnitPreference } from "./unit-preference-provider";
import {
  recordUnitToDisplay,
  recordValueToDisplay,
} from "@/lib/units";

export type ComparisonMetric = {
  label: string;
  icon: typeof Dumbbell;
  current: string;
  friend: string;
  context: string;
};

const demoMetrics: ComparisonMetric[] = [
  {
    label: "Workouts this week",
    icon: CalendarCheck2,
    current: "4",
    friend: "5",
    context: "Both planned targets met",
  },
  {
    label: "Current streak",
    icon: Flame,
    current: "6 days",
    friend: "8 days",
    context: "Active training streaks",
  },
  {
    label: "Total workouts",
    icon: Dumbbell,
    current: "80",
    friend: "84",
    context: "Since connecting",
  },
  {
    label: "Pull-up maximum",
    icon: Trophy,
    current: "12 reps",
    friend: "11 reps",
    context: "Strict-form personal best",
  },
  {
    label: "Push-up maximum",
    icon: Hand,
    current: "42 reps",
    friend: "47 reps",
    context: "Continuous strict set",
  },
  {
    label: "Dip maximum",
    icon: Activity,
    current: "17 reps",
    friend: "15 reps",
    context: "Parallel-bar strict set",
  },
  {
    label: "Longest static hold",
    icon: Timer,
    current: "31 sec",
    friend: "36 sec",
    context: "Any verified static skill",
  },
  {
    label: "Skills achieved",
    icon: Medal,
    current: "7",
    friend: "8",
    context: "Completed progression ladders",
  },
];

function ComparisonRow({
  metric,
  friendLabel,
}: {
  metric: ComparisonMetric;
  friendLabel: string;
}) {
  const Icon = metric.icon;
  return (
    <div className="comparison-row grid grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] items-center gap-2 border-b border-slate-200/55 py-4 last:border-0 dark:border-white/8 sm:grid-cols-[minmax(0,1fr)_minmax(180px,.8fr)_minmax(0,1fr)]">
      <div className="text-left sm:text-right">
        <p className="text-base font-bold text-cyan-700 dark:text-cyan-300">
          {metric.current}
        </p>
        <p className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">You</p>
      </div>
      <div className="text-center">
        <span className="mx-auto grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
          <Icon aria-hidden className="size-4" />
        </span>
        <p className="mt-2 hidden text-xs font-semibold text-slate-700 dark:text-slate-200 sm:block">
          {metric.label}
        </p>
        <p className="mt-0.5 hidden text-[9px] text-slate-400 sm:block">
          {metric.context}
        </p>
      </div>
      <div>
        <p className="text-right text-base font-bold text-violet-700 dark:text-violet-300 sm:text-left">
          {metric.friend}
        </p>
        <p className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">
          {friendLabel}
        </p>
      </div>
      <div className="col-span-3 mt-1 text-center sm:hidden">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {metric.label}
        </p>
        <p className="text-[9px] text-slate-400">{metric.context}</p>
      </div>
    </div>
  );
}

function ScoreBreakdown({
  title,
  role,
  values,
}: {
  title: string;
  role: "current" | "friend";
  values: typeof demoAccountability.current;
}) {
  const rows = [
    { label: "Weekly plan", value: values.planned, weight: 40 },
    { label: "Distinct training days", value: values.consistency, weight: 25 },
    { label: "Skill practice", value: values.skillPractice, weight: 20 },
    { label: "Workout logging", value: values.logging, weight: 15 },
  ];
  return (
    <div className="rounded-[22px] border border-white/55 bg-white/36 p-4 dark:border-white/8 dark:bg-white/[0.03]">
      <div className="flex items-center gap-3">
        <ProgressRing
          value={values.score}
          size={76}
          strokeWidth={7}
          label={String(values.score)}
          sublabel="score"
          tone={role === "current" ? "cyan" : "violet"}
        />
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            {title}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Transparent weekly check-in
          </p>
        </div>
      </div>
      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1.5 flex items-center justify-between text-[10px]">
              <dt className="text-slate-500 dark:text-slate-400">
                {row.label} · {row.weight}%
              </dt>
              <dd className="font-semibold text-slate-800 dark:text-white">
                {row.value}%
              </dd>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/8">
              <div
                className={cn(
                  "h-full rounded-full",
                  role === "current"
                    ? "bg-gradient-to-r from-cyan-400 to-sky-500"
                    : "bg-gradient-to-r from-violet-400 to-fuchsia-500",
                )}
                style={{ width: `${row.value}%` }}
              />
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function CompareView({
  currentProfile = demoCurrentUser,
  friendProfile = demoFriendUser,
  metrics = demoMetrics,
  accountabilityData = demoAccountability,
  challenges = demoChallenges,
  records = demoPersonalRecords,
  activityItems = demoActivities,
  onEncourage,
  onOpenChallenge,
}: {
  currentProfile?: DemoProfile;
  friendProfile?: DemoProfile;
  metrics?: ComparisonMetric[];
  accountabilityData?: typeof demoAccountability;
  challenges?: ChallengeSummary[];
  records?: PersonalRecord[];
  activityItems?: ActivityItem[];
  onEncourage?: (message: string) => void;
  onOpenChallenge?: (challenge: ChallengeSummary) => void;
}) {
  const unitPreference = useUnitPreference();
  return (
    <div className="compare-view space-y-7">
      <PageHeader
        eyebrow="Together"
        title="Two journeys, one shared rhythm"
        description="See where you can encourage each other. Kinetic never turns your progress into a public leaderboard."
        action={
          <Button onClick={() => onEncourage?.("Strong work")}>
            <MessageCircleHeart aria-hidden className="size-4" />
            Encourage {friendProfile.displayName.split(" ")[0]}
          </Button>
        }
      />

      <GlassCard elevated className="p-5 sm:p-7">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
            <Avatar
              initials={currentProfile.initials}
              name={currentProfile.displayName}
              size="lg"
            />
            <div className="mt-2 sm:ml-3 sm:mt-0">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {currentProfile.displayName}
              </p>
              <StatusPill tone="current">You</StatusPill>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="grid size-10 place-items-center rounded-full border border-white/70 bg-white/55 text-xs font-bold text-slate-400 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
              +
            </span>
            <span className="mt-2 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
              Connected
            </span>
          </div>
          <div className="flex flex-col items-center text-center sm:flex-row-reverse sm:text-right">
            <Avatar
              initials={friendProfile.initials}
              name={friendProfile.displayName}
              role="friend"
              size="lg"
            />
            <div className="mt-2 sm:mr-3 sm:mt-0">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {friendProfile.displayName}
              </p>
              <StatusPill tone="friend">Partner</StatusPill>
            </div>
          </div>
        </div>
      </GlassCard>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
        <GlassCard className="p-5 sm:p-7">
          <SectionHeader
            title="Side by side"
            description="Personal records and training habits, with context"
          />
          <div>
            {metrics.map((metric) => (
              <ComparisonRow
                key={metric.label}
                metric={metric}
                friendLabel={friendProfile.displayName.split(" ")[0]}
              />
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Weekly accountability"
            description="A shared signal—not a judgment"
            action={<Sparkles aria-hidden className="size-4 text-sky-500" />}
          />
          <div className="space-y-3">
            <ScoreBreakdown
              title="Your week"
              role="current"
              values={accountabilityData.current}
            />
            <ScoreBreakdown
              title={`${friendProfile.displayName.split(" ")[0]}’s week`}
              role="friend"
              values={accountabilityData.friend}
            />
          </div>
          <details className="mt-4 rounded-2xl bg-slate-50/70 p-4 dark:bg-white/[0.035]">
            <summary className="focus-ring cursor-pointer text-xs font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-white">
              Exactly how the score works
            </summary>
            <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              {accountabilityData.explanation} Each component is completion percentage
              multiplied by its visible weight, capped at that weight, then rounded.
            </p>
          </details>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Shared challenges"
            description="Make consistency collaborative"
            action={
              <StatusPill tone={challenges.length ? "success" : "neutral"}>
                {challenges.length} active
              </StatusPill>
            }
          />
          {challenges.length ? (
            <div className="space-y-4">
              {challenges.map((challenge) => (
              <article
                key={challenge.id}
                className="rounded-[22px] border border-white/55 bg-white/36 p-4 dark:border-white/8 dark:bg-white/[0.03]"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-sky-100 text-violet-700 dark:from-violet-300/10 dark:to-cyan-300/10 dark:text-violet-300">
                    <Target aria-hidden className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                      {challenge.title}
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                      {challenge.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    {
                      label: "You",
                      value: challenge.currentUserProgress,
                      color: "bg-cyan-500",
                    },
                    {
                      label: friendProfile.displayName.split(" ")[0],
                      value: challenge.friendProgress,
                      color: "bg-violet-500",
                    },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="mb-1.5 flex justify-between text-[10px]">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {row.label}
                        </span>
                        <span className="text-slate-400">
                          {row.value}/{challenge.target} {challenge.unit}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/65 dark:bg-white/8">
                        <div
                          className={cn("h-full rounded-full", row.color)}
                          style={{
                            width: `${Math.min(
                              100,
                              (row.value / challenge.target) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  className="mt-3 w-full"
                  onClick={() => onOpenChallenge?.(challenge)}
                >
                  View challenge
                </Button>
              </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="No shared challenges yet"
              description="Create a supportive challenge from Goals when you are ready to train toward something together."
            />
          )}
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Recent breakthroughs"
            description="Celebrate effort on both sides"
          />
          <div className="space-y-3">
            {records.slice(0, 4).map((record) => (
              <article
                key={record.id}
                className="flex items-center gap-3 rounded-[20px] border border-white/55 bg-white/36 p-3 dark:border-white/8 dark:bg-white/[0.03]"
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-2xl",
                    record.userRole === "current"
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-300"
                      : "bg-violet-100 text-violet-700 dark:bg-violet-300/10 dark:text-violet-300",
                  )}
                >
                  <Award aria-hidden className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-950 dark:text-white">
                    {record.exercise}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {record.userRole === "current" ? "You" : friendProfile.displayName} · {record.date}
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
              </article>
            ))}
          </div>
        </GlassCard>
      </section>

      <GlassCard className="p-5 sm:p-6">
        <SectionHeader
          title="Shared pulse"
          description="Latest activity from your accountability circle"
        />
        <div className="grid gap-3 md:grid-cols-2">
          {activityItems.slice(0, 4).map((item) => (
            <article
              key={item.id}
              className="flex gap-3 rounded-[20px] border border-white/55 bg-white/36 p-4 dark:border-white/8 dark:bg-white/[0.03]"
            >
              <Avatar
                initials={item.userInitials}
                name={item.userName}
                role={item.userRole}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-950 dark:text-white">
                  {item.title}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  {activityDetailToDisplay(item, unitPreference)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </GlassCard>

      <div className="flex items-start gap-3 rounded-[22px] border border-emerald-200/65 bg-emerald-50/65 p-4 dark:border-emerald-300/15 dark:bg-emerald-300/[0.055]">
        <CheckCircle2
          aria-hidden
          className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-300"
        />
        <p className="text-xs leading-5 text-emerald-900 dark:text-emerald-100">
          <span className="font-semibold">Healthy comparison:</span> use these
          numbers to spot support opportunities. Every body, schedule, and
          training history is different.
        </p>
      </div>
    </div>
  );
}
