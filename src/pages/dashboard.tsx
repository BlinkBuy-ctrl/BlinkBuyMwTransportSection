import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Plus, Eye, Star, Trash2, ToggleLeft, ToggleRight,
  MapPin, Banknote, Shield, Clock, MessageCircle, RefreshCw, X
} from "lucide-react";
import { supabase, authedClient } from "@/lib/supabase";
import { getOrCreateIdentity, getDisplayName } from "@/lib/identity";
import NearMe from "@/components/NearMe";

interface Listing {
  id: string; title: string; vehicle_type: string; location: string;
  from_city: string; to_city: string; price: number | null;
  price_display: string | null; is_online: boolean; is_premium?: boolean;
  status: string; rating: number; review_count: number;
  view_count: number; tags: string[]; created_at: string;
}

const VEHICLE_EMOJI: Record<string, string> = {
  "Taxi":"🚕","Motorcycle":"🏍️","Minibus":"🚌","Shuttle":"🚐",
  "Hire Car":"🚗","Airport Transfer":"✈️","Cargo / Delivery":"🚛",
  "School Transport":"🏫","Corporate Transport":"🏢","Other":"🚘",
};

function formatMK(n: number | null | undefined) {
  return n ? `MK ${n.toLocaleString()}` : "Negotiable";
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function DashboardPage() {
  const [listings, setListings]           = useState<Listing[]>([]);
  const [loading, setLoading]             = useState(true);
  const [identityToken, setIdentityToken] = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [togglingId, setTogglingId]       = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<"listings"|"nearme">("listings");
  const [showUpgrade, setShowUpgrade]     = useState(false);

  const loadListings = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await authedClient(token)
        .from("listings").select("*")
        .eq("operator_token", token).neq("status","deleted")
        .order("created_at", { ascending: false });
      if (!error) setListings((data ?? []) as Listing[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    getOrCreateIdentity().then(id => {
      setIdentityToken(id.token);
      loadListings(id.token);
    });
  }, []);

  const toggleOnline = async (listing: Listing) => {
    if (togglingId || !identityToken) return;
    setTogglingId(listing.id);
    try {
      const newVal = !listing.is_online;
      await authedClient(identityToken).from("listings")
        .update({ is_online: newVal })
        .eq("id", listing.id).eq("operator_token", identityToken);
      setListings(prev => prev.map(l => l.id === listing.id ? {...l, is_online: newVal} : l));
    } catch { /* ignore */ }
    finally { setTogglingId(null); }
  };

  const deleteListing = async (id: string) => {
    if (!identityToken) return;
    setDeletingId(id);
    try {
      await authedClient(identityToken).from("listings")
        .update({ status: "deleted" })
        .eq("id", id).eq("operator_token", identityToken);
      setListings(prev => prev.filter(l => l.id !== id));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  };

  const totalViews  = listings.reduce((s, l) => s + (l.view_count || 0), 0);
  const onlineCount = listings.filter(l => l.is_online).length;

  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-5 pb-24">

      {/* Upgrade → Coming Soon modal */}
      {showUpgrade && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" onClick={() => setShowUpgrade(false)}/>
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[80] max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-card rounded-2xl shadow-2xl p-7 text-center relative">
              <button onClick={() => setShowUpgrade(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted transition-all">
                <X size={14} className="text-muted-foreground"/>
              </button>
              <div className="text-5xl mb-3">🚀</div>
              <h2 className="text-xl font-black mb-2">Coming Soon</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Premium upgrades are on the way! Priority listings, verified badges, and more. Check back soon.
              </p>
              <button onClick={() => setShowUpgrade(false)}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-black transition-all active:scale-95">
                Got it! 👍
              </button>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black">My Dashboard</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Shield size={11} className="text-green-500"/>
            Welcome, <span className="font-semibold text-foreground ml-0.5">{getDisplayName()}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => identityToken && loadListings(identityToken)}
            className="p-2 rounded-xl border border-border hover:bg-muted transition-all active:scale-90">
            <RefreshCw size={14} className={`text-muted-foreground ${loading ? "animate-spin" : ""}`}/>
          </button>
          <Link href="/post-transport"
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95">
            <Plus size={13}/> New Listing
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label:"Listings",    value:String(listings.length), icon:"📋", color:"text-blue-600" },
          { label:"Online Now",  value:String(onlineCount),     icon:"🟢", color:"text-green-600" },
          { label:"Total Views", value:String(totalViews),      icon:"👁",  color:"text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-3 text-center">
            <div className="text-xl mb-0.5">{s.icon}</div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs: My Listing | Near Me (renamed from FareEstimator) */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-5">
        {([
          { key:"listings", label:"My Listing" },
          { key:"nearme",   label:"📍 Near Me" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === t.key
                ? "bg-white dark:bg-card shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "nearme" && (
        <div className="animate-in fade-in duration-200"><NearMe /></div>
      )}

      {activeTab === "listings" && (
        <>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_,i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse"/>)}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-card border border-dashed border-card-border rounded-2xl p-10 text-center">
              <div className="text-5xl mb-3">🚗</div>
              <h2 className="text-base font-black mb-1">No listings yet</h2>
              <p className="text-sm text-muted-foreground mb-5">Post your first transport listing and start getting passengers</p>
              <Link href="/post-transport"
                className="inline-flex items-center gap-1.5 bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-teal-500 transition-all active:scale-95">
                <Plus size={14}/> Post Your First Listing
              </Link>
              <div className="mt-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={13} className="text-amber-600"/>
                  <span className="text-xs font-black text-amber-700 dark:text-amber-400">How it works</span>
                </div>
                <p className="text-xs text-muted-foreground">No signup required. Your listing is automatically linked to this device.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map(l => (
                <div key={l.id} className="bg-card border border-card-border rounded-2xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/30 flex items-center justify-center text-2xl shrink-0">
                        {VEHICLE_EMOJI[l.vehicle_type] ?? "🚗"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/transport/${l.id}`}
                            className="text-sm font-black hover:text-teal-600 transition-colors leading-tight">
                            {l.title}
                          </Link>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            l.is_online
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {l.is_online ? "🟢 Online" : "⚪ Offline"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><MapPin size={9}/> {l.location}</span>
                          {l.from_city && l.to_city && (
                            <span className="text-teal-500 font-semibold">{l.from_city} → {l.to_city}</span>
                          )}
                          <span className="flex items-center gap-0.5"><Eye size={9}/> {l.view_count || 0} views</span>
                          {l.rating > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-500">
                              <Star size={9} className="fill-amber-400"/> {l.rating.toFixed(1)}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5"><Clock size={9}/> {timeAgo(l.created_at)}</span>
                        </div>
                        <div className="mt-1.5 text-xs font-black text-teal-600 dark:text-teal-400">
                          {l.price_display || formatMK(l.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border/60 flex items-center divide-x divide-border/60">
                    <button onClick={() => toggleOnline(l)} disabled={togglingId === l.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50">
                      {l.is_online
                        ? <><ToggleRight size={14} className="text-green-500"/> Go Offline</>
                        : <><ToggleLeft size={14}/> Go Online</>}
                    </button>
                    <Link href={`/transport/${l.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                      <Eye size={13}/> View
                    </Link>
                    <button onClick={() => setShowUpgrade(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all">
                      ⭐ {l.is_premium ? "Premium" : "Upgrade"}
                    </button>
                    <button
                      onClick={() => window.confirm("Delete this listing? This cannot be undone.") && deleteListing(l.id)}
                      disabled={deletingId === l.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all disabled:opacity-50">
                      <Trash2 size={13}/> {deletingId === l.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
              <Link href="/post-transport"
                className="flex items-center justify-center gap-1.5 py-3 border-2 border-dashed border-border rounded-2xl text-sm text-muted-foreground hover:border-teal-400 hover:text-teal-600 transition-all">
                <Plus size={14}/> Add Another Listing
              </Link>
            </div>
          )}
        </>
      )}

      <div className="mt-6 bg-gradient-to-br from-[hsl(215,55%,12%)] to-[hsl(215,55%,9%)] rounded-2xl p-4 border border-white/10">
        <h3 className="text-xs font-black text-white mb-2.5 flex items-center gap-1.5">
          <Banknote size={13} className="text-green-400"/> Payment Numbers
        </h3>
        <div className="space-y-1.5 text-xs text-white/70">
          <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400 shrink-0"/>Airtel Money: <strong className="text-white">0999 626 944</strong></p>
          <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0"/>TNM Mpamba: <strong className="text-white">0888 712 272</strong></p>
          <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 shrink-0"/>Cash accepted on arrival</p>
        </div>
        <a href="https://wa.me/265999626944" target="_blank" rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 font-bold transition-all">
          <MessageCircle size={12}/> WhatsApp Support → 0999 626 944
        </a>
      </div>
    </div>
  );
}
