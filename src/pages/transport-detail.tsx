import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import {
  MapPin, Star, MessageCircle, Phone,
  ArrowLeft, Shield, Car, Calendar, Banknote,
  Zap, Users, Trash2, Edit3, AlertTriangle, Share2
} from "lucide-react";
import { supabase, authedClient } from "@/lib/supabase";
import { getOrCreateIdentity, isListingOwner } from "@/lib/identity";
import BookingTracker, { type BookingInfo, type BookingStatus } from "@/components/BookingTracker";
import SOSOverlay from "@/components/SOSOverlay";
import TrustBadges from "@/components/TrustBadges";
import ReportListing from "@/components/ReportListing";
import ShareListing from "@/components/ShareListing";

const PAYMENT_OPTS = [
  { id:"airtel",  label:"Airtel Money", color:"bg-red-600",    icon:"📱", num:"0999626944" },
  { id:"mpamba",  label:"TNM Mpamba",   color:"bg-yellow-500", icon:"📱", num:"0888712272" },
  { id:"cash",    label:"Cash",         color:"bg-green-600",  icon:"💵", num:"" },
];

function formatMK(n: number|null|undefined) {
  if (!n) return "Negotiable";
  return `MK ${n.toLocaleString()}`;
}

const VEHICLE_EMOJI: Record<string,string> = {
  "Taxi":"🚕","Motorcycle":"🏍️","Minibus":"🚌","Shuttle":"🚐","Hire Car":"🚗",
  "Airport Transfer":"✈️","Cargo / Delivery":"🚛","School Transport":"🏫","Other":"🚘"
};

