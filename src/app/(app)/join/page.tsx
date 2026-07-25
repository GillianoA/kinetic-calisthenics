import { Suspense } from "react";
import { Users } from "lucide-react";
import { JoinForm } from "@/components/friend/join-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Join a partner" };

export default async function JoinPage() {
  await requireUser();
  return (
    <section className="glass-panel mx-auto mt-10 max-w-xl rounded-[30px] p-6 sm:p-9">
      <span className="iridescent grid size-13 place-items-center rounded-2xl text-white">
        <Users size={22} aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-[-0.05em]">Train together</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Accept this private invitation to share allowed workouts, milestones, and
        accountability signals with one partner.
      </p>
      <Suspense fallback={<div className="skeleton mt-7 h-40 rounded-2xl" />}>
        <JoinForm />
      </Suspense>
    </section>
  );
}
