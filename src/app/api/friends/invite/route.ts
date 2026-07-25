import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.rpc("create_friend_invite", {
    p_valid_for: "7 days",
  });
  if (error || !data?.[0]) {
    return Response.json(
      { error: "Invitation could not be created. Try again shortly." },
      { status: 400 },
    );
  }

  const invite = data[0] as {
    invite_id: string;
    invite_token: string;
    expires_at: string;
  };
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL("http://localhost:3000").origin;
  return Response.json({
    id: invite.invite_id,
    code: invite.invite_token,
    expiresAt: invite.expires_at,
    link: `${siteUrl}/join?code=${encodeURIComponent(invite.invite_token)}`,
  });
}
