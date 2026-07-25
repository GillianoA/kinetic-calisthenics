"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function usePartnerRealtime(enabled = true) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let active = true;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) return;
      channel = supabase
        .channel(`partner-activity:${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "activity_feed" },
          (payload: { new: Record<string, unknown> }) => {
            const record = payload.new as {
              user_id?: string;
              activity_type?: string;
            };
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => router.refresh(), 250);
            if (
              record.activity_type &&
              record.user_id &&
              record.user_id !== user.id
            ) {
              toast("Your partner shared an update", {
                description: "Their latest training activity is now visible.",
              });
            }
          },
        )
        .subscribe();
    })();

    return () => {
      active = false;
      clearTimeout(timeoutRef.current);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [enabled, router]);
}
