import { notFound } from "next/navigation";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Gauge,
  MapPin,
  Trophy,
  UserRound,
} from "lucide-react";
import { WorkoutDetailActions } from "@/components/workouts/workout-detail-actions";
import { GlassCard, PageHeader, StatusPill } from "@/components/ui/primitives";
import { getViewerProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  distanceUnit,
  kilogramsToDisplay,
  metersToDisplay,
  weightUnit,
} from "@/lib/units";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: `Workout ${id.slice(0, 8)}` };
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getViewerProfile();
  const { id } = await params;
  const supabase = await createClient();
  const { data: workout } = await supabase
    .from("workouts")
    .select(
      "id,user_id,name,workout_type,workout_date,start_time,end_time,status,notes,perceived_difficulty,energy_level,location,photo_path,visibility,profiles!workouts_user_id_fkey(display_name),workout_exercises(id,exercise_name,category,position,notes,exercise_sets(id,set_number,repetitions,hold_seconds,added_weight,assistance_weight,distance_meters,rest_seconds,tempo,band_level,notes,completed,is_personal_record))",
    )
    .eq("id", id)
    .single();
  if (!workout) notFound();

  const canEdit = workout.user_id === viewer.id;
  const displayedWeightUnit = weightUnit(viewer.unit_preference);
  const displayedDistanceUnit = distanceUnit(viewer.unit_preference);
  const relatedProfile = Array.isArray(workout.profiles)
    ? workout.profiles[0]
    : workout.profiles;
  const ownerName = relatedProfile?.display_name ?? (canEdit ? "You" : "Partner");
  const duration =
    workout.start_time && workout.end_time
      ? Math.max(
          0,
          Math.round(
            (new Date(workout.end_time).getTime() - new Date(workout.start_time).getTime()) /
              60000,
          ),
        )
      : null;
  const photoUrl = workout.photo_path
    ? (
        await supabase.storage
          .from("progress-media")
          .createSignedUrl(workout.photo_path, 60 * 60)
      ).data?.signedUrl
    : undefined;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={`${canEdit ? "Your" : `${ownerName}’s`} workout`}
        title={workout.name}
        description={`${workout.status === "planned" ? "Planned" : workout.status === "skipped" ? "Skipped" : "Completed"} · ${workout.workout_type.replaceAll("_", " ")} · ${new Intl.DateTimeFormat(
          "en",
          { dateStyle: "long" },
        ).format(new Date(`${workout.workout_date}T12:00:00`))}`}
        action={<WorkoutDetailActions workoutId={workout.id} canEdit={canEdit} />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { icon: UserRound, label: "Athlete", value: canEdit ? "You" : ownerName },
          { icon: Clock3, label: "Duration", value: duration ? `${duration} min` : "Not timed" },
          { icon: Gauge, label: "Difficulty", value: workout.perceived_difficulty ? `${workout.perceived_difficulty}/10` : "—" },
          { icon: CheckCircle2, label: "Energy", value: workout.energy_level ? `${workout.energy_level}/10` : "—" },
          { icon: MapPin, label: "Location", value: workout.location ?? "Not set" },
        ].map(({ icon: Icon, label, value }) => (
          <GlassCard key={label} className="p-4">
            <Icon className="text-blue-600" size={17} aria-hidden="true" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">
              {label}
            </p>
            <p className="mt-1 truncate text-sm font-bold">{value}</p>
          </GlassCard>
        ))}
      </section>

      {photoUrl ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b border-slate-300/20 px-5 py-4 text-sm font-bold">
            <Camera
              aria-hidden
              className="size-[17px] text-blue-600"
            />
            Session progress photo
          </div>
          <div
            role="img"
            aria-label={`Progress photo for ${workout.name}`}
            className="aspect-[16/9] max-h-[36rem] w-full bg-slate-100 bg-cover bg-center dark:bg-slate-900"
            style={{ backgroundImage: `url("${photoUrl}")` }}
          />
        </GlassCard>
      ) : null}

      <section className="space-y-4">
        {[...workout.workout_exercises]
          .sort((a, b) => a.position - b.position)
          .map((exercise, index) => (
            <GlassCard key={exercise.id} className="overflow-hidden p-0">
              <div className="flex items-center justify-between gap-4 border-b border-slate-300/20 p-5 sm:p-6">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="iridescent grid size-11 shrink-0 place-items-center rounded-2xl text-white">
                    <Dumbbell size={19} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      Exercise {index + 1}
                    </p>
                    <h2 className="truncate text-lg font-bold tracking-[-0.03em]">
                      {exercise.exercise_name}
                    </h2>
                  </div>
                </div>
                <StatusPill tone="neutral">{exercise.category}</StatusPill>
              </div>
              <div className="grid gap-2 p-4 sm:p-5">
                {[...exercise.exercise_sets]
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-[48px_repeat(2,minmax(0,1fr))] items-center gap-2 rounded-2xl border border-white/50 bg-white/35 p-3 text-sm sm:grid-cols-[48px_repeat(6,minmax(0,1fr))] dark:border-white/8 dark:bg-white/[0.03]"
                    >
                      <span className="font-bold text-blue-700">#{set.set_number}</span>
                      <SetValue label="Reps" value={set.repetitions} />
                      <SetValue label="Hold" value={set.hold_seconds} unit="s" />
                      <SetValue
                        label="Added"
                        value={
                          set.added_weight == null
                            ? null
                            : kilogramsToDisplay(
                                Number(set.added_weight),
                                viewer.unit_preference,
                              )
                        }
                        unit={displayedWeightUnit}
                        className="hidden sm:block"
                      />
                      <SetValue
                        label="Assist"
                        value={
                          set.assistance_weight == null
                            ? null
                            : kilogramsToDisplay(
                                Number(set.assistance_weight),
                                viewer.unit_preference,
                              )
                        }
                        unit={displayedWeightUnit}
                        className="hidden sm:block"
                      />
                      <SetValue
                        label="Distance"
                        value={
                          set.distance_meters == null
                            ? null
                            : metersToDisplay(
                                Number(set.distance_meters),
                                viewer.unit_preference,
                              )
                        }
                        unit={displayedDistanceUnit}
                        className="hidden sm:block"
                      />
                      <div className="hidden justify-self-end sm:block">
                        {set.is_personal_record ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">
                            <Trophy size={11} aria-hidden="true" />
                            PR
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--muted)]">
                            {set.completed ? "Complete" : "Skipped"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              {exercise.notes && (
                <p className="border-t border-slate-300/20 px-5 py-4 text-sm leading-6 text-[var(--muted)]">
                  {exercise.notes}
                </p>
              )}
            </GlassCard>
          ))}
      </section>

      {workout.notes && (
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-bold">
            <CalendarDays size={17} className="text-blue-600" aria-hidden="true" />
            Session notes
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">
            {workout.notes}
          </p>
        </GlassCard>
      )}
    </div>
  );
}

function SetValue({
  label,
  value,
  unit,
  className = "",
}: {
  label: string;
  value: number | null;
  unit?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </span>
      <span className="mt-0.5 block font-semibold">
        {value == null ? "—" : `${Number(value)}${unit ? ` ${unit}` : ""}`}
      </span>
    </div>
  );
}
