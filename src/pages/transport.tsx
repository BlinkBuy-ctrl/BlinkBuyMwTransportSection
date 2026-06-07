import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Search, MapPin, Star, SlidersHorizontal, X,
  Car, Truck, Bus, Plane, Package, Clock, Zap,
  Calendar, ChevronDown, Plus, Bike
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import FareEstimator from "@/components/FareEstimator";
import LiveAvailabilityFeed from "@/components/LiveAvailabilityFeed";
import { ServiceCard } from "@/components/ServiceCard";

const TRANSPORT_TYPES = [
  { label: "All",      value: "all",               icon: Car },
  { label: "Taxi",     value: "Taxi",               icon: Car },
  { label: "Moto",     value: "Motorcycle",         icon: Bike },
  { label: "Minibus",  value: "Minibus",             icon: Bus },
  { label: "Shuttle",  value: "Shuttle",             icon: Bus },
  { label: "Airport",  value: "Airport Transfer",    icon: Plane },
  { label: "Cargo",    value: "Cargo / Delivery",    icon: Package },
  { label: "Hire Car", value: "Hire Car",            icon: Truck },
];

const CITIES = [
  "All Locations","Balaka","Blantyre","Chikwawa","Chiradzulu","Chitipa","Dedza","Dowa",
  "Karonga","Kasungu","Likoma","Lilongwe","Machinga","Mangochi","Mchinji","Mulanje",
  "Mwanza","Mzimba","Neno","Nkhata Bay","Nkhotakota","Nsanje","Ntcheu","Ntchisi",
  "Phalombe","Rumphi","Salima","Thyolo","Zomba",
];

const POPULAR_ROUTES = [
  { from: "Lilongwe", to: "Blantyre",  est: "MK 8,000" },
  { from: "Blantyre",  to: "Zomba",    est: "MK 3,000" },
  { from: "Lilongwe", to: "Mzuzu",     est: "MK 10,000" },
  { from: "Lilongwe", to: "Airport",   est: "MK 5,000" },
];

interface Listing {
  id: string;
  title: string;
  description: string;
  vehicle_type: string;
  location: string;
  price: number | null;
  price_display: string | null;
  price_type: string | null;
  is_online: boolean;
  rating: number;
  review_count: number;
  tags: string[];
  operator_token: string;
  // ServiceCard compatibility shim
  worker?: null;
  category?: string;
}

function normalizeToServiceCard(l: Listing) {
  return {
    ...l,
    priceDisplay: l.price_display,
    priceType: l.price_type,
    isOnline: l.is_online,
    reviewCount: l.review_count,
    worker: null,
    category: "Transport & Delivery",
  };
}

