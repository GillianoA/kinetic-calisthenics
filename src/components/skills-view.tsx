"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Check,
  ChevronRight,
  Clock3,
  Crown,
  ImageIcon,
  Medal,
  Plus,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Video,
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
import { skills as demoSkills, type SkillSummary } from "@/lib/demo-data";
import {
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
import { formatMetricWeightLabel } from "@/lib/units";

const categories = ["all", "push", "pull", "core", "balance", "legs"] as const;

const demoSkillHistory = [
  { date: "Feb", hold: 4, confidence: 3, technique: 4 },
  { date: "Mar", hold: 6, confidence: 4, technique: 5 },
  { date: "Apr", hold: 8, confidence: 5, technique: 5 },
  { date: "May", hold: 9, confidence: 6, technique: 6 },
  { date: "Jun", hold: 11, confidence: 6, technique: 7 },
  { date: "Jul", hold: 12, confidence: 7, technique: 8 },
];

const statusLabels: Record<SkillSummary["status"], string> = {
  not_started: "Not started",
  learning: "Learning",
  developing: "Developing",
  achieved: "Achieved",
  mastered: "Mastered",
};

function SkillCard({
  skill,
  active,
  onSelect,
}: {
  skill: SkillSummary;
  active: boolean;
  onSelect: () => void;
}) {
  const unitPreference = useUnitPreference();
  const hasLadder = skill.totalStages > 0;
  const percent = hasLadder
    ? Math.round((skill.completedStages / skill.totalStages) * 100)
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "skill-card focus-ring group w-full rounded-[24px] border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:p-5",
        active
          ? "border-sky-200 bg-white/75 shadow-[0_18px_48px_-28px_rgba(2,132,199,.6),inset_0_1px_0_rgba(255,255,255,.95)] dark:border-cyan-300/25 dark:bg-cyan-300/[0.065]"
          : "border-white/55 bg-white/38 hover:-translate-y-0.5 hover:bg-white/58 dark:border-white/8 dark:bg-white/[0.032] dark:hover:bg-white/[0.06]",
      )}
    >
      <div className="flex items-center gap-4">
        <ProgressRing
          value={percent}
          size={70}
          strokeWidth={7}
          label={percent === null ? "—" : `${percent}%`}
          sublabel={percent === null ? "no ladder" : "ladder"}
          ariaLabel={
            percent === null
              ? `${skill.name}: no progression ladder defined`
              : `${skill.name}: ${percent}% of progression ladder complete`
          }
          tone={
            skill.status === "achieved" || skill.status === "mastered"
              ? "emerald"
              : skill.category === "balance"
                ? "violet"
                : "cyan"
          }
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
              {skill.name}
            </h3>
            <ChevronRight
              aria-hidden
              className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 dark:text-slate-600"
            />
          </div>
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {skill.progression}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <StatusPill
              tone={
                skill.status === "achieved" || skill.status === "mastered"
                  ? "success"
                  : "warning"
              }
            >
              {statusLabels[skill.status]}
            </StatusPill>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {formatMetricWeightLabel(skill.bestLabel, unitPreference)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function MilestoneTimeline({ skill }: { skill: SkillSummary }) {
  return (
    <ol className="relative space-y-0" aria-label={`${skill.name} milestone timeline`}>
      {skill.milestones.map((milestone, index) => (
        <li key={milestone.label} className="relative flex min-h-[72px] gap-4">
          {index < skill.milestones.length - 1 ? (
            <span
              aria-hidden
              className={cn(
                "absolute left-[15px] top-8 h-[calc(100%-8px)] w-px",
                milestone.complete
                  ? "bg-cyan-300 dark:bg-cyan-400/50"
                  : "bg-slate-200 dark:bg-white/8",
              )}
            />
          ) : null}
          <span
            className={cn(
              "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border",
              milestone.complete
                ? "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-300"
                : "border-slate-200 bg-white/70 text-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-600",
            )}
          >
            {milestone.complete ? (
              <Check aria-hidden className="size-3.5" strokeWidth={3} />
            ) : (
              <span className="size-1.5 rounded-full bg-current" />
            )}
          </span>
          <div className="min-w-0 pt-1">
            <p
              className={cn(
                "text-sm font-semibold",
                milestone.complete
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-400 dark:text-slate-500",
              )}
            >
              {milestone.label}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {milestone.date ?? "Not reached yet"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function SkillsView({
  skills = demoSkills,
  history = demoSkillHistory,
  onAddSkill,
  onUpdateSkill,
}: {
  skills?: SkillSummary[];
  history?: Array<{
    date: string;
    hold: number;
    confidence: number;
    technique: number;
  }>;
  onAddSkill?: () => void;
  onUpdateSkill?: (skill: SkillSummary) => void;
}) {
  const unitPreference = useUnitPreference();
  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState<(typeof categories)[number]>("all");
  const [selectedId, setSelectedId] = useState(skills[0]?.id ?? "");

  const visibleSkills = useMemo(
    () =>
      skills.filter((skill) => {
        const categoryMatches =
          category === "all" || skill.category === category;
        const queryMatches = skill.name
          .toLowerCase()
          .includes(query.toLowerCase().trim());
        return categoryMatches && queryMatches;
      }),
    [category, query, skills],
  );

  const selected =
    skills.find((skill) => skill.id === selectedId) ?? visibleSkills[0];
  const achieved = skills.filter(
    (skill) => skill.status === "achieved" || skill.status === "mastered",
  ).length;
  const closestTarget = skills
    .filter(
      (skill) =>
        skill.totalStages > 0 &&
        skill.status !== "achieved" &&
        skill.status !== "mastered",
    )
    .map((skill) => ({
      skill,
      percent: Math.round(
        (skill.completedStages / skill.totalStages) * 100,
      ),
    }))
    .sort((left, right) => right.percent - left.percent)[0];
  const achievedSkills = skills
    .filter(
      (skill) => skill.status === "achieved" || skill.status === "mastered",
    )
    .slice(0, 3);

  return (
    <div className="skills-view space-y-7">
      <PageHeader
        eyebrow="Skills"
        title="Build the impossible, one stage at a time"
        description="Progress percentages come only from the stages in each skill ladder—not a hidden estimate."
        action={
          <Button onClick={onAddSkill}>
            <Plus aria-hidden className="size-4" />
            Add custom skill
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Skills in progress",
            value: skills.filter(
              (skill) =>
                skill.status === "learning" || skill.status === "developing",
            ).length,
            detail: "across your active ladders",
            icon: TrendingUp,
            tone: "bg-cyan-100 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-300",
          },
          {
            label: "Achieved",
            value: achieved,
            detail: "verified milestones",
            icon: Award,
            tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300",
          },
          {
            label: "Closest target",
            value: closestTarget ? `${closestTarget.percent}%` : "—",
            detail: closestTarget
              ? `${closestTarget.skill.name} · ${closestTarget.skill.target}`
              : "Define a progression ladder",
            icon: Target,
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

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search skills</span>
            <Search
              aria-hidden
              className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your skills"
              className="focus-ring h-11 w-full rounded-2xl border border-white/60 bg-white/48 pl-11 pr-4 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:focus:ring-cyan-400/10"
            />
          </label>
          <div className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100/60 p-1 dark:bg-white/[0.04]">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={cn(
                  "focus-ring min-h-9 shrink-0 rounded-xl px-3 text-[11px] font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                  category === item
                    ? "bg-white text-slate-950 shadow-sm dark:bg-white/12 dark:text-white"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {visibleSkills.length === 0 ? (
        <GlassCard className="p-5">
          <EmptyState
            icon={Medal}
            title="No matching skills"
            description="Try another search or add a custom progression ladder."
            action={
              <Button onClick={onAddSkill}>
                <Plus aria-hidden className="size-4" />
                Add skill
              </Button>
            }
          />
        </GlassCard>
      ) : (
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,.9fr)_minmax(420px,1.1fr)]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {visibleSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                active={selected?.id === skill.id}
                onSelect={() => setSelectedId(skill.id)}
              />
            ))}
          </div>

          {selected ? (
            <GlassCard elevated className="p-5 sm:p-7 xl:sticky xl:top-24">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="current">{selected.category}</StatusPill>
                    <StatusPill
                      tone={
                        selected.status === "achieved" ||
                        selected.status === "mastered"
                          ? "success"
                          : "warning"
                      }
                    >
                      {statusLabels[selected.status]}
                    </StatusPill>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                    {selected.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Current:{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selected.progression}
                    </span>
                    <span aria-hidden> · </span>
                    Target:{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selected.target}
                    </span>
                  </p>
                </div>
                {onUpdateSkill ? (
                  <Button
                    variant="secondary"
                    onClick={() => onUpdateSkill(selected)}
                  >
                    Update skill
                    <ArrowRight aria-hidden className="size-4" />
                  </Button>
                ) : (
                  <Link
                    href={`/skills/${selected.id}/edit`}
                    className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/65 bg-white/55 px-4 text-sm font-semibold text-slate-800 hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                  >
                    Update skill
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                )}
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/42 p-4 dark:bg-white/[0.04]">
                  <Clock3
                    aria-hidden
                    className="size-4 text-sky-600 dark:text-cyan-300"
                  />
                  <p className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
                    {formatMetricWeightLabel(
                      selected.bestLabel,
                      unitPreference,
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">Best record</p>
                </div>
                <div className="rounded-2xl bg-white/42 p-4 dark:bg-white/[0.04]">
                  <Sparkles
                    aria-hidden
                    className="size-4 text-violet-600 dark:text-violet-300"
                  />
                  <p className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
                    {selected.confidence}/10
                  </p>
                  <p className="text-[11px] text-slate-400">Confidence</p>
                </div>
                <div className="rounded-2xl bg-white/42 p-4 dark:bg-white/[0.04]">
                  <Star
                    aria-hidden
                    className="size-4 text-amber-600 dark:text-amber-300"
                  />
                  <p className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
                    {selected.technique}/10
                  </p>
                  <p className="text-[11px] text-slate-400">Technique</p>
                </div>
              </div>

              {selected.mediaUrl ? (
                <div className="mt-7 overflow-hidden rounded-[22px] border border-white/60 bg-white/36 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 px-4 py-3 text-xs font-semibold text-slate-700 dark:border-white/8 dark:text-slate-200">
                    {selected.mediaType === "video" ? (
                      <Video
                        aria-hidden
                        className="size-4 text-violet-500"
                      />
                    ) : (
                      <ImageIcon
                        aria-hidden
                        className="size-4 text-sky-500"
                      />
                    )}
                    Latest technique reference
                  </div>
                  {selected.mediaType === "video" ? (
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      src={selected.mediaUrl}
                      aria-label={`${selected.name} technique reference video`}
                      className="max-h-[30rem] w-full bg-slate-950"
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={`${selected.name} technique reference image`}
                      className="aspect-video max-h-[30rem] w-full bg-slate-100 bg-contain bg-center bg-no-repeat dark:bg-slate-950"
                      style={{
                        backgroundImage: `url("${selected.mediaUrl}")`,
                      }}
                    />
                  )}
                </div>
              ) : null}

              <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(180px,.65fr)_minmax(0,1.35fr)]">
                <div>
                  <SectionHeader
                    title="Milestones"
                    description={`${selected.completedStages} of ${selected.totalStages} stages`}
                  />
                  <MilestoneTimeline skill={selected} />
                </div>
                <div>
                  <SectionHeader
                    title="Best-hold history"
                    description="Seconds across logged updates"
                  />
                  <div className="h-64" role="img" aria-label={`${selected.name} historical best hold chart`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={history}
                        margin={{ top: 8, right: 6, left: -26, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="skillHoldGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#06b6d4"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="100%"
                              stopColor="#06b6d4"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          vertical={false}
                          stroke="rgba(148,163,184,.16)"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 10 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 10 }}
                        />
                        <Tooltip
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
                          dataKey="hold"
                          name="Best hold"
                          unit=" sec"
                          stroke="#06b6d4"
                          strokeWidth={3}
                          fill="url(#skillHoldGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </GlassCard>
          ) : null}
        </section>
      )}

      <GlassCard className="p-5 sm:p-6">
        <SectionHeader
          title="Achievement cabinet"
          description="Badges celebrate milestones, not competition."
        />
        {achievedSkills.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {achievedSkills.map((skill, index) => {
            const badgeStyles = [
              {
                icon: Sparkles,
                tone: "from-cyan-200 to-sky-100 text-cyan-800",
              },
              {
                icon: Crown,
                tone: "from-violet-200 to-fuchsia-100 text-violet-800",
              },
              {
                icon: Award,
                tone: "from-amber-200 to-orange-100 text-amber-800",
              },
            ];
            const { icon: Icon, tone } =
              badgeStyles[index % badgeStyles.length];
            return (
            <div
              key={skill.id}
              className="flex items-center gap-3 rounded-[20px] border border-white/55 bg-white/38 p-4 dark:border-white/8 dark:bg-white/[0.03]"
            >
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-2xl bg-gradient-to-br",
                  tone,
                )}
              >
                <Icon aria-hidden className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  {skill.name}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {skill.status === "mastered" ? "Mastered" : "Achieved"} ·{" "}
                  {formatMetricWeightLabel(skill.bestLabel, unitPreference)}
                </p>
              </div>
            </div>
            );
          })}
        </div>
        ) : (
          <EmptyState
            icon={Award}
            title="Your first badge is ahead"
            description="An achievement badge appears after a skill is explicitly marked achieved or mastered."
          />
        )}
      </GlassCard>
    </div>
  );
}
