import { useState, useMemo } from "react";
import { Calculator, Zap, ChevronDown, TrendingUp } from "lucide-react";

// Malawi city-to-city approximate distances (km)
const CITY_DISTANCES: Record<string, Record<string, number>> = {
  "Lilongwe":  { "Blantyre": 310, "Mzuzu": 370, "Zomba": 270, "Mangochi": 230, "Salima": 100, "Dedza": 85, "Lilongwe": 0 },
  "Blantyre":  { "Lilongwe": 310, "Zomba": 65, "Mangochi": 185, "Mzuzu": 660, "Dedza": 225, "Salima": 240, "Blantyre": 0 },
  "Mzuzu":     { "Lilongwe": 370, "Blantyre": 660, "Nkhata Bay": 50, "Karonga": 160, "Zomba": 710, "Mzuzu": 0 },
  "Zomba":     { "Blantyre": 65, "Lilongwe": 270, "Mangochi": 120, "Zomba": 0 },
  "Mangochi":  { "Blantyre": 185, "Lilongwe": 230, "Zomba": 120, "Salima": 140, "Mangochi": 0 },
  "Salima":    { "Lilongwe": 100, "Blantyre": 240, "Mangochi": 140, "Salima": 0 },
  "Karonga":   { "Mzuzu": 160, "Lilongwe": 520, "Karonga": 0 },
  "Kasungu":   { "Lilongwe": 125, "Mzuzu": 280, "Kasungu": 0 },
  "Dedza":     { "Lilongwe": 85, "Blantyre": 225, "Dedza": 0 },
};

const CITIES = [
  "Lilongwe","Blantyre","Mzuzu","Zomba","Mangochi","Salima",
  "Karonga","Kasungu","Dedza","Nkhata Bay","Mulanje","Thyolo",
];

// Price per km by vehicle type (MK)
const RATES = {
  taxi:       { perKm: 30,  base: 500,  label: "Taxi",       icon: "🚕", color: "bg-teal-500" },
  motorcycle: { perKm: 18,  base: 300,  label: "Motorcycle", icon: "🏍️", color: "bg-blue-500" },
  minibus:    { perKm: 12,  base: 200,  label: "Minibus",    icon: "🚌", color: "bg-purple-500" },
  hire_car:   { perKm: 45,  base: 800,  label: "Hire Car",   icon: "🚗", color: "bg-green-600" },
};

type VehicleKey = keyof typeof RATES;

// Duration-based pricing (MK per hour)
const HOURLY_RATES: Record<VehicleKey, number> = {
  taxi: 6000, motorcycle: 3500, minibus: 4500, hire_car: 9000,
};

type EstimatorMode = "route" | "duration";

function formatMK(n: number) {
  return `MK ${Math.round(n).toLocaleString()}`;
}

