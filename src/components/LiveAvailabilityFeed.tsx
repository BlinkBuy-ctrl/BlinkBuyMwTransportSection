import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Zap, MapPin, Star, Circle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LiveOperator {
  id: string;
  title: string;
  vehicle_type: string;
  location: string;
  rating: number;
  review_count: number;
  price_display: string | null;
  price: number | null;
  is_online: boolean;
  tags: string[];
  operator_token: string;
}

function formatMK(n: number | null | undefined) {
  if (!n) return "Negotiable";
  return `MK ${n.toLocaleString()}`;
}

const VEHICLE_EMOJI: Record<string, string> = {
  "Taxi": "🚕",
  "Motorcycle": "🏍️",
  "Minibus": "🚌",
  "Shuttle": "🚐",
  "Hire Car": "🚗",
  "Airport Transfer": "✈️",
  "Cargo / Delivery": "🚛",
};

export default function LiveAvailabilityFeed() {
  const [operators, setOperators] = useState<LiveOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [pulseId, setPulseId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchOnline = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, vehicle_type, location, rating, review_count, price_display, price, is_online, tags, operator_token")
        .eq("status", "active")
        .eq("is_online", true)
        .order("updated_at", { ascending: false })
        .limit(12);

      if (!error && data) {
        setOperators(data as LiveOperator[]);
        setLastUpdate(new Date());
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnline();

    // Supabase Realtime subscription for instant updates
    const channel = supabase
      .channel("live_operators")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "listings",
          filter: "is_online=eq.true",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOp = payload.new as LiveOperator;
            setOperators(prev => [newOp, ...prev].slice(0, 12));
            setPulseId(newOp.id);
            setTimeout(() => setPulseId(null), 3000);
          } else if (payload.eventType === "UPDATE") {
            setOperators(prev =>
              prev.map(op =>
                op.id === payload.new.id ? { ...op, ...payload.new as LiveOperator } : op
              )
            );
            setPulseId(payload.new.id as string);
            setTimeout(() => setPulseId(null), 2000);
          } else if (payload.eventType === "DELETE") {
            setOperators(prev => prev.filter(op => op.id !== payload.old.id));
          }
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Refresh every 30s as fallback
    const interval = setInterval(fetchOnline, 30_000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const timeSince = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);

  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Circle size={8} className="fill-green-500 text-green-500" />
            <span className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-75 w-2 h-2" />
          </div>
          <span className="text-sm font-black">Live Availability</span>
          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {operators.length} online
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {timeSince < 5 ? "Just now" : `${timeSince}s ago`}
          </span>
          <button
            onClick={() => { setLoading(true); fetchOnline(); }}
            className="p-1 rounded-lg hover:bg-muted transition-all active:scale-90"
          >
            <RefreshCw size={12} className={`text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : operators.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-3xl mb-2">🚗</div>
          <p className="text-sm text-muted-foreground">No operators online right now</p>
          <Link href="/post-transport" className="text-xs text-teal-500 mt-1 inline-block hover:underline">
            List your vehicle →
          </Link>
        </div>
      ) : (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto scrollbar-none">
          {operators.map(op => (
            <Link
              key={op.id}
              href={`/transport/${op.id}`}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all hover:border-teal-400/60 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 active:scale-98 ${
                pulseId === op.id
                  ? "border-green-400 bg-green-50 dark:bg-green-900/10 scale-[1.02]"
                  : "border-border bg-background"
              }`}
            >
              {/* Vehicle type badge */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/30 flex items-center justify-center text-lg shrink-0">
                {VEHICLE_EMOJI[op.vehicle_type] ?? "🚗"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs font-black truncate">{op.title}</span>
                  {pulseId === op.id && (
                    <span className="text-[9px] bg-green-500 text-white px-1 py-0.5 rounded-full font-bold shrink-0 animate-pulse">NEW</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <MapPin size={8} />{op.location}
                  </span>
                  {op.rating > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Star size={8} className="fill-amber-400" />{op.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-black text-teal-600 dark:text-teal-400">
                  {op.price_display || formatMK(op.price)}
                </div>
                <div className="flex items-center justify-end gap-0.5 mt-0.5">
                  <Zap size={8} className="text-green-500" />
                  <span className="text-[9px] text-green-600 dark:text-green-400 font-bold">Online</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {operators.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-border">
          <Link
            href="/transport?isOnline=true"
            className="flex items-center justify-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
          >
            <Zap size={11} /> View all online operators
          </Link>
        </div>
      )}
    </div>
  );
}
