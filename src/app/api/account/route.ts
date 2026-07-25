import { createAdminClient, createClient } from "@/lib/supabase/server";

async function collectObjectPaths(
  storage: ReturnType<typeof createAdminClient>["storage"],
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await storage.from(bucket).list(prefix, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data?.length) break;

    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) {
        paths.push(path);
      } else {
        paths.push(...(await collectObjectPaths(storage, bucket, path)));
      }
    }

    if (data.length < 100) break;
    offset += data.length;
  }

  return paths;
}

async function removeUserMedia(admin: ReturnType<typeof createAdminClient>, userId: string) {
  for (const bucket of ["avatars", "progress-media"]) {
    const paths = await collectObjectPaths(admin.storage, bucket, userId);
    for (let index = 0; index < paths.length; index += 100) {
      const { error } = await admin.storage.from(bucket).remove(paths.slice(index, index + 100));
      if (error) throw error;
    }
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const lastSignInAt = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).getTime()
    : 0;
  if (Date.now() - lastSignInAt > 15 * 60 * 1000) {
    return Response.json(
      {
        error:
          "Reauthentication required. Sign out and back in before deleting your account.",
        code: "reauthentication_required",
      },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { confirmation?: string }
    | null;
  if (body?.confirmation !== "DELETE") {
    return Response.json(
      { error: "Type DELETE to confirm permanent account deletion." },
      { status: 422 },
    );
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return Response.json(
      {
        error:
          "Account deletion is not configured. Contact the application owner.",
      },
      { status: 503 },
    );
  }
  try {
    await removeUserMedia(admin, user.id);
  } catch {
    return Response.json(
      { error: "Account deletion paused because private media cleanup failed." },
      { status: 500 },
    );
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return Response.json({ error: "Account deletion failed." }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
