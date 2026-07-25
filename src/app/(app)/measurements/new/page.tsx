import { MeasurementForm } from "@/components/forms/measurement-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Record measurement" };

export default async function NewMeasurementPage() {
  await requireUser();
  return <MeasurementForm />;
}
