"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Gauge,
  Medal,
  MoreHorizontal,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import {
  challenges as demoChallenges,
  goals as demoGoals,
  type ChallengeSummary,
  type GoalSummary,
} from "@/lib/demo-data";
import { useUnitPreference } from "./unit-preference-provider";
import {
  Button,
  EmptyState,
  GlassCard,
  PageHeader,
  ProgressRing,
  StatusPill,
  cn,
} from "./ui/primitives";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { storedWeightToDisplay, weightUnit } from "@/lib/units";

type GoalTab = "active" | "completed" | "challenges";

function GoalCard({
  goal,
  onEdit,
  onUpdate,
  onDelete,
}: {
  goal: GoalSummary;
  onEdit?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
}) {
  const unitPreference = useUnitPreference();
  const displayedCurrentValue =
    goal.type === "weight"
      ? storedWeightToDisplay(goal.currentValue, goal.unit, unitPreference)
      : goal.currentValue;
  const displayedTargetValue =
    goal.type === "weight"
      ? storedWeightToDisplay(goal.targetValue, goal.unit, unitPreference)
      : goal.targetValue;
  const displayedUnit =
    goal.type === "weight" ? weightUnit(unitPreference) : goal.unit;
  const percentage =
    goal.targetValue > 0
      ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
      : 0;
  return (
    <article className="goal-card rounded-[24px] border border-white/55 bg-white/38 p-5 transition hover:bg-white/52 dark:border-white/8 dark:bg-white/[0.03] dark:hover:bg-white/[0.055]">
      <div className="flex items-start gap-4">
        <ProgressRing
          value={percentage}
          size={76}
          strokeWidth={7}
          label={`${percentage}%`}
          tone={goal.status === "completed" ? "emerald" : "cyan"}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap gap-2">
                <StatusPill
                  tone={goal.status === "completed" ? "success" : "current"}
                >
                  {goal.status}
                </StatusPill>
                <StatusPill tone="neutral">{goal.tracking}</StatusPill>
              </div>
              <h3 className="mt-3 text-base font-semibold tracking-tight text-slate-950 dark:text-white">
                {goal.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${goal.title}`}
              className="focus-ring grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-white/70 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:hover:bg-white/8 dark:hover:text-white"
            >
              <MoreHorizontal aria-hidden className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">
              {displayedCurrentValue} {displayedUnit}
            </span>{" "}
            of {displayedTargetValue} {displayedUnit}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CalendarDays aria-hidden className="size-3.5" />
              Due {goal.targetDate}
            </span>
            <span className="flex items-center gap-1.5">
              {goal.visibility === "friend" ? (
                <Users aria-hidden className="size-3.5" />
              ) : (
                <Target aria-hidden className="size-3.5" />
              )}
              {goal.visibility === "friend" ? "Shared with friend" : "Private"}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        {goal.status !== "completed" && goal.tracking === "manual" ? (
          <Button variant="secondary" onClick={onUpdate} className="flex-1">
            Update progress
          </Button>
        ) : (
          <Button variant="ghost" onClick={onEdit} className="flex-1">
            View details
            <ChevronRight aria-hidden className="size-4" />
          </Button>
        )}
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${goal.title}`}
          className="focus-ring grid size-11 place-items-center rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"
        >
          <Trash2 aria-hidden className="size-4" />
        </button>
      </div>
    </article>
  );
}

