import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, Target, Users } from "lucide-react";
import { ManualChallengeProgress } from "@/components/manual-challenge-progress";
import { GlassCard, PageHeader, ProgressRing, StatusPill } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Shared challenge" };

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: challenge }, { data: profiles }] = await Promise.all([
    supabase
      .from("challenges")
      .select(
        "id,title,description,challenge_type,metric_key,target_value,unit,starts_on,ends_on,status,scoring_rules,challenge_members(user_id,current_value,status,joined_at)",
      )
      .eq("id", id)
      .single(),
    supabase.from("profiles").select("id,display_name"),
  ]);
  if (!challenge) notFound();
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const automatic = challenge.metric_key === "workouts_completed";
  const ownMember = challenge.challenge_members.find((member) => member.user_id === user.id);
  const today = new Date().toISOString().slice(0, 10);
  const canUpdateManually =
    !automatic &&
    Boolean(ownMember) &&
    ["upcoming", "active"].includes(challenge.status) &&
    today >= challenge.starts_on &&
    today <= challenge.ends_on;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Shared challenge"
        title={challenge.title}
        description={challenge.description ?? "A shared target for two connected athletes."}
        action={
          <StatusPill tone={challenge.status === "active" ? "success" : "neutral"}>
            {challenge.status}
          </StatusPill>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-5">
          <Target size={19} className="text-blue-600" aria-hidden="true" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Target</p>
          <p className="mt-1 text-xl font-bold">
            {Number(challenge.target_value)} {challenge.unit}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <CalendarDays size={19} className="text-violet-600" aria-hidden="true" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Window</p>
          <p className="mt-1 text-sm font-bold">
            {challenge.starts_on} → {challenge.ends_on}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <CheckCircle2 size={19} className="text-emerald-600" aria-hidden="true" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Calculation</p>
          <p className="mt-1 text-sm font-bold">
            {automatic ? "Automatic from shared workouts" : "Manual member updates"}
          </p>
        </GlassCard>
      </section>
      <GlassCard className="p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <Users size={19} className="text-blue-600" aria-hidden="true" />
          <h2 className="text-lg font-bold">Partner progress</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {challenge.challenge_members.map((member) => {
            const percent = Math.min(
              100,
              Math.round((Number(member.current_value) / Number(challenge.target_value || 1)) * 100),
            );
            return (
              <div
                key={member.user_id}
                className="flex items-center gap-4 rounded-[22px] border border-white/55 bg-white/35 p-4 dark:border-white/8 dark:bg-white/[0.03]"
              >
                <ProgressRing value={percent} label={`${percent}%`} />
                <div>
                  <p className="font-bold">
                    {member.user_id === user.id ? "You" : names.get(member.user_id) ?? "Partner"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {Number(member.current_value)} of {Number(challenge.target_value)} {challenge.unit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
          {automatic
            ? "Progress is transparent: Kinetic counts partner-visible completed workouts dated between the start and end dates."
            : "Progress is transparent: each member reports their own cumulative total, and Kinetic compares it directly with the target."}{" "}
          No hidden bonuses or arbitrary ranking.
        </p>
        {!automatic && ownMember && (
          <ManualChallengeProgress
            challengeId={challenge.id}
            initialValue={Number(ownMember.current_value)}
            targetValue={Number(challenge.target_value)}
            unit={challenge.unit}
            canUpdate={canUpdateManually}
          />
        )}
      </GlassCard>
    </div>
  );
}
