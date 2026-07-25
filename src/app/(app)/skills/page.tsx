import { SkillsPageClient } from "@/components/skills-page-client";
import { requireUser } from "@/lib/auth";
import { getLiveDashboardData } from "@/lib/data/dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Skills" };

export default async function SkillsPage() {
  const user = await requireUser();
  const [dashboard, supabase] = await Promise.all([
    getLiveDashboardData(user.id),
    createClient(),
  ]);
  const { data: historyRows } = await supabase
    .from("skill_entries")
    .select(
      "skill_id,recorded_at,best_hold_seconds,confidence_rating,technique_rating,media_path",
    )
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: true })
    .limit(1000);
  const history = (historyRows ?? []).map((entry) => ({
    date: entry.recorded_at.slice(0, 10),
    hold: Number(entry.best_hold_seconds ?? 0),
    confidence: Number(entry.confidence_rating ?? 0),
    technique: Number(entry.technique_rating ?? 0),
  }));
  const latestMediaBySkill = new Map<string, string>();
  for (const entry of [...(historyRows ?? [])].reverse()) {
    if (entry.media_path) {
      latestMediaBySkill.set(entry.skill_id, entry.media_path);
    }
  }
  const mediaRows = [...latestMediaBySkill].map(([skillId, path]) => ({
    skillId,
    path,
  }));
  const signedMedia = mediaRows.length
    ? await supabase.storage
        .from("progress-media")
        .createSignedUrls(
          mediaRows.map((item) => item.path),
          60 * 60,
        )
    : { data: [] };
  const mediaBySkill = new Map(
    (signedMedia.data ?? []).flatMap((item, index) =>
      item.signedUrl
        ? [
            [
              mediaRows[index].skillId,
              {
                mediaUrl: item.signedUrl,
                mediaType: /\.(mp4|webm|mov)$/i.test(mediaRows[index].path)
                  ? ("video" as const)
                  : ("image" as const),
              },
            ] as const,
          ]
        : [],
    ),
  );
  const skills = dashboard.skills.map((skill) => ({
    ...skill,
    ...mediaBySkill.get(skill.id),
  }));
  return <SkillsPageClient skills={skills} history={history} />;
}
