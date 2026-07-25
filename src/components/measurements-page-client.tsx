"use client";

import { useRouter } from "next/navigation";
import { MeasurementsView } from "@/components/measurements-view";
import type { MeasurementPoint } from "@/lib/demo-data";

export function MeasurementsPageClient({
  measurements,
  photos,
  detailsShared,
  friendMeasurements,
  friendName,
  friendSharing,
  friendPhotos,
}: {
  measurements: MeasurementPoint[];
  photos: Array<{ url: string; date: string }>;
  detailsShared: boolean;
  friendMeasurements: MeasurementPoint[];
  friendName?: string;
  friendSharing: "none" | "summary" | "detailed";
  friendPhotos: Array<{ url: string; date: string }>;
}) {
  const router = useRouter();
  return (
    <MeasurementsView
      measurements={measurements}
      photos={photos}
      detailsShared={detailsShared}
      friendMeasurements={friendMeasurements}
      friendName={friendName}
      friendSharing={friendSharing}
      friendPhotos={friendPhotos}
      onAddMeasurement={() => router.push("/measurements/new")}
      onAddPhoto={() => router.push("/measurements/new")}
      onManagePrivacy={() => router.push("/settings#privacy")}
    />
  );
}