export default function TransportPage() {
  const [listings, setListings]       = useState<Listing[]>([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showEstimator, setShowEstimator] = useState(false);
  const [activeTab, setActiveTab]     = useState<"listings"|"live"|"estimator">("listings");

  const [from, setFrom]             = useState("");
  const [to, setTo]                 = useState("");
  const [vehicleType, setVehicleType] = useState("all");
  const [location, setLocation]     = useState("All Locations");
  const [sortBy, setSortBy]         = useState("rating");
  const [tripType, setTripType]     = useState<"now"|"later">("now");
  const [onlineOnly, setOnlineOnly] = useState(false);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(1);
  }, [from, to, vehicleType, location, sortBy, onlineOnly]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        let q = supabase
          .from("listings")
          .select("*", { count: "exact" })
          .eq("status", "active");

        if (from)                        q = q.ilike("title", `%${from}%`);
        if (vehicleType !== "all")       q = q.eq("vehicle_type", vehicleType);
        if (location !== "All Locations") q = q.ilike("location", `%${location}%`);
        if (onlineOnly)                  q = q.eq("is_online", true);

        if (sortBy === "rating")      q = q.order("rating",     { ascending: false });
        else if (sortBy === "price_asc")  q = q.order("price", { ascending: true });
        else if (sortBy === "price_desc") q = q.order("price", { ascending: false });
        else                          q = q.order("created_at", { ascending: false });

        const pageSize = 12;
        const from_idx = (page - 1) * pageSize;
        q = q.range(from_idx, from_idx + pageSize - 1);

        const { data, error, count } = await q;
        if (mounted) {
          setListings((data ?? []) as Listing[]);
          setTotal(count ?? 0);
        }
      } catch {
        if (mounted) { setListings([]); setTotal(0); }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [from, vehicleType, location, sortBy, onlineOnly, page]);

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── HERO BOOKING BANNER ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[hsl(215,55%,12%)] to-[hsl(215,55%,8%)] px-4 pt-6 pb-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-white mb-0.5">Where are you going?</h1>
          <p className="text-white/50 text-xs mb-4">Find trusted drivers across Malawi — no account needed</p>

          {/* Trip type toggle */}
          <div className="flex gap-1.5 mb-3">
            {(["now","later"] as const).map(t => (
              <button key={t} onClick={() => setTripType(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  tripType === t
                    ? "bg-orange-600 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}>
                {t === "now" ? <Zap size={11}/> : <Calendar size={11}/>}
                {t === "now" ? "Ride Now" : "Schedule"}
              </button>
            ))}
          </div>

          {/* From/To */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-3">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-400 shrink-0"/>
              <input value={from} onChange={e => setFrom(e.target.value)}
                placeholder="Pickup location or search…"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"/>
              {from && <button onClick={() => setFrom("")}><X size={13} className="text-white/40"/></button>}
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0"/>
              <input value={to} onChange={e => setTo(e.target.value)}
                placeholder="Where to?"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"/>
              {to && <button onClick={() => setTo("")}><X size={13} className="text-white/40"/></button>}
            </div>
          </div>

          {/* Location + Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"/>
              <select value={location} onChange={e => setLocation(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-xs outline-none appearance-none">
                {CITIES.map(c => <option key={c} className="text-foreground bg-background">{c}</option>)}
              </select>
            </div>
            <button
              onClick={() => { setPage(1); setActiveTab("listings"); }}
              className="bg-orange-600 hover:bg-orange-500 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
            >
              <Search size={14}/> Search
            </button>
          </div>

          {/* Quick fare estimate link */}
          <button
            onClick={() => setActiveTab("estimator")}
            className="mt-3 flex items-center gap-1.5 text-orange-300 text-xs font-semibold hover:text-orange-200 transition-all"
          >
            <Zap size={11}/> Quick fare estimate →
          </button>
        </div>
      </div>

      {/* ── VEHICLE TYPE PILLS ─────────────────────────────────────────── */}
      <div className="bg-[hsl(215,55%,10%)] px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 max-w-2xl mx-auto">
          {TRANSPORT_TYPES.map(t => (
            <button key={t.value} onClick={() => { setVehicleType(t.value); setActiveTab("listings"); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                vehicleType === t.value
                  ? "bg-orange-600 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}>
              <t.icon size={11}/>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT TABS ───────────────────────────────────────────────── */}
      <div className="border-b border-border bg-background sticky top-14 z-30">
        <div className="flex max-w-7xl mx-auto px-4">
          {([
            { key:"listings",  label:"Listings",        count: total },
            { key:"live",      label:"🟢 Live Now",     count: null },
            { key:"estimator", label:"💰 Fare Estimate", count: null },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-7xl mx-auto">

        {/* ── TAB: LIVE AVAILABILITY ──────────────────────────────────── */}
        {activeTab === "live" && (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-200">
            <LiveAvailabilityFeed />
          </div>
        )}

        {/* ── TAB: FARE ESTIMATOR ─────────────────────────────────────── */}
        {activeTab === "estimator" && (
          <div className="max-w-lg mx-auto animate-in fade-in duration-200">
            <FareEstimator />
          </div>
        )}

        {/* ── TAB: LISTINGS ───────────────────────────────────────────── */}
        {activeTab === "listings" && (
          <>
            {/* Popular routes (when no search active) */}
            {!from && !to && !loading && (
              <div className="mb-5">
                <h2 className="text-sm font-black text-foreground mb-2.5 flex items-center gap-1.5">
                  <Zap size={14} className="text-orange-500"/> Popular Routes
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_ROUTES.map(r => (
                    <button key={r.from+r.to}
                      onClick={() => { setFrom(r.from); setTo(r.to); }}
                      className="flex items-center justify-between bg-card border border-card-border rounded-xl px-3 py-2.5 text-left hover:border-orange-500/40 transition-all active:scale-95">
                      <div>
                        <div className="text-xs font-bold text-foreground">{r.from} → {r.to}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">From {r.est}</div>
                      </div>
                      <MapPin size={13} className="text-orange-500 shrink-0"/>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filters row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-all ${
                    showFilters || onlineOnly
                      ? "bg-orange-600 text-white border-orange-600"
                      : "text-muted-foreground hover:text-foreground border-border"
                  }`}
                >
                  <SlidersHorizontal size={12}/> Filters
                  {onlineOnly && <span className="text-[9px] ml-0.5">●</span>}
                </button>
                <span className="text-xs text-muted-foreground">{total} drivers</span>
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-input bg-background outline-none">
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low</option>
                <option value="price_desc">Price: High</option>
              </select>
            </div>

            {showFilters && (
              <div className="bg-card border border-card-border rounded-xl p-3 mb-4 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-150">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer col-span-2">
                  <input
                    type="checkbox"
                    checked={onlineOnly}
                    onChange={e => setOnlineOnly(e.target.checked)}
                    className="rounded accent-orange-500"
                  />
                  <Zap size={11} className="text-green-500"/> Available right now only
                </label>
              </div>
            )}

            {/* Driver grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-card border border-card-border rounded-xl p-4 animate-pulse">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full bg-muted shrink-0"/>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-3/4"/>
                        <div className="h-2.5 bg-muted rounded w-1/2"/>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded mb-2"/>
                    <div className="h-8 bg-muted rounded"/>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16">
                <Car size={48} className="text-muted-foreground mx-auto mb-3 opacity-20"/>
                <h3 className="text-base font-bold mb-1">No drivers found</h3>
                <p className="text-muted-foreground text-sm mb-4">Try a different location or vehicle type</p>
                <Link href="/post-transport"
                  className="inline-flex items-center gap-1.5 bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-500 transition-all">
                  <Plus size={14}/> List Your Vehicle
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {listings.map(l => (
                    <ServiceCard key={l.id} service={normalizeToServiceCard(l)} />
                  ))}
                </div>
                {total > 12 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                      className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-all disabled:opacity-40">
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-muted-foreground">
                      Page {page} of {Math.ceil(total/12)}
                    </span>
                    <button onClick={() => setPage(p => p+1)} disabled={page>=Math.ceil(total/12)}
                      className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-all disabled:opacity-40">
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
