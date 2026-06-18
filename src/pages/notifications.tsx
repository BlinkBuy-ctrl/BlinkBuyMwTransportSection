import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Bell, Zap, CheckCircle, Calendar, Star, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getOrCreateIdentity } from "@/lib/identity";

interface Notif {
  id: string;
  type: "booking_update" | "new_review" | "system" | "premium";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  booking_update: { icon: Calendar, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
  new_review:     { icon: Star,     color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
  premium:        { icon: Zap,      color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30" },
  system:         { icon: Info,     color: "text-muted-foreground bg-muted" },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function NotificationsPage() {
  const [, navigate]  = useLocation();
  const [notifs, setNotifs]   = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  // FIX: token stored in ref — accessible in markRead without being in closure scope
  // This was the crash: markRead used `identity` variable that only existed inside useEffect
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const identity = await getOrCreateIdentity();
        tokenRef.current = identity.token;
        if (cancelled) return;
        const { data } = await supabase
          .from("operator_notifications")
          .select("*")
          .eq("operator_token", identity.token)
          .order("created_at", { ascending: false })
          .limit(50);
        if (!cancelled) setNotifs((data ?? []) as Notif[]);
      } catch { /* ignore network errors */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const markRead = async (n: Notif) => {
    // Optimistic update first — UI responds immediately, no waiting
    setNotifs(prev => prev.map(x => x.id === n.id ? {...x, read: true} : x));
    // Persist silently — failure won't crash
    try {
      const token = tokenRef.current;
      if (token) {
        await supabase
          .from("operator_notifications")
          .update({ read: true })
          .eq("id", n.id)
          .eq("operator_token", token);
      }
    } catch { /* ignore */ }
    // Navigate using wouter for internal links — prevents full page reload crash
    if (n.link) {
      try {
        n.link.startsWith("/") ? navigate(n.link) : window.open(n.link, "_blank", "noopener,noreferrer");
      } catch { /* ignore bad links */ }
    }
  };

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({...n, read: true})));
    try {
      const token = tokenRef.current;
      if (token) {
        await supabase
          .from("operator_notifications")
          .update({ read: true })
          .eq("operator_token", token)
          .eq("read", false);
      }
    } catch { /* ignore */ }
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-24">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black">Notifications</h1>
          {unread > 0 && <p className="text-xs text-muted-foreground">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs text-teal-600 font-bold hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_,i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse"/>)}
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="text-muted-foreground mx-auto mb-3 opacity-20"/>
          <h2 className="text-base font-bold mb-1">No notifications yet</h2>
          <p className="text-sm text-muted-foreground">Booking updates and reviews will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
            const Icon = cfg.icon;
            return (
              <div key={n.id}
                onClick={() => markRead(n)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer hover:border-teal-400/50 active:scale-[0.99] ${
                  n.read ? "border-border bg-card" : "border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10"
                }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon size={14}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-black ${!n.read ? "text-foreground" : "text-foreground/80"}`}>{n.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                  {n.link && <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-1 block">Tap to view →</span>}
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1.5"/>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
