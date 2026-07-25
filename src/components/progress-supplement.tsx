"use client";

import { Activity, Medal, Scale } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState, GlassCard, SectionHeader, StatusPill } from "./ui/primitives";
import { useMemo } from "react";
import { useUnitPreference } from "./unit-preference-provider";
import { kilogramsToDisplay, weightUnit } from "@/lib/units";

export type BodyTrendPoint = {
  label: string;
  weight: number | null;
  bodyFat: number | null;
};

export type SkillMilestone = {
  id: string;
  skill: string;
  progression: string;
  date: string;
  status: string;
};

export function ProgressSupplement({
  bodyTrend,
  skillMilestones,
}: {
  bodyTrend: BodyTrendPoint[];
  skillMilestones: SkillMilestone[];
}) {
  const unitPreference = useUnitPreference();
  const displayedWeightUnit = weightUnit(unitPreference);
  const displayedBodyTrend = useMemo(
    () =>
      bodyTrend.map((point) => ({
        ...point,
        weight:
          point.weight == null
            ? null
            : kilogramsToDisplay(point.weight, unitPreference),
      })),
    [bodyTrend, unitPreference],
  );
  return (
    <section
      className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]"
      aria-label="Body and skill progress"
    >
      <GlassCard className="p-5 sm:p-6">
        <SectionHeader
          title="Body-weight trend"
          description="Private measurements across your selected history"
        />
        {displayedBodyTrend.length > 1 ? (
          <div
            className="h-72"
            role="img"
            aria-label="Body weight and body fat history chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={displayedBodyTrend}
                margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(148,163,184,.16)"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <YAxis
                  yAxisId="weight"
                  domain={["dataMin - 2", "dataMax + 2"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <YAxis
                  yAxisId="fat"
                  orientation="right"
                  domain={[0, "dataMax + 3"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,.75)",
                    background: "rgba(255,255,255,.94)",
                    boxShadow: "0 18px 40px -24px rgba(15,23,42,.55)",
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                />
                <Line
                  isAnimationActive={false}
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weight"
                  name={`Weight (${displayedWeightUnit})`}
                  connectNulls
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  isAnimationActive={false}
                  yAxisId="fat"
                  type="monotone"
                  dataKey="bodyFat"
                  name="Body fat (%)"
                  connectNulls
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={Scale}
            title="A trend needs two measurements"
            description="Record another measurement to see how your body metrics change over time."
          />
        )}
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <SectionHeader
          title="Skill milestone timeline"
          description="Progression stages and achievements you explicitly logged"
        />
        {skillMilestones.length ? (
          <ol className="relative ml-2 space-y-5 border-l border-cyan-200/80 pl-6 dark:border-cyan-300/15">
            {skillMilestones.map((milestone) => (
              <li key={milestone.id} className="relative">
                <span className="absolute -left-[31px] top-0.5 grid size-3 rounded-full border-2 border-white bg-cyan-500 shadow-[0_0_14px_rgba(6,182,212,.55)] dark:border-[#0b1930]" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                      {milestone.skill}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {milestone.progression}
                    </p>
                  </div>
                  <StatusPill
                    tone={
                      milestone.status === "achieved" ||
                      milestone.status === "mastered"
                        ? "success"
                        : "warning"
                    }
                  >
                    {milestone.status.replaceAll("_", " ")}
                  </StatusPill>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                  <Medal aria-hidden className="size-3" />
                  {milestone.date}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            icon={Activity}
            title="No skill milestones yet"
            description="Log a progression stage to begin your skill timeline."
          />
        )}
      </GlassCard>
    </section>
  );
}
