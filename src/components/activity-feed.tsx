"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import {
  Activity,
  Award,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  HeartHandshake,
  Medal,
  MessageCircleHeart,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { activityDetailToDisplay } from "@/lib/activity-format";
import {
  activities as demoActivities,
  type ActivityItem,
  type Encouragement,
} from "@/lib/demo-data";
import {
  Avatar,
  Button,
  EmptyState,
  GlassCard,
  PageHeader,
  StatusPill,
  cn,
} from "./ui/primitives";
import { useUnitPreference } from "./unit-preference-provider";

const encouragements: Array<{
  label: Encouragement;
  icon: typeof Sparkles;
}> = [
  { label: "Strong work", icon: Dumbbell },
  { label: "New record", icon: Trophy },
  { label: "Keep going", icon: Sparkles },
  { label: "Respect", icon: HeartHandshake },
];

const kindMeta: Record<
  ActivityItem["kind"],
  { icon: typeof Activity; tone: string; label: string }
> = {
  workout: {
    icon: Dumbbell,
    tone: "bg-cyan-100 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-300",
    label: "Workout",
  },
  record: {
    icon: Trophy,
    tone: "bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300",
    label: "Record",
  },
  skill: {
    icon: Medal,
    tone:
      "bg-violet-100 text-violet-700 dark:bg-violet-300/10 dark:text-violet-300",
    label: "Skill",
  },
  goal: {
    icon: Target,
    tone:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300",
    label: "Goal",
  },
  challenge: {
    icon: Users,
    tone: "bg-sky-100 text-sky-700 dark:bg-sky-300/10 dark:text-sky-300",
    label: "Challenge",
  },
  encouragement: {
    icon: MessageCircleHeart,
    tone: "bg-rose-100 text-rose-700 dark:bg-rose-300/10 dark:text-rose-300",
    label: "Encouragement",
  },
};

function relativeDate(date: string) {
  return formatDistanceToNowStrict(parseISO(date), { addSuffix: true });
}

