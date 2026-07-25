import { z } from "zod";
import { readJsonBody } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = z.string().uuid().safeParse(rawId);
  if (!id.success) return Response.json({ error: "Invalid connection ID." }, { status: 400 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request, 16 * 1024);
  if (!body.ok) return body.response;
  if (
    typeof body.data !== "object" ||
    body.data === null ||
    !("confirmation" in body.data) ||
    body.data.confirmation !== "DISCONNECT"
  ) {
    return Response.json({ error: "Confirmation is required." }, { status: 422 });
  }

  const { error } = await supabase.rpc("disconnect_friend", {
    p_connection_id: id.data,
  });
  if (error) return Response.json({ error: "Connection could not be disconnected." }, { status: 400 });
  return new Response(null, { status: 204 });
}
