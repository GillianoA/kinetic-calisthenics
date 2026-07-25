import { readJsonBody } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request, 8 * 1024);
  if (!body.ok) return body.response;
  const path =
    typeof body.data === "object" &&
    body.data !== null &&
    "path" in body.data &&
    typeof body.data.path === "string"
      ? body.data.path
      : "";
  if (!path.startsWith(`${user.id}/`) || path.length > 1024) {
    return Response.json({ error: "Invalid avatar path." }, { status: 422 });
  }
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .single();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: path })
    .eq("id", user.id);
  if (error) return Response.json({ error: "Avatar could not be saved." }, { status: 400 });
  if (
    existingProfile?.avatar_path &&
    existingProfile.avatar_path !== path
  ) {
    await supabase.storage
      .from("avatars")
      .remove([existingProfile.avatar_path]);
  }
  return Response.json({ success: true });
}