export default function TransportDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [listing, setListing]           = useState<any>(null);
  const [reviews, setReviews]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [isOwner, setIsOwner]           = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [showBooking, setShowBooking]   = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [activeBooking, setActiveBooking] = useState<BookingInfo|null>(null);

  const [booking, setBooking] = useState({
    from:"", to:"", date:"", time:"",
    tripType:"one-way" as "one-way"|"round-trip",
    passengers:"1", payment:"airtel", notes:"", name:"", phone:""
  });

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const [{ data: lData, error: lErr }, { data: rData }] = await Promise.all([
          supabase.from("listings").select("*").eq("id", id).maybeSingle(),
          supabase.from("reviews").select("*").eq("listing_id", id).order("created_at", { ascending:false }),
        ]);
        if (!mounted) return;
        if (lErr) console.error("[TransportMW] listing fetch error:", lErr.message);
        setListing(lData ?? null);
        setReviews(rData ?? []);
        setIsOwner(isListingOwner(lData?.operator_token));
        if (lData) supabase.rpc("increment_listing_views", { p_listing_id: id }).catch(()=>{});
      } catch (e) {
        console.error("[TransportMW] detail page error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    const identity = await getOrCreateIdentity();
    await authedClient(identity.token).from("listings").update({ status:"deleted" })
      .eq("id", listing.id).eq("operator_token", identity.token);
    window.location.href = "/dashboard";
  };

  const handleBooking = async () => {
    if (!booking.from || !booking.to) { setBookingError("Please enter pickup and destination"); return; }
    setBookingError("");
    setBookingLoading(true);
    try {
      const identity = await getOrCreateIdentity();
      const { data, error } = await authedClient(identity.token).from("bookings").insert({
        listing_id: listing.id, booker_token: identity.token,
        booker_name: booking.name || "Anonymous", booker_phone: booking.phone || null,
        from_location: booking.from, to_location: booking.to,
        trip_date: booking.date || null, trip_time: booking.time || null,
        trip_type: booking.tripType, passengers: Number(booking.passengers),
        payment_method: booking.payment, notes: booking.notes || null,
        status: "requesting",
      }).select().single();
      if (error) throw new Error(error.message);
      setShowBooking(false);
      setActiveBooking({
        id: data.id, listing_id: listing.id,
        from_location: data.from_location, to_location: data.to_location,
        status: data.status as BookingStatus, booker_token: identity.token,
        trip_date: data.trip_date, trip_time: data.trip_time,
        passengers: data.passengers, payment_method: data.payment_method,
        listing: { title: listing.title, vehicle_type: listing.vehicle_type,
          whatsapp: listing.whatsapp, phone: listing.phone,
          price_display: listing.price_display, price: listing.price }
      });
    } catch (e: any) {
      setBookingError(e.message || "Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-20 animate-pulse space-y-4">
      <div className="h-4 w-24 bg-muted rounded"/>
      <div className="h-44 bg-muted rounded-2xl"/>
      <div className="h-32 bg-muted rounded-2xl"/>
      <div className="h-24 bg-muted rounded-2xl"/>
    </div>
  );

  if (!listing) return (
    <div className="text-center py-20">
      <Car size={40} className="mx-auto text-muted-foreground opacity-20 mb-3"/>
      <p className="text-muted-foreground mb-3">Listing not found</p>
      <Link href="/transport" className="text-teal-500 text-sm hover:underline">← Back to search</Link>
    </div>
  );

  const priceDisplay = listing.price_display || formatMK(listing.price);
  const memberSince  = listing.created_at
    ? new Date(listing.created_at).toLocaleDateString("en-MW", { month:"short", year:"numeric" })
    : undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-32">
      {activeBooking && (
        <BookingTracker
          booking={activeBooking}
          onClose={() => setActiveBooking(null)}
          onStatusChange={s => setActiveBooking(prev => prev ? {...prev, status:s} : null)}
        />
      )}

      <Link href="/transport" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft size={15}/> All Drivers
      </Link>

      {/* Owner controls */}
      {isOwner && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
          <Shield size={14} className="text-amber-600 shrink-0"/>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex-1">You own this listing</span>
          <Link href="/dashboard" className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline">
            <Edit3 size={11}/> Manage
          </Link>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} className="flex items-center gap-1 text-xs text-red-600 font-bold hover:underline">
              <Trash2 size={11}/> Delete
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button onClick={() => setDeleteConfirm(false)} className="text-xs text-muted-foreground">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-600 font-black">
                {deleting ? "…" : "Confirm"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Driver card */}
      <div className="bg-card border border-card-border rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/30 flex items-center justify-center text-3xl overflow-hidden">
              {VEHICLE_EMOJI[listing.vehicle_type] ?? "🚗"}
            </div>
            {listing.is_online && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card"/>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-foreground mb-0.5">{listing.title}</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <MapPin size={10}/>{listing.location}
              {listing.from_city && listing.to_city && (
                <span className="text-teal-500 font-semibold ml-1">· {listing.from_city} → {listing.to_city}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {listing.is_online && (
                <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold px-2 py-1 rounded-full">
                  <Zap size={9}/> Online Now
                </span>
              )}
              {listing.covers_other_routes && (
                <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-1 rounded-full">
                  <MapPin size={9}/> Flexible Routes
                </span>
              )}
              {listing.is_premium && (
                <span className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-full">
                  ⭐ Premium
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <div className="text-lg font-black">{listing.rating?.toFixed(1) || "—"}</div>
            <div className="flex justify-center mb-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={9} className={s <= Math.round(listing.rating||0) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}/>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground">{listing.review_count || reviews.length} reviews</div>
          </div>
          <div className="text-center border-x border-border/50">
            <div className="text-lg font-black">{listing.view_count || 0}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Profile Views</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-teal-600 dark:text-teal-400">{priceDisplay}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Starting from</div>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mb-4">
        <TrustBadges
          isVerified={listing.is_verified}
          isPremium={listing.is_premium}
          rating={listing.rating}
          reviewCount={listing.review_count}
          memberSince={memberSince}
        />
      </div>

      {/* About */}
      {listing.description && (
        <div className="bg-card border border-card-border rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-black mb-2">About This Driver</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
          {listing.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {listing.tags.map((t: string) => (
                <span key={t} className="text-[10px] bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-2 py-1 rounded-full font-semibold">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment */}
      <div className="bg-card border border-card-border rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-black mb-2 flex items-center gap-1.5"><Banknote size={14} className="text-green-500"/> Accepted Payments</h2>
        <div className="flex gap-2 flex-wrap">
          {PAYMENT_OPTS.map(p => (
            <span key={p.id} className={`${p.color} text-white text-[10px] font-bold px-2.5 py-1 rounded-full`}>
              {p.icon} {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="bg-card border border-card-border rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-black mb-3">Passenger Reviews ({reviews.length})</h2>
          <div className="space-y-3">
            {reviews.slice(0,5).map((r: any) => (
              <div key={r.id} className="flex gap-2.5 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-xs font-black text-white shrink-0">
                  {(r.reviewer_name||"A").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold">{r.reviewer_name||"Anonymous"}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={9} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}/>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.comment}</p>}
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString("en-MW",{month:"short",day:"numeric",year:"numeric"})}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety */}
      <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4">
        <AlertTriangle size={14} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"/>
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          Always confirm the driver's identity and vehicle plate before boarding. Share your trip with a trusted contact.
        </p>
      </div>

      {/* Share + Report row */}
      <div className="flex items-center justify-between mb-4 px-1">
        <ShareListing
          listingId={listing.id}
          title={listing.title}
          priceDisplay={listing.price_display}
          location={listing.location}
          vehicleType={listing.vehicle_type}
        />
        {!isOwner && <ReportListing listingId={listing.id} listingTitle={listing.title}/>}
      </div>

      {/* BOOKING FORM */}
      {showBooking && (
        <div className="bg-card border border-teal-500/30 rounded-2xl p-4 mb-4 animate-in slide-in-from-bottom-4 duration-200">
          <h2 className="text-sm font-black mb-4 flex items-center gap-1.5">
            <Calendar size={14} className="text-teal-500"/> Book This Driver
          </h2>

          <div className="flex gap-2 mb-3">
            {(["one-way","round-trip"] as const).map(t => (
              <button key={t} onClick={() => setBooking(b => ({...b, tripType:t}))}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  booking.tripType === t
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "border-border text-muted-foreground hover:border-teal-400"
                }`}>{t === "one-way" ? "One Way" : "Round Trip"}</button>
            ))}
          </div>

          <div className="space-y-2.5">
            <div className="bg-background border border-input rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
                <div className="w-2 h-2 rounded-full bg-green-400 shrink-0"/>
                <input value={booking.from} onChange={e => setBooking(b=>({...b,from:e.target.value}))}
                  placeholder="Pickup location"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"/>
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0"/>
                <input value={booking.to} onChange={e => setBooking(b=>({...b,to:e.target.value}))}
                  placeholder="Destination"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1 block">Date</label>
                <input type="date" value={booking.date} onChange={e => setBooking(b=>({...b,date:e.target.value}))}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500"/>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1 block">Time</label>
                <input type="time" value={booking.time} onChange={e => setBooking(b=>({...b,time:e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1 block flex items-center gap-1"><Users size={9}/> Passengers</label>
                <select value={booking.passengers} onChange={e => setBooking(b=>({...b,passengers:e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500">
                  {["1","2","3","4","5","6","7","8+"].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1 block">Your Name</label>
                <input value={booking.name} onChange={e => setBooking(b=>({...b,name:e.target.value}))}
                  placeholder="Optional"
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500"/>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1.5 block flex items-center gap-1"><Banknote size={9}/> Payment</label>
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_OPTS.map(p => (
                  <button key={p.id} onClick={() => setBooking(b=>({...b,payment:p.id}))}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      booking.payment === p.id
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300"
                        : "border-border text-muted-foreground hover:border-teal-300"
                    }`}>
                    <span className="text-base">{p.icon}</span>
                    <span className="text-[10px] leading-tight text-center">{p.label}</span>
                  </button>
                ))}
              </div>
              {booking.payment !== "cash" && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Send payment to: <strong className="text-foreground">{PAYMENT_OPTS.find(p=>p.id===booking.payment)?.num}</strong>
                </p>
              )}
            </div>

            <textarea value={booking.notes} onChange={e => setBooking(b=>({...b,notes:e.target.value}))}
              placeholder="Luggage, special instructions, landmarks..." rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none resize-none focus:border-teal-500"/>
          </div>

          {bookingError && (
            <div className="mt-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
              {bookingError}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowBooking(false)}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-all">
              Cancel
            </button>
            <button onClick={handleBooking} disabled={bookingLoading}
              className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-black transition-all active:scale-95 disabled:opacity-60">
              {bookingLoading ? "Sending…" : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}

      {/* Sticky CTA */}
      <div className="fixed bottom-14 lg:bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 z-40">
        <div className="max-w-2xl mx-auto flex gap-2">
          {listing.phone && (
            <a href={`tel:+265${listing.phone}`}
              className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95 shrink-0">
              <Phone size={16}/>
            </a>
          )}
          {listing.whatsapp && (
            <a href={`https://wa.me/265${listing.whatsapp}?text=Hi, I found you on TransportMW. I'd like to book a ride.`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-all active:scale-95">
              <MessageCircle size={15}/> WhatsApp
            </a>
          )}
          <button onClick={() => setShowBooking(b => !b)}
            className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-black transition-all active:scale-95">
            <Calendar size={15}/> {showBooking ? "Hide" : "Book Now"}
          </button>
        </div>
      </div>

      <SOSOverlay tripId={id}/>
    </div>
  );
}
