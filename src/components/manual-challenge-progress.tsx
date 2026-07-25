"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ManualChallengeProgress({
  challengeId,
  initialValue,
  targetValue,
  unit,
  canUpdate,
}: {
  challengeId: string;
  initialValue: number;
  targetValue: number;
  unit: string;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(initialValue));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const currentValue = Number(value);
    if (!Number.isFinite(currentValue) || currentValue < 0) {
      toast.error("Enter a non-negative progress value.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/challenges/${challengeId}/progress`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentValue }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        toast.error("Progress could not be updated", { description: result.error });
        return;
      }
      toast.success("Your challenge progress is up to date");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-[22px] border border-white/55 bg-white/35 p-4 dark:border-white/8 dark:bg-white/[0.03]">
      <p className="text-sm font-bold">Update your self-reported progress</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        Enter your cumulative total for this challenge. Your partner can see it, but can only
        update their own value.
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-semibold">
            Current total ({unit})
          </span>
          <input
            className="field"
            type="number"
            min="0"
            max="1000000000"
            step="0.1"
            value={value}
            disabled={!canUpdate || saving}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="button-primary"
          disabled={!canUpdate || saving}
          onClick={save}
        >
          {saving ? (
            <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
          ) : (
            <Save size={16} aria-hidden="true" />
          )}
          Save progress
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Target: {targetValue} {unit}
        {!canUpdate ? " · Updates open only during the active date window." : ""}
      </p>
    </div>
  );
}
