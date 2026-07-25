import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { workoutSchema } from "@/lib/validation";

function normalizeDateTime(date: string, value?: string) {
  if (!value) return null;
  return value.includes("T") ? value : `${date}T${value}:00`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = workoutSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);
  const payload = {
    ...parsed.data,
    startTime: normalizeDateTime(parsed.data.workoutDate, parsed.data.startTime),
    endTime: normalizeDateTime(parsed.data.workoutDate, parsed.data.endTime),
  };
  const { data, error } = await supabase.rpc("save_workout_with_exercises", {
    p_payload: payload,
    p_workout_uuid: null,
  });
  if (error) return Response.json({ error: "Workout could not be saved." }, { status: 400 });
  return Response.json({ id: data }, { status: 201 });
}
