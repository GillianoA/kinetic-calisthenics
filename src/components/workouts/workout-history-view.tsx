"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Copy,
  Dumbbell,
  Filter,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Button,
  EmptyState,
  GlassCard,
  PageHeader,
  StatusPill,
} from "@/components/ui/primitives";

export type WorkoutHistoryItem = {
  id: string;
  userId: string;
  ownerName: string;
  isOwner: boolean;
  name: string;
  type: string;
  date: string;
  durationMinutes: number;
  difficulty?: number | null;
  location?: string | null;
  exercises: string[];
  totalSets: number;
  totalReps: number;
  hasPersonalRecord: boolean;
};

export function WorkoutHistoryView({
  workouts,
  readOnly = false,
  initialQuery = "",
}: {
  workouts: WorkoutHistoryItem[];
  readOnly?: boolean;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState("all");
  const [user, setUser] = useState<"all" | "mine" | "partner">("all");
  const [fromDate, setFromDate] = useState("");
  const [pendingDelete, setPendingDelete] = useState<WorkoutHistoryItem>();

  const types = useMemo(
    () => [...new Set(workouts.map((workout) => workout.type))].sort(),
    [workouts],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return workouts.filter((workout) => {
      if (type !== "all" && workout.type !== type) return false;
      if (user === "mine" && !workout.isOwner) return false;
      if (user === "partner" && workout.isOwner) return false;
      if (fromDate && workout.date.slice(0, 10) < fromDate) return false;
      if (
        needle &&
        ![workout.name, workout.type, ...workout.exercises]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [fromDate, query, type, user, workouts]);

  const duplicate = async (id: string) => {
    const response = await fetch(`/api/workouts/${id}/duplicate`, { method: "POST" });
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
      id?: string;
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
    if (!pendingDelete) return;
    const response = await fetch(`/api/workouts/${pendingDelete.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Workout could not be deleted");
      return;
    }
    toast.success("Workout deleted");
    setPendingDelete(undefined);
    router.refresh();
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Workout history"
        title="Your training archive"
        description="Review every session, find an exercise, or repeat a workout that worked."
        action={
          readOnly ? (
            <StatusPill tone="current">Read-only preview</StatusPill>
          ) : (
            <Link href="/workouts/new" className="button-primary">
              <Plus size={17} aria-hidden="true" />
              Log workout
            </Link>
          )
        }
      />

      <GlassCard className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_.7fr_.7fr_.7fr]">
          <label className="relative">
            <span className="sr-only">Search workouts and exercises</span>
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
              aria-hidden="true"
            />
            <input
              className="field pl-11"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search workout or exercise"
            />
          </label>
          <label>
            <span className="sr-only">Filter by workout type</span>
            <select className="field" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="all">All workout types</option>
              {types.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by person</span>
            <select
              className="field"
              value={user}
              onChange={(event) => setUser(event.target.value as typeof user)}
            >
              <option value="all">You and partner</option>
              <option value="mine">Only you</option>
              <option value="partner">Only partner</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Show workouts from date</span>
            <input
              className="field"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
          <Filter size={14} aria-hidden="true" />
          Showing {filtered.length} of {workouts.length} shared and personal workouts
        </p>
      </GlassCard>

      {filtered.length === 0 ? (
        <GlassCard className="p-7">
          <EmptyState
            icon={Dumbbell}
            title={workouts.length ? "No workouts match" : "Your first session starts here"}
            description={
              workouts.length
                ? "Clear a filter or try a different exercise name."
                : "Log a workout and it will sync to every signed-in device."
            }
            action={
              workouts.length ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setType("all");
                    setUser("all");
                    setFromDate("");
                  }}
                >
                  Clear filters
                </Button>
              ) : readOnly ? null : (
                <Link href="/workouts/new" className="button-primary">
                  Log first workout
                </Link>
              )
            }
          />
        </GlassCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((workout) => (
            <article key={workout.id} className="glass-card rounded-[25px] p-5 sm:p-6">
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={workout.isOwner ? "current" : "friend"}>
                      {workout.isOwner ? "You" : workout.ownerName}
                    </StatusPill>
                    <StatusPill tone="neutral">{workout.type}</StatusPill>
                    {workout.hasPersonalRecord && (
                      <StatusPill tone="success">New record</StatusPill>
                    )}
                  </div>
                  {readOnly ? (
                    <h2 className="mt-4 truncate text-xl font-bold tracking-[-0.035em]">
                      {workout.name}
                    </h2>
                  ) : (
                    <Link
                      href={`/workouts/${workout.id}`}
                      className="mt-4 block truncate text-xl font-bold tracking-[-0.035em] hover:text-blue-700"
                    >
                      {workout.name}
                    </Link>
                  )}
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-100/75 text-sky-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                  <Dumbbell size={19} aria-hidden="true" />
                </span>
              </div>
              <div className="relative mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} aria-hidden="true" />
                  {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                    new Date(`${workout.date.slice(0, 10)}T12:00:00`),
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock3 size={14} aria-hidden="true" />
                  {workout.durationMinutes || "—"} min
                </span>
                {workout.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} aria-hidden="true" />
                    {workout.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <UserRound size={14} aria-hidden="true" />
                  {workout.totalSets} sets · {workout.totalReps} reps
                </span>
              </div>
              <p className="relative mt-4 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                {workout.exercises.join(" · ")}
              </p>
              {readOnly ? (
                <div className="relative mt-5 border-t border-slate-300/20 pt-4">
                  <p className="text-xs font-medium text-[var(--muted)]">
                    Preview data — sign in to open, duplicate, or edit sessions.
                  </p>
                </div>
              ) : (
                <div className="relative mt-5 flex flex-wrap gap-2 border-t border-slate-300/20 pt-4">
                  <Link href={`/workouts/${workout.id}`} className="button-secondary !min-h-10 text-sm">
                    View details
                  </Link>
                  <Button variant="ghost" onClick={() => duplicate(workout.id)}>
                    <Copy size={15} aria-hidden="true" />
                    Duplicate
                  </Button>
                  {workout.isOwner && (
                    <Button variant="ghost" onClick={() => setPendingDelete(workout)}>
                      <Trash2 size={15} aria-hidden="true" />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {!readOnly ? (
        <ConfirmDialog
          open={Boolean(pendingDelete)}
          title="Delete this workout?"
          description="Its exercises, sets, records linked only to it, and activity entry will be removed. This cannot be undone."
          confirmLabel="Delete workout"
          destructive
          onCancel={() => setPendingDelete(undefined)}
          onConfirm={remove}
        />
      ) : null}
    </div>
  );
}
