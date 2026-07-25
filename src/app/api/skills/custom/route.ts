import { z } from "zod";
import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

const customSkillSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum([
    "push",
    "pull",
    "core",
    "balance",
    "legs",
    "static",
    "dynamic",
    "mobility",
    "other",
  ]),
  stages: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request, 64 * 1024);
  if (!body.ok) return body.response;
  const parsed = customSkillSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);
  const uniqueStages = [...new Set(parsed.data.stages.map((stage) => stage.trim()))];

  const { data: skill, error } = await supabase
    .from("skills")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      category: parsed.data.category,
      difficulty_order: 1000,
      is_system: false,
    })
    .select("id")
    .single();
  if (error || !skill) {
    return Response.json({ error: "Custom skill could not be created." }, { status: 400 });
  }

  if (uniqueStages.length) {
    const { error: stagesError } = await supabase.from("skill_progressions").insert(
      uniqueStages.map((name, index) => ({
        skill_id: skill.id,
        name,
        stage_order: index + 1,
      })),
    );
    if (stagesError) {
      await supabase.from("skills").delete().eq("id", skill.id).eq("owner_id", user.id);
      return Response.json({ error: "Custom progression stages could not be saved." }, { status: 400 });
    }
  }

  const { data: stages } = await supabase
    .from("skill_progressions")
    .select("id,name,stage_order")
    .eq("skill_id", skill.id)
    .order("stage_order");
  return Response.json({ id: skill.id, stages: stages ?? [] }, { status: 201 });
}
