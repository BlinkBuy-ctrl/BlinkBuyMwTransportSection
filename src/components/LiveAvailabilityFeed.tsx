import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Zap, MapPin, Star, Circle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LiveOperator {
  id: string; title: string; vehicle_type: string; location: string;
  rating: number; review_count: number; price_display: string | null;
  price: number | null; is_online: boolean; tags: string[];
  operator_token: string; thumbnail_url?: string | null;
  is_premium?: boolean; from_city?: string; to_city?: string;
}

function formatMK(n: number | null | undefined) {
  return n ? `MK ${n.toLocaleString()}` : "Negotiable";
}

const VEHICLE_EMOJI: Record<string, string> = {
  "Taxi":"🚕","Motorcycle":"🏍️","Minibus":"🚌","Shuttle":"🚐","Hire Car":"🚗",
  "Airport Transfer":"✈️","Cargo / Delivery":"🚛","School Transport":"🏫",
  "Corporate Transport":"🏢","Other":"🚘",
};

const VEHICLE_GRADIENT: Record<string, string> = {
  "Taxi":               "from-yellow-700/60 to-yellow-500/30",
  "Motorcycle":         "from-orange-700/60 to-orange-500/30",
  "Minibus":            "from-blue-700/60 to-blue-500/30",
  "Shuttle":            "from-indigo-700/60 to-indigo-500/30",
  "Hire Car":           "from-teal-700/60 to-teal-500/30",
  "Airport Transfer":   "from-sky-700/60 to-sky-500/30",
  "Cargo / Delivery":   "from-green-700/60 to-green-500/30",
  "School Transport":   "from-red-700/60 to-red-500/30",
  "Corporate Transport":"from-purple-700/60 to-purple-500/30",
  "Other":              "from-slate-700/60 to-slate-500/30",
};

export default function LiveAvailabilityFeed() {
  const [operators, setOperators] = useState<LiveOperator[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [pulseId, setPulseId]     = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchOnline = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title,vehicle_type,location,rating,review_count,price_display,price,is_online,tags,operator_token,thumbnail_url,is_premium,from_city,to_city")
        .eq("status","active")
        .eq("is_online",true)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (!error && data) { setOperators(data as LiveOperator[]); setLastUpdate(new Date()); }
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOnline();
    const channel = supabase.channel("live_operators")
      .on("postgres_changes", { event:"*", schema:"public", table:"listings", filter:"is_online=eq.true" }, payload => {
        if (payload.eventType === "INSERT") {
          const n = payload.new as LiveOperator;
          setOperators(prev => [n, ...prev].slice(0,20));
          setPulseId(n.id); setTimeout(() => setPulseId(null), 3000);
        } else if (payload.eventType === "UPDATE") {
          setOperators(prev => prev.map(op => op.id===payload.new.id ? {...op,...payload.new as LiveOperator} : op));
          setPulseId(payload.new.id as string); setTimeout(() => setPulseId(null), 2000);
        } else if (payload.eventType === "DELETE") {
          setOperators(prev => prev.filter(op => op.id !== payload.old.id));
        }
        setLastUpdate(new Date());
      }).subscribe();
    channelRef.current = channel;
    const interval = setInterval(fetchOnline, 30_000);
    return () => { channel.unsubscribe(); clearInterval(interval); };
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
          <button onClick={() => { setLoading(true); fetchOnline(); }}
            className="p-1 rounded-lg hover:bg-muted transition-all active:scale-90">
            <RefreshCw size={12} className={`text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Cards — same style as Browse Vehicles */}
      {loading ? (
        <div className="p-3 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_,i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-card-border">
              <div className="h-24 bg-muted animate-pulse" />
              <div className="p-2.5 space-y-1.5">
                <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
                <div className="h-2.5 bg-muted rounded animate-pulse w-3/5" />
                <div className="h-2.5 bg-muted rounded animate-pulse w-2/5" />
              </div>
            </div>
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
        <div className="p-3 grid grid-cols-2 gap-3">
          {operators.map(op => {
            const gradient = VEHICLE_GRADIENT[op.vehicle_type] ?? "from-teal-700/60 to-teal-500/30";
            const isNew = pulseId === op.id;
            return (
              <Link key={op.id} href={`/transport/${op.id}`}
                className={`flex flex-col rounded-2xl overflow-hidden border bg-background hover:border-teal-400/70 hover:shadow-md transition-all active:scale-95 ${
                  isNew ? "border-green-400 shadow-green-200 dark:shadow-green-900/30 shadow-md scale-[1.02]" : "border-card-border"
                }`}>
                {/* Image / gradient header */}
                <div className={`relative h-24 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                  {op.thumbnail_url ? (
                    <img src={op.thumbnail_url} alt={op.title} className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display="none"; (e.currentTarget.nextElementSibling as HTMLElement|null)?.style?.setProperty("display","flex"); }} />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center text-4xl absolute inset-0"
                    style={{ display: op.thumbnail_url ? "none" : "flex" }}>
                    {VEHICLE_EMOJI[op.vehicle_type] ?? "🚗"}
                  </div>

                  {/* LIVE badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[8px] font-bold text-green-300">LIVE</span>
                  </div>

                  {/* NEW flash */}
                  {isNew && (
                    <div className="absolute top-2 left-2 bg-green-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full animate-pulse">
                      NEW
                    </div>
                  )}

                  {/* Premium */}
                  {op.is_premium && (
                    <div className="absolute bottom-2 left-2 bg-yellow-400/90 text-[8px] font-black text-yellow-900 px-1.5 py-0.5 rounded-full">
                      ⭐ PRO
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>

                {/* Body */}
                <div className="p-2.5 flex flex-col gap-1 flex-1">
                  <div className="text-[11px] font-black leading-tight line-clamp-2">{op.title}</div>
                  <div className="flex items-center gap-0.5">
                    <MapPin size={8} className="text-muted-foreground shrink-0" />
                    <span className="text-[9px] text-muted-foreground truncate">{op.location}</span>
                  </div>
                  {op.from_city && op.to_city && (
                    <div className="text-[9px] text-teal-600 dark:text-teal-400 font-semibold truncate">
                      {op.from_city} → {op.to_city}
                    </div>
                  )}
                  {op.rating > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Star size={8} className="fill-amber-400 text-amber-400" />
                      <span className="text-[9px] font-bold text-amber-500">{op.rating.toFixed(1)}</span>
                      {op.review_count > 0 && <span className="text-[8px] text-muted-foreground">({op.review_count})</span>}
                    </div>
                  )}
                  <div className="mt-auto pt-1 text-[10px] font-black text-teal-600 dark:text-teal-400 flex items-center gap-1 truncate">
                    <Zap size={8} className="text-green-500 shrink-0" />
                    {op.price_display || formatMK(op.price)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {operators.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-border">
          <Link href="/transport?isOnline=true"
            className="flex items-center justify-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline">
            <Zap size={11} /> View all online operators
          </Link>
        </div>
      )}
    </div>
  );
}