export default function FareEstimator() {
  const [mode, setMode] = useState<EstimatorMode>("route");
  const [from, setFrom] = useState("Lilongwe");
  const [to, setTo] = useState("Blantyre");
  const [hours, setHours] = useState(2);
  const [vehicleFilter, setVehicleFilter] = useState<VehicleKey | "all">("all");
  const [passengers, setPassengers] = useState(1);

  const distance = useMemo(() => {
    if (mode !== "route") return null;
    return CITY_DISTANCES[from]?.[to] ?? CITY_DISTANCES[to]?.[from] ?? null;
  }, [from, to, mode]);

  const estimates = useMemo(() => {
    return (Object.entries(RATES) as [VehicleKey, typeof RATES[VehicleKey]][]).map(([key, rate]) => {
      let fare = 0;
      if (mode === "route" && distance) {
        fare = rate.base + rate.perKm * distance;
      } else if (mode === "duration") {
        fare = HOURLY_RATES[key] * hours;
      }

      // Apply per-passenger factor for taxi/hire_car when >1 person
      if ((key === "taxi" || key === "hire_car") && passengers > 1) {
        fare = fare; // typically fixed per trip, not per head
      }
      if (key === "minibus" && passengers > 1) {
        fare = (fare / 12) * passengers; // minibus: per-seat pricing
      }

      return {
        key,
        ...rate,
        fare,
        fareMin: Math.round(fare * 0.85),
        fareMax: Math.round(fare * 1.20),
      };
    });
  }, [mode, distance, hours, passengers]);

  const visible = vehicleFilter === "all"
    ? estimates
    : estimates.filter(e => e.key === vehicleFilter);

  const cheapest = estimates.reduce((a, b) => b.fare > 0 && b.fare < a.fare ? b : a, estimates[0]);

  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 flex items-center gap-2">
        <Calculator size={16} className="text-white" />
        <span className="text-white font-black text-sm">Fare Estimator</span>
        <span className="ml-auto text-teal-200 text-xs font-medium">Live Rates</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-1.5 bg-muted p-1 rounded-xl">
          {(["route", "duration"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === m
                  ? "bg-white dark:bg-card shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "route" ? "🗺 By Route" : "⏱ By Duration"}
            </button>
          ))}
        </div>

        {/* Route selector */}
        {mode === "route" && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide mb-1 block">From</label>
                <div className="relative">
                  <select
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-input bg-background text-xs font-semibold outline-none appearance-none focus:border-teal-500"
                  >
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide mb-1 block">To</label>
                <div className="relative">
                  <select
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-input bg-background text-xs font-semibold outline-none appearance-none focus:border-teal-500"
                  >
                    {CITIES.filter(c => c !== from).map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {distance && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-full h-0.5 bg-gradient-to-r from-green-400 via-teal-400 to-teal-600 rounded-full" />
                <span className="shrink-0 font-bold text-foreground">~{distance} km</span>
              </div>
            )}
            {!distance && from !== to && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Exact distance unavailable — showing estimate
              </p>
            )}
          </div>
        )}

        {/* Duration slider */}
        {mode === "duration" && (
          <div>
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide mb-2 block">
              Duration: <span className="text-foreground">{hours} hour{hours > 1 ? "s" : ""}</span>
            </label>
            <input
              type="range"
              min={1}
              max={12}
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
              className="w-full accent-teal-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>1h</span><span>6h</span><span>12h</span>
            </div>
          </div>
        )}

        {/* Passengers */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Passengers</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPassengers(p => Math.max(1, p - 1))}
              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-all"
            >−</button>
            <span className="text-sm font-black w-4 text-center">{passengers}</span>
            <button
              onClick={() => setPassengers(p => Math.min(12, p + 1))}
              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-all"
            >+</button>
          </div>
        </div>

        {/* Vehicle filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setVehicleFilter("all")}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
              vehicleFilter === "all"
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground"
            }`}
          >All Types</button>
          {(Object.keys(RATES) as VehicleKey[]).map(k => (
            <button
              key={k}
              onClick={() => setVehicleFilter(k)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                vehicleFilter === k
                  ? "bg-teal-600 text-white border-teal-600"
                  : "border-border text-muted-foreground hover:border-teal-400"
              }`}
            >
              {RATES[k].icon} {RATES[k].label}
            </button>
          ))}
        </div>

        {/* Estimate rows */}
        <div className="space-y-2">
          {visible.map(est => {
            const isCheapest = est.key === cheapest.key && vehicleFilter === "all";
            return (
              <div
                key={est.key}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isCheapest
                    ? "border-green-500/40 bg-green-50 dark:bg-green-900/10"
                    : "border-border bg-background"
                }`}
              >
                <div className={`${est.color} w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0`}>
                  {est.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black">{est.label}</span>
                    {isCheapest && (
                      <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">CHEAPEST</span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {est.fare > 0 ? `${formatMK(est.fareMin)} – ${formatMK(est.fareMax)}` : "Enter route or duration"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-foreground">
                    {est.fare > 0 ? formatMK(est.fare) : "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">estimated</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-border pt-3">
          <TrendingUp size={10} className="inline mr-1 text-teal-500" />
          Estimates based on standard Malawi rates. Actual fares negotiated directly with operators.
          Fuel surcharges may apply during peak hours.
        </p>
      </div>
    </div>
  );
}
