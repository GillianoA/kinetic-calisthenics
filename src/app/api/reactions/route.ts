import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { reactionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request, 16 * 1024);
  if (!body.ok) return body.response;
  const parsed = reactionSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);

  const { data, error } = await supabase
    .from("reactions")
    .upsert(
      {
        activity_id: parsed.data.activityId,
        user_id: user.id,
        reaction: parsed.data.reaction,
      },
      { onConflict: "activity_id,user_id" },
    )
    .select("*")
    .single();
  if (error) return Response.json({ error: "Encouragement could not be saved." }, { status: 400 });
  return Response.json({ data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request, 16 * 1024);
  if (!body.ok) return body.response;
  const parsed = reactionSchema.pick({ activityId: true }).safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);
  const { error } = await supabase
    .from("reactions")
    .delete()
    .eq("activity_id", parsed.data.activityId)
    .eq("user_id", user.id);
  if (error) return Response.json({ error: "Encouragement could not be removed." }, { status: 400 });
  return new Response(null, { status: 204 });
}
