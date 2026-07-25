import { SkillEntryForm, type SkillCatalogItem } from "@/components/forms/skill-entry-form";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Update skill" };

export default async function NewSkillEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const user = await requireUser();
  const { skill: initialSkillId } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("skills")
    .select("id,name,category,difficulty_order,skill_progressions(id,name,stage_order)")
    .or(`is_system.eq.true,owner_id.eq.${user.id}`)
    .order("difficulty_order");
  const catalog: SkillCatalogItem[] = (data ?? []).map((skill) => ({
    id: skill.id,
    name: skill.name,
    category: skill.category,
    stages: [...skill.skill_progressions]
      .sort((a, b) => a.stage_order - b.stage_order)
      .map((stage) => ({
        id: stage.id,
        name: stage.name,
        order: stage.stage_order,
      })),
  }));
  const matchedInitial =
    initialSkillId && catalog.some((skill) => skill.id === initialSkillId)
      ? initialSkillId
      : undefined;
  return <SkillEntryForm catalog={catalog} initialSkillId={matchedInitial} />;
}
