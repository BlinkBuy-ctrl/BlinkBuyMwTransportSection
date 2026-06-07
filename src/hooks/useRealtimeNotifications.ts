import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { getIdentitySync } from "@/lib/identity";

export interface RealtimeCounts {
  notifications: number;
  messages: number;
}

type CountSetter = (updater: (prev: RealtimeCounts) => RealtimeCounts) => void;

export function useRealtimeNotifications(
  _userId: string | null | undefined,
  setCounts: CountSetter
) {
  const { toast } = useToast();
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  const cleanup = useCallback(() => {
    channelsRef.current.forEach(ch => supabase.removeChannel(ch));
    channelsRef.current = [];
  }, []);

  useEffect(() => {
    const identity = getIdentitySync();
    if (!identity?.token) return;

    // Subscribe to operator_notifications for this token
    const notifChannel = supabase
      .channel(`op_notif_${identity.token.slice(0, 8)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "operator_notifications",
          filter: `operator_token=eq.${identity.token}`,
        },
        (payload) => {
          const row = payload.new as any;
          setCounts(prev => ({ ...prev, notifications: prev.notifications + 1 }));
          toast({
            title: row?.title ?? "🔔 New notification",
            description: row?.message ?? "",
            duration: 4500,
          });
        }
      )
      .subscribe();

    channelsRef.current = [notifChannel];
    return cleanup;
  }, [setCounts, toast, cleanup]);
}
