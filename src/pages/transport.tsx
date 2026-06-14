import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Search, MapPin, Star, SlidersHorizontal, X,
  Car, Truck, Bus, Plane, Package, Zap,
  Calendar, Plus, Bike, TrendingUp, Users, Shield
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import NearMe from "@/components/NearMe";
import LiveAvailabilityFeed from "@/components/LiveAvailabilityFeed";
import { ServiceCard } from "@/components/ServiceCard";

const TRANSPORT_TYPES = [
  { label: "All",      value: "all",               icon: Car },
  { label: "Taxi",     value: "Taxi",               icon: Car },
  { label: "Moto",     value: "Motorcycle",         icon: Bike },
  { label: "Minibus",  value: "Minibus",            icon: Bus },
  { label: "Shuttle",  value: "Shuttle",            icon: Bus },
  { label: "Airport",  value: "Airport Transfer",   icon: Plane },
  { label: "Cargo",    value: "Cargo / Delivery",   icon: Package },
  { label: "Hire Car", value: "Hire Car",           icon: Truck },
];

const CITIES = [
  "All Locations","Balaka","Blantyre","Chikwawa","Chiradzulu","Chitipa","Dedza","Dowa",
  "Karonga","Kasungu","Likoma","Lilongwe","Machinga","Mangochi","Mchinji","Mulanje",
  "Mwanza","Mzimba","Neno","Nkhata Bay","Nkhotakota","Nsanje","Ntcheu","Ntchisi",
  "Phalombe","Rumphi","Salima","Thyolo","Zomba",
];

const POPULAR_ROUTES = [
  { from: "Lilongwe", to: "Blantyre",  est: "MK 8,000", icon: "✈️" },
  { from: "Blantyre",  to: "Zomba",    est: "MK 3,000", icon: "🛣️" },
  { from: "Lilongwe", to: "Mzuzu",    est: "MK 10,000", icon: "🚐" },
  { from: "Lilongwe", to: "Airport",  est: "MK 5,000",  icon: "🛫" },
];

interface Listing {
  id: string; title: string; description: string;
  vehicle_type: string; location: string;
  price: number | null; price_display: string | null; price_type: string | null;
  is_online: boolean; rating: number; review_count: number;
  tags: string[]; operator_token: string;
  is_premium?: boolean; is_featured?: boolean;
  from_city?: string; to_city?: string;
  whatsapp?: string; phone?: string;
}

function normalizeToServiceCard(l: Listing) {
  return { ...l, priceDisplay: l.price_display, priceType: l.price_type,
    isOnline: l.is_online, reviewCount: l.review_count,
    worker: null, category: "Transport & Delivery" };
}

