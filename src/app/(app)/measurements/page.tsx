import { MeasurementsPageClient } from "@/components/measurements-page-client";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { MeasurementPoint } from "@/lib/demo-data";

export const metadata = { title: "Measurements" };

function toMeasurementPoint(row: {
  measured_at: string;
  weight_kg: number | null;
  body_fat_percentage: number | null;
  waist_cm?: number | null;
  chest_cm?: number | null;
  shoulders_cm?: number | null;
  upper_arm_cm?: number | null;
  forearm_cm?: number | null;
  thigh_cm?: number | null;
  calf_cm?: number | null;
}): MeasurementPoint {
  return {
    date: row.measured_at.slice(0, 10),
    weight: row.weight_kg == null ? null : Number(row.weight_kg),
    bodyFat:
      row.body_fat_percentage == null
        ? undefined
        : Number(row.body_fat_percentage),
    waist: row.waist_cm == null ? undefined : Number(row.waist_cm),
    chest: row.chest_cm == null ? undefined : Number(row.chest_cm),
    shoulders:
      row.shoulders_cm == null ? undefined : Number(row.shoulders_cm),
    upperArm:
      row.upper_arm_cm == null ? undefined : Number(row.upper_arm_cm),
    forearm: row.forearm_cm == null ? undefined : Number(row.forearm_cm),
    thigh: row.thigh_cm == null ? undefined : Number(row.thigh_cm),
    calf: row.calf_cm == null ? undefined : Number(row.calf_cm),
  };
}

export default async function MeasurementsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase
      .from("body_measurements")
      .select(
        "measured_at,weight_kg,body_fat_percentage,waist_cm,chest_cm,shoulders_cm,upper_arm_cm,forearm_cm,thigh_cm,calf_cm,photo_paths",
      )
      .eq("user_id", user.id)
      .order("measured_at", { ascending: true })
      .limit(1000),
    supabase
      .from("profiles")
      .select("measurement_sharing")
      .eq("id", user.id)
      .single(),
  ]);
  const measurements = (rows ?? []).map(toMeasurementPoint);
  const photoRows = (rows ?? []).flatMap((row) =>
    ((row.photo_paths ?? []) as string[]).map((path: string) => ({
      path,
      date: new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(row.measured_at)),
    })),
  );
  const signedPhotos = photoRows.length
    ? await supabase.storage
        .from("progress-media")
        .createSignedUrls(
          photoRows.map((photo) => photo.path),
          60 * 60,
        )
    : { data: [] };
  const photos = (signedPhotos.data ?? []).flatMap((signed, index) =>
    signed.signedUrl
      ? [{ url: signed.signedUrl, date: photoRows[index].date }]
      : [],
  );
  const { data: partnerId } = await supabase.rpc("get_my_partner_id");
  const { data: partnerProfile } = partnerId
    ? await supabase
        .from("profiles")
        .select(
          "display_name,measurement_sharing,progress_photo_visibility",
        )
        .eq("id", partnerId)
        .single()
    : { data: null };
  const friendSharing =
    partnerProfile?.measurement_sharing === "detailed"
      ? ("detailed" as const)
      : partnerProfile?.measurement_sharing === "summary"
        ? ("summary" as const)
        : ("none" as const);

  let friendRows: Array<Record<string, unknown>> = [];
  if (partnerId && friendSharing === "detailed") {
    const { data } = await supabase
      .from("body_measurements")
      .select(
        "measured_at,weight_kg,body_fat_percentage,waist_cm,chest_cm,shoulders_cm,upper_arm_cm,forearm_cm,thigh_cm,calf_cm,photo_paths",
      )
      .eq("user_id", partnerId)
      .eq("visibility", "partner")
      .order("measured_at", { ascending: true })
      .limit(1000);
    friendRows = (data ?? []) as Array<Record<string, unknown>>;
  } else if (partnerId && friendSharing === "summary") {
    const { data } = await supabase.rpc("get_partner_measurement_summary", {
      p_owner_id: partnerId,
      p_from: null,
      p_to: null,
    });
    friendRows = (data ?? []) as Array<Record<string, unknown>>;
  }
  const friendMeasurements = friendRows.map((row) =>
    toMeasurementPoint(
      row as Parameters<typeof toMeasurementPoint>[0],
    ),
  );
  const { data: partnerPhotoRefs } =
    partnerId && partnerProfile?.progress_photo_visibility === "partner"
      ? await supabase.rpc("get_partner_measurement_photo_refs", {
          p_owner_id: partnerId,
        })
      : { data: [] };
  const friendPhotoRows = (
    (partnerPhotoRefs ?? []) as Array<{
      photo_path: string;
      measured_at: string;
    }>
  ).map((row) => ({
    path: row.photo_path,
    date: new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(row.measured_at)),
  }));
  const signedFriendPhotos = friendPhotoRows.length
    ? await supabase.storage
        .from("progress-media")
        .createSignedUrls(
          friendPhotoRows.map((photo) => photo.path),
          60 * 60,
        )
    : { data: [] };
  const friendPhotos = (signedFriendPhotos.data ?? []).flatMap(
    (signed, index) =>
      signed.signedUrl
        ? [{ url: signed.signedUrl, date: friendPhotoRows[index].date }]
        : [],
  );

  return (
    <MeasurementsPageClient
      measurements={measurements}
      photos={photos}
      detailsShared={profile?.measurement_sharing === "detailed"}
      friendMeasurements={friendMeasurements}
      friendName={partnerProfile?.display_name}
      friendSharing={friendSharing}
      friendPhotos={friendPhotos}
    />
  );
}
