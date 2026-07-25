import { rowsToCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

const exportTables = [
  "profiles",
  "user_preferences",
  "friend_connections",
  "friend_invites",
  "exercise_library",
  "workouts",
  "workout_exercises",
  "exercise_sets",
  "workout_templates",
  "workout_template_exercises",
  "workout_template_sets",
  "skills",
  "skill_progressions",
  "skill_entries",
  "body_measurements",
  "goals",
  "challenges",
  "challenge_members",
  "personal_records",
  "activity_feed",
  "reactions",
  "notifications",
] as const;

type ExportTable = (typeof exportTables)[number];

async function selectOwnedRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: ExportTable,
  userId: string,
) {
  if (table === "skill_progressions") {
    return supabase
      .from("skill_progressions")
      .select("*,skills!inner(owner_id)")
      .eq("skills.owner_id", userId);
  }

  if (table === "goals") {
    const result = await supabase
      .from("goal_progress_live")
      .select("*")
      .eq("user_id", userId);
    return {
      ...result,
      data: result.data?.map(
        ({ effective_current_value: effectiveCurrentValue, ...goal }) => ({
          ...goal,
          current_value: effectiveCurrentValue ?? goal.current_value,
        }),
      ),
    };
  }

  const query = supabase.from(table).select("*");

  if (table === "profiles") return query.eq("id", userId);
  if (table === "friend_connections") {
    return query.or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  }
  if (table === "friend_invites") return query.eq("inviter_id", userId);
  if (table === "exercise_library") return query.eq("owner_id", userId);
  if (table === "skills") return query.eq("owner_id", userId);
  if (table === "challenges") return query.eq("created_by", userId);
  if (table === "notifications") return query.eq("recipient_user_id", userId);

  return query.eq("user_id", userId);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const requestedTable = url.searchParams.get("table") as ExportTable | null;

  if (format === "csv") {
    const table = requestedTable && exportTables.includes(requestedTable) ? requestedTable : "workouts";
    const { data, error } = await selectOwnedRows(supabase, table, user.id);
    if (error) return Response.json({ error: error.message }, { status: 400 });

    const csv = rowsToCsv((data ?? []) as Record<string, string | number | boolean | null>[]);
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="kinetic-${table}.csv"`,
        "cache-control": "private, no-store",
      },
    });
  }

  const entries = await Promise.all(
    exportTables.map(async (table) => {
      const { data, error } = await selectOwnedRows(supabase, table, user.id);
      return [table, error ? { error: error.message } : data] as const;
    }),
  );

  return Response.json(
    {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      data: Object.fromEntries(entries),
    },
    {
      headers: {
        "content-disposition": 'attachment; filename="kinetic-export.json"',
        "cache-control": "private, no-store",
      },
    },
  );
}
