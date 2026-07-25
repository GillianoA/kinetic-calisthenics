import { ChallengeForm } from "@/components/forms/challenge-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Create challenge" };

export default async function NewChallengePage() {
  await requireUser();
  return <ChallengeForm />;
}
