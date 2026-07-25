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
  const { data, error } = await supabase.rpc("send_encouragement", {
    p_encouragement: parsed.data.encouragement,
  });
  if (error?.code === "P0002") {
    return Response.json({ error: "No connected partner." }, { status: 409 });
  }
  if (error?.code === "57014") {
    return Response.json(
      { error: "Encouragement limit reached; try again later." },
      { status: 429 },
    );
  }
  if (error) {
    return Response.json({ error: "Encouragement could not be sent." }, { status: 400 });
  }
  return Response.json({ id: data }, { status: 201 });
}
