"use client";

import Link from "next/link";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/primitives";

export function WorkoutDetailActions({
  workoutId,
  canEdit,
}: {
  workoutId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const duplicate = async () => {
    const response = await fetch(`/api/workouts/${workoutId}/duplicate`, { method: "POST" });
    const result = (await response.json().catch(() => ({}))) as {
      id?: string;
      error?: string;
    };
    if (!response.ok) {
      toast.error("Workout could not be duplicated", { description: result.error });
      return;
    }
    toast.success("Workout duplicated");
    router.push(`/workouts/${result.id}`);
    router.refresh();
  };

  const remove = async () => {
    const response = await fetch(`/api/workouts/${workoutId}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Workout could not be deleted");
      return;
    }
    toast.success("Workout deleted");
    router.replace("/workouts");
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={duplicate}>
          <Copy size={16} aria-hidden="true" />
          Duplicate
        </Button>
        {canEdit && (
          <>
            <Link href={`/workouts/${workoutId}/edit`} className="button-secondary !min-h-10 text-sm">
              <Pencil size={16} aria-hidden="true" />
              Edit
            </Link>
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              <Trash2 size={16} aria-hidden="true" />
              Delete
            </Button>
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirming}
        title="Delete this workout?"
        description="The workout and all of its exercise sets will be permanently removed."
        confirmLabel="Delete workout"
        destructive
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </>
  );
}
