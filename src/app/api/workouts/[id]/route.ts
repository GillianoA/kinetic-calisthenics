import { z } from "zod";
import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { workoutSchema } from "@/lib/validation";

async function parseId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return z.string().uuid().safeParse(id);
}

function normalizeDateTime(date: string, value?: string) {
  if (!value) return null;
  return value.includes("T") ? value : `${date}T${value}:00`;
}

function isOwnedMediaPath(path: string, userId: string) {
  const [ownerId, visibility] = path.split("/");
  return (
    ownerId === userId &&
    (visibility === "private" || visibility === "shared")
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = await parseId(context);
  if (!id.success) return Response.json({ error: "Invalid workout ID." }, { status: 400 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data: existingWorkout } = await supabase
    .from("workouts")
    .select("photo_path")
    .eq("id", id.data)
    .eq("user_id", user.id)
    .single();
  if (!existingWorkout) {
    return Response.json({ error: "Workout was not found." }, { status: 404 });
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = workoutSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);
  const hasPhotoPath = Object.prototype.hasOwnProperty.call(
    body.data as object,
    "photoPath",
  );
  const nextPhotoPath = hasPhotoPath
    ? parsed.data.photoPath
    : (existingWorkout.photo_path ?? undefined);
  const payload = {
    ...parsed.data,
    photoPath: nextPhotoPath,
    startTime: normalizeDateTime(parsed.data.workoutDate, parsed.data.startTime),
    endTime: normalizeDateTime(parsed.data.workoutDate, parsed.data.endTime),
  };
  const { data, error } = await supabase.rpc("save_workout_with_exercises", {
    p_payload: payload,
    p_workout_uuid: id.data,
  });
  if (error) return Response.json({ error: "Workout could not be updated." }, { status: 400 });
  if (
    existingWorkout.photo_path &&
    existingWorkout.photo_path !== nextPhotoPath &&
    isOwnedMediaPath(existingWorkout.photo_path, user.id)
  ) {
    const { error: cleanupError } = await supabase.storage
      .from("progress-media")
      .remove([existingWorkout.photo_path]);
    return Response.json({
      id: data,
      mediaCleanupPending: Boolean(cleanupError),
    });
  }
  return Response.json({ id: data, mediaCleanupPending: false });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = await parseId(context);
  if (!id.success) return Response.json({ error: "Invalid workout ID." }, { status: 400 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data: existingWorkout } = await supabase
    .from("workouts")
    .select("photo_path")
    .eq("id", id.data)
    .eq("user_id", user.id)
    .single();
  if (!existingWorkout) {
    return Response.json({ error: "Workout was not found." }, { status: 404 });
  }
  const { data: deletedWorkout, error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !deletedWorkout) {
    return Response.json({ error: "Workout could not be deleted." }, { status: 400 });
  }
  if (
    existingWorkout.photo_path &&
    isOwnedMediaPath(existingWorkout.photo_path, user.id)
  ) {
    await supabase.storage
      .from("progress-media")
      .remove([existingWorkout.photo_path]);
  }
  return new Response(null, { status: 204 });
}
