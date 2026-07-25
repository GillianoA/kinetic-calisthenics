import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { measurementSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = measurementSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);

  const value = parsed.data;
  const { data, error } = await supabase
    .from("body_measurements")
    .insert({
      user_id: user.id,
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
    .select("*")
    .single();

  if (error) {
    return Response.json({ error: "Measurement could not be saved." }, { status: 400 });
  }
  return Response.json({ data }, { status: 201 });
}
