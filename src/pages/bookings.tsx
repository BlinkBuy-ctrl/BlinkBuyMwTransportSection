import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Clock, MapPin, Calendar, Car, CheckCircle, X, Zap, ArrowRight, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getOrCreateIdentity } from "@/lib/identity";
import BookingTracker, { type BookingInfo, type BookingStatus } from "@/components/BookingTracker";

const STATUS_CONFIG: Record<string, { label:string; color:string; icon: any }> = {
  requesting: { label:"Pending",   color:"text-amber-600 bg-amber-100 dark:bg-amber-900/30",   icon:Clock },
  accepted:   { label:"Accepted",  color:"text-blue-600 bg-blue-100 dark:bg-blue-900/30",      icon:CheckCircle },
  en_route:   { label:"En Route",  color:"text-purple-600 bg-purple-100 dark:bg-purple-900/30",icon:Zap },
  arrived:    { label:"Arrived",   color:"text-green-600 bg-green-100 dark:bg-green-900/30",   icon:MapPin },
  completed:  { label:"Completed", color:"text-green-700 bg-green-100 dark:bg-green-900/30",   icon:CheckCircle },
  cancelled:  { label:"Cancelled", color:"text-red-600 bg-red-100 dark:bg-red-900/30",         icon:X },
};

export default function BookingsPage() {
  const [bookings, setBookings]           = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [activeBooking, setActiveBooking] = useState<BookingInfo|null>(null);

  // NO cache — always fetch fresh so new bookings appear immediately
  const fetchBookings = async () => {
    try {
      const identity = await getOrCreateIdentity();
      const { data } = await supabase
        .from("bookings")
        .select("*, listing:listing_id(title, vehicle_type, whatsapp, phone, price_display, price)")
        .eq("booker_token", identity.token)
        .order("created_at", { ascending: false });
      setBookings(data ?? []);
    } catch { /* network error — keep existing list */ }
  };

  useEffect(() => {
    (async () => {
      await fetchBookings();
      setLoading(false);
    })();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-5 pb-24">
      {activeBooking && (
        <BookingTracker
          booking={activeBooking}
          onClose={() => setActiveBooking(null)}
          onStatusChange={s => setActiveBooking(p => p ? {...p, status:s} : null)}
        />
      )}

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black">My Bookings</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-teal-600 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""}/>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_,i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse"/>)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <Car size={40} className="text-muted-foreground mx-auto mb-3 opacity-20"/>
          <h2 className="text-base font-bold mb-1">No bookings yet</h2>
          <p className="text-sm text-muted-foreground mb-4">Your booking history will appear here</p>
          <Link href="/transport"
            className="inline-flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-teal-500 transition-all">
            Find a Ride <ArrowRight size={13}/>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.requesting;
            const Icon = cfg.icon;
            return (
              <div key={b.id}
                className="bg-card border border-card-border rounded-2xl p-4 cursor-pointer hover:border-teal-400/50 transition-all active:scale-[0.99]"
                onClick={() => setActiveBooking({
                  id: b.id, listing_id: b.listing_id,
                  from_location: b.from_location, to_location: b.to_location,
                  status: b.status as BookingStatus, booker_token: b.booker_token,
                  trip_date: b.trip_date, trip_time: b.trip_time,
                  passengers: b.passengers, payment_method: b.payment_method,
                  listing: b.listing
                })}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-sm font-black">{b.listing?.title ?? "Unknown Driver"}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">#{b.id.slice(0,8).toUpperCase()}</div>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${cfg.color}`}>
                    <Icon size={9}/> {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"/>
                  {b.from_location}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0"/>
                  {b.to_location}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {b.trip_date && (
                    <span className="flex items-center gap-1"><Calendar size={9}/>{b.trip_date}{b.trip_time ? ` ${b.trip_time}` : ""}</span>
                  )}
                  {b.passengers && <span>{b.passengers} pax</span>}
                  {b.payment_method && <span className="flex items-center gap-1"><MapPin size={9}/>{b.payment_method}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
