import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { invitationCodeSchema } from "@/lib/validation";
import { z } from "zod";

const acceptSchema = z.object({ code: invitationCodeSchema });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request, 16 * 1024);
  if (!body.ok) return body.response;
  const parsed = acceptSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);

  const { data, error } = await supabase.rpc("accept_friend_invite", {
    p_invite_token: parsed.data.code,
  });
  if (error) {
    return Response.json(
      { error: "Invitation is invalid, expired, or cannot be accepted." },
      { status: 400 },
    );
  }
  return Response.json({ connectionId: data });
}
