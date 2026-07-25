import { z } from "zod";
import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  encouragement: z.enum(["Strong work", "New record", "Keep going", "Respect"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request, 16 * 1024);
  if (!body.ok) return body.response;
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);
  const { data: partnerId } = await supabase.rpc("get_my_partner_id");
  if (!partnerId) return Response.json({ error: "No connected partner." }, { status: 409 });
  const { data, error } = await supabase
    .from("activity_feed")
    .insert({
      user_id: user.id,
      activity_type: "encouragement",
      entity_type: "profile",
      entity_id: partnerId,
      title: parsed.data.encouragement,
      message: "A private encouragement from your accountability partner.",
      metadata: { recipient_id: partnerId, encouragement: parsed.data.encouragement },
      visibility: "partner",
    })
    .select("id")
    .single();
  if (error) return Response.json({ error: "Encouragement could not be sent." }, { status: 400 });
  return Response.json({ id: data.id }, { status: 201 });
}
