import { Link } from "wouter";
import { MapPin, Navigation, Star, RefreshCw, TrendingUp, AlertCircle, Locate, Zap } from "lucide-react";
import { useNearMe } from "@/hooks/useNearMe";

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

function formatMK(n: number | null | undefined) {
  return n ? `MK ${n.toLocaleString()}` : "Negotiable";
}

function DistancePill({ km }: { km: number | null }) {
  if (km === null) return null;
  const label = km < 1 ? "< 1 km" : `~${km} km`;
  const color = km <= 10 ? "bg-green-500 text-white" : km <= 50 ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground";
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>{label}</span>;
}

export default function NearMe() {
  const { permission, listings, loading, isFallback, requestLocation, refetch } = useNearMe();

  if (permission === "idle") {
    return (
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 flex items-center gap-2">
          <Navigation size={16} className="text-white" />
          <span className="text-white font-black text-sm">Near Me</span>
          <span className="ml-auto text-teal-200 text-xs font-medium">GPS</span>
        </div>
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30 flex items-center justify-center">
            <Locate size={28} className="text-teal-500" />
          </div>
          <div>
            <h3 className="text-sm font-black mb-1">Find transport near you</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Allow location access to instantly see the closest drivers and vehicles to your current position.
            </p>
          </div>
          <button onClick={requestLocation}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-sm font-black px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-teal-500/25">
            <Navigation size={14} /> Use My Location
          </button>
          <button onClick={requestLocation}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            Skip — show trending instead
          </button>
        </div>
      </div>
    );
  }

  if (permission === "requesting" || loading) {
    return (
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 flex items-center gap-2">
          <Navigation size={16} className="text-white animate-pulse" />
          <span className="text-white font-black text-sm">Near Me</span>
        </div>
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
        <p className="text-center text-xs text-muted-foreground pb-4">
          {permission === "requesting" ? "Getting your location…" : "Loading nearby transport…"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {isFallback ? <TrendingUp size={14} className="text-teal-500" /> : (
            <div className="relative">
              <Navigation size={14} className="text-teal-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-card" />
            </div>
          )}
          <span className="text-sm font-black">{isFallback ? "Trending Transport" : "Near Me"}</span>
          {listings.length > 0 && (
            <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {listings.length} found
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFallback && (
            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
              <AlertCircle size={10} /><span>Location off</span>
            </div>
          )}
          <button onClick={refetch} className="p-1 rounded-lg hover:bg-muted transition-all active:scale-90">
            <RefreshCw size={12} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {isFallback && (
        <div className="mx-3 mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-700/30 rounded-xl p-2.5">
          <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed flex-1">Showing top-rated transport nationwide.</p>
          <button onClick={requestLocation} className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline shrink-0">Enable GPS</button>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-3xl mb-2">🗺️</div>
          <p className="text-sm text-muted-foreground">No transport found nearby</p>
          <Link href="/post-transport" className="text-xs text-teal-500 mt-1 inline-block hover:underline">List your vehicle →</Link>
        </div>
      ) : (
        <div className="p-3 grid grid-cols-2 gap-3">
          {listings.map(item => {
            const gradient = VEHICLE_GRADIENT[item.vehicle_type] ?? "from-teal-700/60 to-teal-500/30";
            return (
              <Link key={item.id} href={`/transport/${item.id}`}
                className="flex flex-col rounded-2xl overflow-hidden border border-card-border bg-background hover:border-teal-400/70 hover:shadow-md transition-all active:scale-95">
                <div className={`relative h-24 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                  {(item as any).thumbnail_url ? (
                    <img src={(item as any).thumbnail_url} alt={item.title} className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display="none"; (e.currentTarget.nextElementSibling as HTMLElement|null)?.style?.setProperty("display","flex"); }} />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center text-4xl absolute inset-0"
                    style={{ display:(item as any).thumbnail_url ? "none" : "flex" }}>
                    {VEHICLE_EMOJI[item.vehicle_type] ?? "🚗"}
                  </div>
                  {item.is_online && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[8px] font-bold text-green-300">LIVE</span>
                    </div>
                  )}
                  {item.distanceKm !== null && (
                    <div className="absolute bottom-2 left-2"><DistancePill km={item.distanceKm} /></div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
                <div className="p-2.5 flex flex-col gap-1 flex-1">
                  <div className="text-[11px] font-black leading-tight line-clamp-2">{item.title}</div>
                  <div className="flex items-center gap-0.5">
                    <MapPin size={8} className="text-muted-foreground shrink-0" />
                    <span className="text-[9px] text-muted-foreground truncate">{item.location}</span>
                  </div>
                  {item.rating > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Star size={8} className="fill-amber-400 text-amber-400" />
                      <span className="text-[9px] font-bold text-amber-500">{item.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="mt-auto pt-1 text-[10px] font-black text-teal-600 dark:text-teal-400 truncate">
                    {item.price_display || formatMK(item.price)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {listings.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-border">
          <Link href={isFallback ? "/transport?sortBy=rating" : "/transport"}
            className="flex items-center justify-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline">
            <Zap size={11} /> {isFallback ? "View all top-rated transport" : "View all nearby transport"}
          </Link>
        </div>
      )}
    </div>
  );
}
