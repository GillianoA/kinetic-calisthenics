import { z } from "zod";
import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { measurementSchema } from "@/lib/validation";

async function getId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return z.string().uuid().safeParse(id);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = await getId(context);
  if (!id.success) return Response.json({ error: "Invalid measurement ID." }, { status: 400 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data: existingMeasurement } = await supabase
    .from("body_measurements")
    .select("photo_paths")
    .eq("id", id.data)
    .eq("user_id", user.id)
    .single();
  if (!existingMeasurement) {
    return Response.json({ error: "Measurement was not found." }, { status: 404 });
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = measurementSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);
  const value = parsed.data;
  const { data, error } = await supabase
    .from("body_measurements")
    .update({
      measured_at: value.measuredAt,
      weight_kg: value.weightKg,
      body_fat_percentage: value.bodyFatPercentage,
      waist_cm: value.waistCm,
      chest_cm: value.chestCm,
      shoulders_cm: value.shouldersCm,
      upper_arm_cm: value.upperArmCm,
      forearm_cm: value.forearmCm,
      thigh_cm: value.thighCm,
      calf_cm: value.calfCm,
      notes: value.notes,
      photo_paths: value.photoPaths,
      visibility: value.visibility,
    })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return Response.json({ error: "Measurement could not be updated." }, { status: 400 });
  const retainedPaths = new Set(value.photoPaths);
  const removedPaths = (existingMeasurement.photo_paths as string[]).filter(
    (path) => !retainedPaths.has(path),
  );
  if (removedPaths.length) {
    await supabase.storage.from("progress-media").remove(removedPaths);
  }
  return Response.json({ data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = await getId(context);
  if (!id.success) return Response.json({ error: "Invalid measurement ID." }, { status: 400 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data: existingMeasurement } = await supabase
    .from("body_measurements")
    .select("photo_paths")
    .eq("id", id.data)
    .eq("user_id", user.id)
    .single();
  if (!existingMeasurement) {
    return Response.json({ error: "Measurement was not found." }, { status: 404 });
  }
  const { error } = await supabase
    .from("body_measurements")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id);
  if (error) return Response.json({ error: "Measurement could not be deleted." }, { status: 400 });
  if (existingMeasurement.photo_paths.length) {
    await supabase.storage
      .from("progress-media")
      .remove(existingMeasurement.photo_paths);
  }
  return new Response(null, { status: 204 });
}