export default function TransportPage() {
  const [listings, setListings]   = useState<Listing[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [activeTab, setActiveTab] = useState<"listings"|"live"|"nearme">("listings");
  const [from, setFrom]           = useState("");
  const [vehicleType, setVehicleType] = useState("all");
  const [location, setLocation]   = useState("All Locations");
  const [sortBy, setSortBy]       = useState("rating");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tripType, setTripType]   = useState<"now"|"later">("now");
  const [heroVisible, setHeroVisible] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => { setTimeout(() => setHeroVisible(true), 50); }, []);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(1);
  }, [from, vehicleType, location, sortBy, onlineOnly]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        let q = supabase.from("listings").select("*", { count: "exact" }).eq("status", "active");
        if (from)                         q = q.ilike("title", `%${from}%`);
        if (vehicleType !== "all")        q = q.eq("vehicle_type", vehicleType);
        if (location !== "All Locations") q = q.ilike("location", `%${location}%`);
        if (onlineOnly)                   q = q.eq("is_online", true);
        if (sortBy === "rating")          q = q.order("rating", { ascending: false });
        else if (sortBy === "price_asc")  q = q.order("price",  { ascending: true });
        else if (sortBy === "price_desc") q = q.order("price",  { ascending: false });
        else                              q = q.order("created_at", { ascending: false });
        const pageSize = 12;
        q = q.range((page - 1) * pageSize, page * pageSize - 1);
        const { data, count } = await q;
        if (mounted) { setListings((data ?? []) as Listing[]); setTotal(count ?? 0); }
      } catch { if (mounted) { setListings([]); setTotal(0); } }
      finally  { if (mounted) setLoading(false); }
    };
    run();
    return () => { mounted = false; };
  }, [from, vehicleType, location, sortBy, onlineOnly, page]);

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div className="relative bg-[hsl(190,60%,10%)] px-4 pt-8 pb-6 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-teal-500/5 pointer-events-none"/>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-teal-400/5 pointer-events-none"/>

        <div
          className="max-w-2xl mx-auto relative z-10"
          style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(12px)", transition: "all 400ms ease" }}
        >
          {/* Trust badge */}
          <div className="flex items-center gap-1.5 mb-4">
            <div className="flex items-center gap-1 bg-teal-500/15 border border-teal-400/20 rounded-full px-3 py-1">
              <Shield size={11} className="text-teal-400"/>
              <span className="text-[11px] text-teal-300 font-semibold">Malawi's #1 Trusted Transport Hub</span>
            </div>
          </div>

          <h1 className="text-2xl font-black text-white mb-1 leading-tight">
            Where are you<br/>
            <span className="text-teal-400">going today?</span>
          </h1>
          <p className="text-white/40 text-xs mb-5">Find verified drivers — no account, no hassle</p>

          {/* Trip type toggle */}
          <div className="flex gap-2 mb-4">
            {(["now","later"] as const).map(t => (
              <button key={t} onClick={() => setTripType(t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                  tripType === t
                    ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30"
                    : "bg-white/8 text-white/50 hover:bg-white/15 border border-white/10"
                }`}>
                {t === "now" ? <Zap size={12}/> : <Calendar size={12}/>}
                {t === "now" ? "Ride Now" : "Schedule Ride"}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="bg-white/8 border border-white/10 rounded-2xl overflow-hidden mb-3 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0 shadow-sm shadow-green-400/50"/>
              <input value={from} onChange={e => setFrom(e.target.value)}
                placeholder="Pickup location or search drivers…"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25 font-medium"/>
              {from && <button onClick={() => setFrom("")}><X size={13} className="text-white/30 hover:text-white/60 transition-colors"/></button>}
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0 shadow-sm shadow-teal-400/50"/>
              <span className="text-white/20 text-sm flex-1 font-medium">Where to?</span>
            </div>
          </div>

          {/* Location + Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none"/>
              <select value={location} onChange={e => setLocation(e.target.value)}
                className="w-full pl-8 pr-3 py-3 rounded-xl bg-white/8 border border-white/10 text-white text-xs outline-none appearance-none font-medium">
                {CITIES.map(c => <option key={c} className="text-foreground bg-background">{c}</option>)}
              </select>
            </div>
            <button
              onClick={() => { setPage(1); setActiveTab("listings"); }}
              className="bg-teal-500 hover:bg-teal-400 active:scale-95 text-white px-6 py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-teal-500/30 flex items-center gap-1.5">
              <Search size={15}/> Search
            </button>
          </div>

          {/* Quick stats strip */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/8">
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-teal-400"/>
              <span className="text-[11px] text-white/50">{total > 0 ? `${total} drivers` : "Many drivers"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star size={12} className="text-amber-400 fill-amber-400"/>
              <span className="text-[11px] text-white/50">Verified & rated</span>
            </div>
            <button onClick={() => setActiveTab("estimator")}
              className="flex items-center gap-1 text-teal-400 text-[11px] font-bold hover:text-teal-300 transition-colors ml-auto">
              <Zap size={11}/> Fare estimate →
            </button>
          </div>
        </div>
      </div>

      {/* ── VEHICLE TYPE PILLS ──────────────────────────────────────────── */}
      <div className="bg-[hsl(190,55%,9%)] px-4 py-3 border-b border-white/5">
        <div className="flex gap-2 overflow-x-auto scrollbar-none max-w-2xl mx-auto">
          {TRANSPORT_TYPES.map((t, i) => (
            <button key={t.value}
              onClick={() => { setVehicleType(t.value); setActiveTab("listings"); }}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                vehicleType === t.value
                  ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                  : "bg-white/8 text-white/55 hover:bg-white/15 border border-white/8"
              }`}>
              <t.icon size={12}/>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT TABS ────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-background sticky top-14 z-30">
        <div className="flex max-w-7xl mx-auto px-4">
          {([
            { key:"listings",  label:"Listings",       count: total },
            { key:"live",      label:"🟢 Live Now",    count: null  },
            { key:"nearme",    label:"📍 Near Me",     count: null  },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-teal-500 text-teal-600 dark:text-teal-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {tab.label}
              {tab.count !== null && (
                <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 max-w-7xl mx-auto">

        {activeTab === "live" && (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-200"><LiveAvailabilityFeed /></div>
        )}
        {activeTab === "nearme" && (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-200"><NearMe /></div>
        )}

        {activeTab === "listings" && (
          <>
            {/* Popular routes */}
            {!from && !loading && (
              <div className="mb-6">
                <h2 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-teal-500"/> Popular Routes
                </h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {POPULAR_ROUTES.map(r => (
                    <button key={r.from+r.to}
                      onClick={() => { setFrom(r.from); setActiveTab("listings"); }}
                      className="flex items-center gap-3 bg-card border border-card-border rounded-2xl px-3.5 py-3 text-left hover:border-teal-500/50 hover:bg-teal-50/5 transition-all active:scale-97 group">
                      <span className="text-2xl">{r.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{r.from} → {r.to}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">From {r.est}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filter bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 text-xs border rounded-xl px-3 py-2 transition-all font-semibold ${
                    showFilters || onlineOnly
                      ? "bg-teal-600 text-white border-teal-600"
                      : "text-muted-foreground hover:text-foreground border-border hover:border-teal-400/50"
                  }`}>
                  <SlidersHorizontal size={12}/> Filters
                  {onlineOnly && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5"/>}
                </button>
                <span className="text-xs text-muted-foreground">{total} drivers found</span>
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="text-xs px-2.5 py-2 rounded-xl border border-input bg-background outline-none font-semibold">
                <option value="rating">⭐ Top Rated</option>
                <option value="newest">🆕 Newest</option>
                <option value="price_asc">💰 Cheapest</option>
                <option value="price_desc">💎 Premium</option>
              </select>
            </div>

            {showFilters && (
              <div className="bg-card border border-teal-500/20 rounded-2xl p-4 mb-4 animate-in slide-in-from-top-2 duration-150">
                <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer font-medium">
                  <div onClick={() => setOnlineOnly(!onlineOnly)}
                    className={`w-10 h-5.5 rounded-full transition-all duration-200 flex items-center px-0.5 cursor-pointer ${onlineOnly ? "bg-teal-500" : "bg-muted"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${onlineOnly ? "translate-x-4.5" : "translate-x-0"}`}/>
                  </div>
                  <Zap size={13} className="text-green-500"/> Available right now only
                </label>
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card border border-card-border rounded-2xl p-4 animate-pulse">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-14 h-14 rounded-2xl bg-muted shrink-0"/>
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3.5 bg-muted rounded-lg w-4/5"/>
                        <div className="h-2.5 bg-muted rounded-lg w-1/2"/>
                        <div className="h-2.5 bg-muted rounded-lg w-2/3"/>
                      </div>
                    </div>
                    <div className="h-2.5 bg-muted rounded-lg mb-2"/>
                    <div className="h-9 bg-muted rounded-xl"/>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-3xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-4xl mx-auto mb-4">🚗</div>
                <h3 className="text-base font-black mb-2">No drivers found</h3>
                <p className="text-muted-foreground text-sm mb-5">Try a different location or vehicle type</p>
                <Link href="/post-transport"
                  className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-teal-500 transition-all shadow-lg shadow-teal-500/25">
                  <Plus size={15}/> Be the first to list
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings.map((l, i) => (
                    <div key={l.id}
                      style={{ animationDelay: `${i * 60}ms`, animation: "fadeUp 300ms ease both" }}>
                      <ServiceCard service={normalizeToServiceCard(l)} />
                    </div>
                  ))}
                </div>
                {total > 12 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                      className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-all disabled:opacity-30">
                      ← Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-muted-foreground font-medium">
                      {page} / {Math.ceil(total/12)}
                    </span>
                    <button onClick={() => setPage(p => p+1)} disabled={page>=Math.ceil(total/12)}
                      className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-all disabled:opacity-30">
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