function ChallengeCard({
  challenge,
  friendName,
  onOpen,
}: {
  challenge: ChallengeSummary;
  friendName: string;
  onOpen?: () => void;
}) {
  return (
    <article className="challenge-card relative overflow-hidden rounded-[25px] border border-white/60 bg-gradient-to-br from-white/66 via-white/42 to-violet-100/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] dark:border-white/9 dark:from-white/[0.07] dark:via-white/[0.035] dark:to-violet-400/[0.08]">
      <span
        aria-hidden
        className="absolute -right-12 -top-12 size-36 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-400/10"
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-200 to-sky-100 text-violet-700 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] dark:from-violet-300/15 dark:to-cyan-300/10 dark:text-violet-300">
            <Sparkles aria-hidden className="size-5" />
          </span>
          <StatusPill tone="friend">{challenge.members} members</StatusPill>
        </div>
        <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
          {challenge.title}
        </h3>
        <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {challenge.description}
        </p>
        <div className="mt-5 space-y-3">
          {[
            {
              label: "You",
              value: challenge.currentUserProgress,
              color: "from-cyan-400 to-sky-500",
            },
            {
              label: friendName,
              value: challenge.friendProgress,
              color: "from-violet-400 to-fuchsia-500",
            },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-1.5 flex justify-between text-[10px]">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {item.label}
                </span>
                <span className="text-slate-400">
                  {item.value}/{challenge.target} {challenge.unit}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200/65 dark:bg-white/8">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r",
                    item.color,
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      (item.value / challenge.target) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock3 aria-hidden className="size-3.5" />
            {challenge.startDate}
          </span>
          <span aria-hidden>→</span>
          <span>{challenge.endDate}</span>
        </div>
        <Button variant="secondary" onClick={onOpen} className="mt-5 w-full">
          Open challenge
          <ChevronRight aria-hidden className="size-4" />
        </Button>
      </div>
    </article>
  );
}

export type GoalsViewProps = {
  goals?: GoalSummary[];
  challenges?: ChallengeSummary[];
  friendName?: string;
  onCreateGoal?: () => void;
  onCreateChallenge?: () => void;
  onEditGoal?: (goal: GoalSummary) => void;
  onUpdateGoal?: (goal: GoalSummary) => void;
  onDeleteGoal?: (goal: GoalSummary) => void | Promise<void>;
  onOpenChallenge?: (challenge: ChallengeSummary) => void;
};

export function GoalsView({
  goals = demoGoals,
  challenges = demoChallenges,
  friendName = "Partner",
  onCreateGoal,
  onCreateChallenge,
  onEditGoal,
  onUpdateGoal,
  onDeleteGoal,
  onOpenChallenge,
}: GoalsViewProps) {
  const [tab, setTab] = useState<GoalTab>("active");
  const [pendingDelete, setPendingDelete] = useState<GoalSummary | null>(null);

  const visibleGoals = useMemo(
    () =>
      goals.filter((goal) =>
        tab === "active"
          ? goal.status === "active" || goal.status === "paused"
          : goal.status === "completed",
      ),
    [goals, tab],
  );

  return (
    <div className="goals-view space-y-7">
      <PageHeader
        eyebrow="Goals & challenges"
        title="Give the work a direction"
        description="Turn your next milestone into a clear target, then let your logged training move it forward."
        action={
          <Button onClick={tab === "challenges" ? onCreateChallenge : onCreateGoal}>
            <Plus aria-hidden className="size-4" />
            {tab === "challenges" ? "New challenge" : "Create goal"}
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Active goals",
            value: goals.filter((goal) => goal.status === "active").length,
            detail: `${goals.filter((goal) => goal.visibility === "friend").length} shared with ${friendName.split(" ")[0] || "your partner"}`,
            icon: Target,
            tone: "bg-cyan-100 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-300",
          },
          {
            label: "Completed",
            value: goals.filter((goal) => goal.status === "completed").length,
            detail: "this training cycle",
            icon: Check,
            tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300",
          },
          {
            label: "Shared challenges",
            value: challenges.length,
            detail: "active together",
            icon: Users,
            tone: "bg-violet-100 text-violet-700 dark:bg-violet-300/10 dark:text-violet-300",
          },
        ].map(({ label, value, detail, icon: Icon, tone }) => (
          <GlassCard key={label} className="flex items-center gap-4 p-5">
            <span className={cn("grid size-11 place-items-center rounded-2xl", tone)}>
              <Icon aria-hidden className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {value}
              </p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {label}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">{detail}</p>
            </div>
          </GlassCard>
        ))}
      </section>

      <div
        className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-white/55 bg-white/42 p-1.5 dark:border-white/8 dark:bg-white/[0.035]"
        role="group"
        aria-label="Goal views"
      >
        {[
          { value: "active" as const, label: "Active goals", icon: Gauge },
          { value: "completed" as const, label: "Completed", icon: Medal },
          { value: "challenges" as const, label: "Shared challenges", icon: Users },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "focus-ring inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
              tab === value
                ? "bg-white text-slate-950 shadow-sm dark:bg-white/12 dark:text-white"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "challenges" ? (
        challenges.length ? (
          <section className="grid gap-4 md:grid-cols-2">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                friendName={friendName.split(" ")[0] || "Partner"}
                onOpen={() => onOpenChallenge?.(challenge)}
              />
            ))}
          </section>
        ) : (
          <GlassCard className="p-5">
            <EmptyState
              icon={Users}
              title="No shared challenges yet"
              description="Create a supportive challenge that you and your accountability partner can join."
              action={
                <Button onClick={onCreateChallenge}>
                  <Plus aria-hidden className="size-4" />
                  Create challenge
                </Button>
              }
            />
          </GlassCard>
        )
      ) : visibleGoals.length ? (
        <section className="grid gap-4 md:grid-cols-2">
          {visibleGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => onEditGoal?.(goal)}
              onUpdate={() => onUpdateGoal?.(goal)}
              onDelete={() => setPendingDelete(goal)}
            />
          ))}
        </section>
      ) : (
        <GlassCard className="p-5">
          <EmptyState
            icon={Target}
            title={
              tab === "completed"
                ? "No completed goals yet"
                : "Your next goal starts here"
            }
            description={
              tab === "completed"
                ? "Completed goals will collect here as a record of steady progress."
                : "Set a clear target and choose whether progress updates automatically from your training."
            }
            action={
              tab === "active" ? (
                <Button onClick={onCreateGoal}>
                  <Plus aria-hidden className="size-4" />
                  Create goal
                </Button>
              ) : undefined
            }
          />
        </GlassCard>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this goal?"
        description={`“${pendingDelete?.title ?? "This goal"}” and its manual progress history will be removed. Logged workouts are unaffected.`}
        confirmLabel="Delete goal"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await onDeleteGoal?.(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
