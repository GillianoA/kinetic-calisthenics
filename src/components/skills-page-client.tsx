"use client";

import { useRouter } from "next/navigation";
import { SkillsView } from "@/components/skills-view";
import type { SkillSummary } from "@/lib/demo-data";

export function SkillsPageClient({
  skills,
  history,
}: {
  skills: SkillSummary[];
  history: Array<{ date: string; hold: number; confidence: number; technique: number }>;
}) {
  const router = useRouter();
  return (
    <SkillsView
      skills={skills}
      history={history}
      onAddSkill={() => router.push("/skills/new")}
      onUpdateSkill={(skill) => router.push(`/skills/new?skill=${skill.id}`)}
    />
  );
}
