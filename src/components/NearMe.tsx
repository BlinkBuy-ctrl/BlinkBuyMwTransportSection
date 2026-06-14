import { Link } from "wouter";
import {
  MapPin, Navigation, Star, RefreshCw,
  TrendingUp, Zap, AlertCircle, Locate
} from "lucide-react";
import { useNearMe } from "@/hooks/useNearMe";

const VEHICLE_EMOJI: Record<string, string> = {
  "Taxi": "🚕",
  "Motorcycle": "🏍️",
  "Minibus": "🚌",
  "Shuttle": "🚐",
  "Hire Car": "🚗",
  "Airport Transfer": "✈️",
  "Cargo / Delivery": "🚛",
  "School Transport": "🏫",
  "Corporate Transport": "🏢",
  "Other": "🚘",
};

function formatMK(n: number | null | undefined) {
  if (!n) return "Negotiable";
  return `MK ${n.toLocaleString()}`;
}

function DistancePill({ km }: { km: number | null }) {
  if (km === null) return null;
  const label = km < 1 ? "< 1 km" : `~${km} km`;
  const color =
    km <= 10
      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
      : km <= 50
      ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
      : "bg-muted text-muted-foreground";

  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${color}`}>
      {label}
    </span>
  );
}

export default function NearMe() {
  const { permission, listings, loading, isFallback, requestLocation, refetch } = useNearMe();

  // ── Permission prompt screen ─────────────────────────────────────────
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
            <h3 className="text-sm font-black text-foreground mb-1">
              Find transport near you
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Allow location access to instantly see the closest drivers and vehicles to your current position.
            </p>
          </div>

          <button
            onClick={requestLocation}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-sm font-black px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-teal-500/25"
          >
            <Navigation size={14} />
            Use My Location
          </button>

          <button
            onClick={requestLocation}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Skip — show trending instead
          </button>
        </div>
      </div>
    );
  }

  // ── Requesting / loading ─────────────────────────────────────────────
  if (permission === "requesting" || loading) {
    return (
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 flex items-center gap-2">
          <Navigation size={16} className="text-white animate-pulse" />
          <span className="text-white font-black text-sm">Near Me</span>
        </div>

        <div className="p-4 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
          <p className="text-center text-xs text-muted-foreground pt-1">
            {permission === "requesting" ? "Getting your location…" : "Loading nearby transport…"}
          </p>
        </div>
      </div>
    );
  }

  // ── Results (granted or fallback) ────────────────────────────────────
  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {isFallback ? (
            <TrendingUp size={14} className="text-teal-500" />
          ) : (
            <div className="relative">
              <Navigation size={14} className="text-teal-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-card" />
            </div>
          )}
          <span className="text-sm font-black">
            {isFallback ? "Trending Transport" : "Near Me"}
          </span>
          {listings.length > 0 && (
            <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {listings.length} found
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isFallback && (
            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
              <AlertCircle size={10} />
              <span>Location off</span>
            </div>
          )}
          <button
            onClick={refetch}
            className="p-1 rounded-lg hover:bg-muted transition-all active:scale-90"
            title="Refresh"
          >
            <RefreshCw size={12} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Fallback notice */}
      {isFallback && (
        <div className="mx-3 mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-700/30 rounded-xl p-2.5">
          <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
              Showing top-rated transport nationwide.
            </p>
          </div>
          <button
            onClick={requestLocation}
            className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline shrink-0"
          >
            Enable GPS
          </button>
        </div>
      )}

      {/* List */}
      {listings.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-3xl mb-2">🗺️</div>
          <p className="text-sm text-muted-foreground">No transport found nearby</p>
          <Link
            href="/post-transport"
            className="text-xs text-teal-500 mt-1 inline-block hover:underline"
          >
            List your vehicle →
          </Link>
        </div>
      ) : (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto scrollbar-none">
          {listings.map(item => (
            <Link
              key={item.id}
              href={`/transport/${item.id}`}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-background hover:border-teal-400/60 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 active:scale-98 transition-all"
            >
              {/* Vehicle emoji */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/30 flex items-center justify-center text-lg shrink-0">
                {VEHICLE_EMOJI[item.vehicle_type] ?? "🚗"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs font-black truncate">{item.title}</span>
                  {item.is_online && (
                    <span className="text-[9px] bg-green-500 text-white px-1 py-0.5 rounded-full font-bold shrink-0">
                      LIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5 truncate">
                    <MapPin size={8} className="shrink-0" />{item.location}
                  </span>
                  {item.rating > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-500 shrink-0">
                      <Star size={8} className="fill-amber-400" />
                      {item.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <div className="text-xs font-black text-teal-600 dark:text-teal-400">
                  {item.price_display || formatMK(item.price)}
                </div>
                <DistancePill km={item.distanceKm} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {listings.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-border">
          <Link
            href={isFallback ? "/transport?sortBy=rating" : "/transport"}
            className="flex items-center justify-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
          >
            <Zap size={11} />
            {isFallback ? "View all top-rated transport" : "View all nearby transport"}
          </Link>
        </div>
      )}
    </div>
  );
}