function FeedItem({
  item,
  onReact,
}: {
  item: ActivityItem;
  onReact: (label: Encouragement) => void;
}) {
  const unitPreference = useUnitPreference();
  const meta = kindMeta[item.kind];
  const Icon = meta.icon;
  return (
    <article className="activity-item relative flex gap-3 border-b border-slate-200/55 py-5 last:border-0 dark:border-white/8 sm:gap-4">
      <div className="relative shrink-0">
        <Avatar
          initials={item.userInitials}
          name={item.userName}
          role={item.userRole}
          size="md"
        />
        <span
          className={cn(
            "absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-white dark:border-[#111e32]",
            meta.tone,
          )}
        >
          <Icon aria-hidden className="size-2.5" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {item.title}
              </p>
              <StatusPill tone={item.userRole === "current" ? "current" : "friend"}>
                {item.userRole === "current" ? "You" : item.userName}
              </StatusPill>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {activityDetailToDisplay(item, unitPreference)}
            </p>
          </div>
          <time
            dateTime={item.createdAt}
            className="shrink-0 text-[10px] text-slate-400"
          >
            {relativeDate(item.createdAt)}
          </time>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.reactions.map((reaction) => (
            <button
              key={reaction.label}
              type="button"
              onClick={() => onReact(reaction.label)}
              aria-pressed={reaction.reacted}
              className={cn(
                "focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                reaction.reacted
                  ? "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200"
                  : "border-white/60 bg-white/42 text-slate-600 hover:bg-white/75 dark:border-white/9 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]",
              )}
            >
              {reaction.label}
              <span className="text-slate-400">{reaction.count}</span>
            </button>
          ))}

          <div className="group relative">
            <button
              type="button"
              className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3 text-xs font-semibold text-slate-600 hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/12 dark:text-slate-300 dark:hover:text-cyan-300"
              aria-label={`Encourage ${item.userName}`}
            >
              <MessageCircleHeart aria-hidden className="size-3.5" />
              Encourage
              <ChevronDown aria-hidden className="size-3" />
            </button>
            <div className="invisible absolute bottom-full left-0 z-20 mb-2 w-44 translate-y-1 rounded-2xl border border-white/65 bg-white/95 p-1.5 opacity-0 shadow-xl backdrop-blur-xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-white/10 dark:bg-[#102039]/95">
              {encouragements.map(({ label, icon: ReactionIcon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onReact(label)}
                  className="focus-ring flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-200 dark:hover:bg-white/8"
                >
                  <ReactionIcon aria-hidden className="size-3.5 text-sky-500" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export type ActivityFeedProps = {
  items?: ActivityItem[];
  friendName?: string;
  showHeader?: boolean;
  onReact?: (
    activity: ActivityItem,
    label: Encouragement,
    active: boolean,
  ) => void | Promise<void>;
  onLoadMore?: () => void | Promise<void>;
  hasMore?: boolean;
};

export function ActivityFeed({
  items = demoActivities,
  friendName = "Partner",
  showHeader = true,
  onReact,
  onLoadMore,
  hasMore = false,
}: ActivityFeedProps) {
  const [reactionOverrides, setReactionOverrides] = useState<
    Record<string, ActivityItem>
  >({});
  const [userFilter, setUserFilter] = useState<"all" | "current" | "friend">(
    "all",
  );
  const [kindFilter, setKindFilter] = useState<"all" | ActivityItem["kind"]>(
    "all",
  );
  const [loadingMore, setLoadingMore] = useState(false);

  const feed = useMemo(
    () => items.map((item) => reactionOverrides[item.id] ?? item),
    [items, reactionOverrides],
  );

  const visibleItems = useMemo(
    () =>
      feed.filter((item) => {
        const userMatches =
          userFilter === "all" || item.userRole === userFilter;
        const kindMatches = kindFilter === "all" || item.kind === kindFilter;
        return userMatches && kindMatches;
      }),
    [feed, kindFilter, userFilter],
  );

  const react = async (item: ActivityItem, label: Encouragement) => {
    const existing = item.reactions.find((reaction) => reaction.label === label);
    const nextActive = !existing?.reacted;
    const previousOverride = reactionOverrides[item.id];
    const nextItem: ActivityItem = {
      ...item,
      reactions: existing
        ? item.reactions.map((reaction) =>
            reaction.label === label
              ? {
                  ...reaction,
                  reacted: nextActive,
                  count: Math.max(0, reaction.count + (nextActive ? 1 : -1)),
                }
              : reaction,
          )
        : [...item.reactions, { label, count: 1, reacted: true }],
    };
    setReactionOverrides((current) => ({
      ...current,
      [item.id]: nextItem,
    }));

    try {
      await onReact?.(item, label, nextActive);
    } catch {
      setReactionOverrides((current) => {
        const next = { ...current };
        if (previousOverride) next[item.id] = previousOverride;
        else delete next[item.id];
        return next;
      });
      toast.error("Couldn’t save your encouragement");
    }
  };

  return (
    <div className="activity-feed space-y-7">
      {showHeader ? (
        <PageHeader
          eyebrow="Activity"
          title="Your shared training pulse"
          description="A private feed for workouts, breakthroughs, goals, challenges, and simple encouragement."
          action={<StatusPill tone="success">Live updates</StatusPill>}
        />
      ) : null}

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="grid size-9 place-items-center rounded-xl bg-sky-100 text-sky-700 dark:bg-cyan-300/10 dark:text-cyan-300">
              <Activity aria-hidden className="size-4" />
            </span>
            Show
          </div>
          <div className="flex flex-1 gap-1 overflow-x-auto sm:justify-end">
            {[
              { value: "all" as const, label: "Everyone" },
              { value: "current" as const, label: "You" },
              {
                value: "friend" as const,
                label: friendName.split(" ")[0] || "Partner",
              },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setUserFilter(filter.value)}
                aria-pressed={userFilter === filter.value}
                className={cn(
                  "focus-ring min-h-9 shrink-0 rounded-xl px-3 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                  userFilter === filter.value
                    ? "bg-white text-slate-950 shadow-sm dark:bg-white/12 dark:text-white"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                {filter.label}
              </button>
            ))}
            <label className="relative">
              <span className="sr-only">Activity type</span>
              <select
                value={kindFilter}
                onChange={(event) =>
                  setKindFilter(
                    event.target.value as "all" | ActivityItem["kind"],
                  )
                }
                className="focus-ring h-9 min-w-32 appearance-none rounded-xl border border-white/60 bg-white/55 pl-3 pr-8 text-[11px] font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
              >
                <option value="all">All updates</option>
                <option value="workout">Workouts</option>
                <option value="record">Records</option>
                <option value="skill">Skills</option>
                <option value="goal">Goals</option>
                <option value="challenge">Challenges</option>
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-slate-400"
              />
            </label>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-7">
        {visibleItems.length ? (
          <div>
            {visibleItems.map((item) => (
              <FeedItem
                key={item.id}
                item={item}
                onReact={(label) => void react(item, label)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CheckCircle2}
            title="You’re all caught up"
            description="New shared workouts, records, skills, goals, and encouragement will appear here in real time."
          />
        )}

        {hasMore && visibleItems.length > 0 ? (
          <Button
            variant="secondary"
            className="mt-5 w-full"
            disabled={loadingMore}
            onClick={async () => {
              setLoadingMore(true);
              try {
                await onLoadMore?.();
              } finally {
                setLoadingMore(false);
              }
            }}
          >
            {loadingMore ? "Loading…" : "Load earlier activity"}
          </Button>
        ) : null}
      </GlassCard>

      <div className="flex items-start gap-3 rounded-[22px] border border-sky-200/65 bg-sky-50/65 p-4 dark:border-cyan-300/15 dark:bg-cyan-300/[0.05]">
        <Award
          aria-hidden
          className="mt-0.5 size-5 shrink-0 text-sky-600 dark:text-cyan-300"
        />
        <p className="text-xs leading-5 text-sky-900 dark:text-cyan-100">
          Kinetic keeps your circle intentionally small. There are no public
          follower counts, feeds, comments, or rankings.
        </p>
      </div>
    </div>
  );
}
