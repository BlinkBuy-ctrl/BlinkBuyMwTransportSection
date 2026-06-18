import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import {
  MapPin, Star, Phone, MessageCircle, Shield, ChevronLeft,
  Zap, Flag, Share2, ChevronRight, Calendar, Users,
  CheckCircle2, ImageOff, Loader2, Tag, Eye, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchListingImages } from "@/hooks/useListingImages";
import type { ListingImage } from "@/hooks/useListingImages";
import { getOrCreateIdentity, getDisplayName } from "@/lib/identity";

const EMOJI: Record<string,string> = {
  "Taxi":"🚕","Motorcycle":"🏍️","Minibus":"🚌","Shuttle":"🚐","Hire Car":"🚗",
  "Airport Transfer":"✈️","Cargo / Delivery":"🚛","School Transport":"🏫",
  "Corporate Transport":"🏢","Other":"🚘",
};

interface Listing {
  id:string; title:string; description?:string; vehicle_type:string;
  location:string; from_city?:string; to_city?:string; covers_other_routes?:boolean;
  price?:number|null; price_display?:string|null; price_type?:string|null;
  is_online?:boolean; is_premium?:boolean; is_featured?:boolean; is_verified?:boolean;
  rating?:number; review_count?:number; view_count?:number;
  tags?:string[]; whatsapp?:string; phone?:string; thumbnail_url?:string|null;
}
interface Review {
  id:string; rating:number; comment?:string; reviewer_name?:string; created_at:string;
}

function Gallery({ images, vehicleType }: { images:ListingImage[]; vehicleType:string }) {
  const [cur, setCur]   = useState(0);
  const [lightbox, setLb] = useState(false);

  if (!images.length) return (
    <div className="w-full h-52 bg-gradient-to-br from-card to-muted rounded-2xl flex flex-col items-center justify-center gap-2 border border-card-border">
      <span className="text-5xl">{EMOJI[vehicleType] ?? "🚗"}</span>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ImageOff size={11}/> No photos yet
      </div>
    </div>
  );

  return (
    <>
      <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ aspectRatio:"16/9" }}>
        <img src={images[cur].url} alt={`photo ${cur+1}`}
          className="w-full h-full object-cover cursor-zoom-in" onClick={() => setLb(true)}/>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"/>
        {images.length > 1 && <>
          <button onClick={() => setCur(i => (i-1+images.length)%images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-all active:scale-95">
            <ChevronLeft size={16}/>
          </button>
          <button onClick={() => setCur(i => (i+1)%images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-all active:scale-95">
            <ChevronRight size={16}/>
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_,i) => (
              <button key={i} onClick={() => setCur(i)}
                className={`rounded-full transition-all ${i===cur?"w-4 h-2 bg-white":"w-2 h-2 bg-white/50"}`}/>
            ))}
          </div>
        </>}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full">
          {cur+1}/{images.length}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2">
          {images.map((img,i) => (
            <button key={img.id} onClick={() => setCur(i)}
              className={`w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${i===cur?"border-teal-500":"border-transparent opacity-60 hover:opacity-100"}`}>
              <img src={img.url} alt="" className="w-full h-full object-cover"/>
            </button>
          ))}
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLb(false)}>
          <img src={images[cur].url} alt="" className="max-w-full max-h-full object-contain p-4"/>
          <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
            <X size={16}/>
          </button>
        </div>
      )}
    </>
  );
}

function Stars({ rating, size=13 }: { rating:number; size?:number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i<=Math.round(rating)?"fill-amber-400 text-amber-400":"fill-muted text-muted"}/>
      ))}
    </div>
  );
}

export default function TransportDetailPage() {
  const [, params]  = useRoute("/transport/:id");
  const [, setLoc]  = useLocation();
  const id          = params?.id;

  const [listing, setListing]   = useState<Listing|null>(null);
  const [images, setImages]     = useState<ListingImage[]>([]);
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showBook, setShowBook] = useState(false);
  const [bFrom, setBFrom]       = useState("");
  const [bTo, setBTo]           = useState("");
  const [bDate, setBDate]       = useState("");
  const [bName, setBName]       = useState("");
  const [bPhone, setBPhone]     = useState("");
  const [bPax, setBPax]         = useState("1");
  const [bLoading, setBLoading] = useState(false);
  const [bDone, setBDone]       = useState(false);
  const [bError, setBError]     = useState("");

  const [showReview, setShowReview] = useState(false);
  const [rRating, setRRating]       = useState(5);
  const [rComment, setRComment]     = useState("");
  const [rName, setRName]           = useState("");
  const [rLoading, setRLoading]     = useState(false);
  const [rDone, setRDone]           = useState(false);
  const [rError, setRError]         = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [lRes, imgs, rRes] = await Promise.all([
      supabase.from("listings").select("*").eq("id",id).eq("status","active").maybeSingle(),
      fetchListingImages(id),
      supabase.from("reviews").select("*").eq("listing_id",id).order("created_at",{ascending:false}).limit(20),
    ]);
    if (!lRes.data) { setNotFound(true); setLoading(false); return; }
    setListing(lRes.data as Listing);
    setImages(imgs);
    setReviews((rRes.data??[]) as Review[]);
    supabase.rpc("increment_listing_views",{p_listing_id:id}).then(()=>{});
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Pre-fill name from saved profile
  useEffect(() => {
    const name = getDisplayName();
    if (name && !bName) setBName(name);
  }, []);

  // ── BOOKING FIX: use getOrCreateIdentity() so token always matches bookings page ──
  const submitBooking = async () => {
    if (!listing) return;
    if (!bFrom.trim()||!bTo.trim()||!bName.trim()||!bPhone.trim()) {
      setBError("Please fill in all required fields."); return;
    }
    setBLoading(true); setBError("");
    try {
      const identity = await getOrCreateIdentity();        // ← correct token
      const { error } = await supabase.from("bookings").insert({
        listing_id:     listing.id,
        booker_token:   identity.token,                    // ← was localStorage.getItem("operator_token") — WRONG KEY
        booker_name:    bName.trim(),
        booker_phone:   bPhone.trim(),
        from_location:  bFrom.trim(),
        to_location:    bTo.trim(),
        trip_date:      bDate || null,
        passengers:     Number(bPax),
        payment_method: "cash",
        status:         "requesting",
      });
      if (error) throw new Error(error.message);
      setBDone(true);
    } catch (e:any) { setBError(e.message??"Booking failed."); }
    finally { setBLoading(false); }
  };

  const submitReview = async () => {
    if (!listing) return;
    setRLoading(true); setRError("");
    try {
      const identity = await getOrCreateIdentity();        // ← correct token
      const { error } = await supabase.from("reviews").insert({
        listing_id:     listing.id,
        reviewer_token: identity.token,                    // ← was localStorage.getItem("operator_token") — WRONG KEY
        reviewer_name:  rName.trim()||"Anonymous",
        rating:         rRating,
        comment:        rComment.trim()||null,
      });
      if (error) {
        if (error.code==="23505") throw new Error("You've already reviewed this listing.");
        throw new Error(error.message);
      }
      setRDone(true); load();
    } catch (e:any) { setRError(e.message??"Could not submit review."); }
    finally { setRLoading(false); }
  };

  const share = () => {
    if (navigator.share && listing)
      navigator.share({title:listing.title, url:window.location.href}).catch(()=>{});
    else
      navigator.clipboard?.writeText(window.location.href);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-teal-500"/>
    </div>
  );

  if (notFound||!listing) return (
    <div className="max-w-md mx-auto px-4 pt-20 text-center">
      <div className="text-5xl mb-4">🚫</div>
      <h2 className="text-xl font-black mb-2">Listing Not Found</h2>
      <p className="text-sm text-muted-foreground mb-6">This listing may have been removed.</p>
      <button onClick={() => setLoc("/transport")}
        className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-black hover:bg-teal-500 transition-all active:scale-95">
        Browse Listings
      </button>
    </div>
  );

  const priceDisp = listing.price_display ?? (listing.price ? `MK ${Number(listing.price).toLocaleString()}` : "Negotiable");
  const rating    = listing.rating ?? 0;
  const revCount  = listing.review_count ?? 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-32">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setLoc("/transport")}
          className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-all">
          <ChevronLeft size={16}/> Back
        </button>
        <div className="flex gap-2">
          <button onClick={share} className="p-2 rounded-xl border border-border hover:bg-muted transition-all active:scale-95">
            <Share2 size={15}/>
          </button>
          <button onClick={() => setLoc(`/report?listing=${listing.id}`)}
            className="p-2 rounded-xl border border-border hover:bg-muted hover:text-red-500 transition-all active:scale-95 text-muted-foreground">
            <Flag size={15}/>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <Gallery images={images} vehicleType={listing.vehicle_type}/>
      </div>

      {(listing.is_premium||listing.is_featured) && (
        <div className={`flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black tracking-widest uppercase text-white rounded-xl mb-3 ${
          listing.is_premium
            ? "bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500"
            : "bg-gradient-to-r from-teal-600 to-teal-500"
        }`}>
          ⭐ {listing.is_premium ? "Premium Driver" : "Featured Listing"}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{EMOJI[listing.vehicle_type]??"🚗"}</span>
            <h1 className="text-xl font-black leading-tight">{listing.title}</h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <MapPin size={11} className="text-teal-500"/>
            <span>{listing.location}</span>
            {listing.from_city && listing.to_city && (
              <span className="text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded-full">
                {listing.from_city} → {listing.to_city}
              </span>
            )}
          </div>
        </div>
        {listing.is_online && (
          <div className="flex items-center gap-1 bg-green-500/15 border border-green-400/30 rounded-full px-2.5 py-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-[10px] font-bold text-green-500">LIVE</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-card border border-card-border rounded-xl p-2.5 text-center">
          <Stars rating={rating} size={10}/>
          <div className="text-sm font-black mt-0.5">{rating>0 ? rating.toFixed(1) : "New"}</div>
          <div className="text-[9px] text-muted-foreground">{revCount} reviews</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-2.5 text-center">
          <div className="text-sm font-black text-teal-600 dark:text-teal-400">{priceDisp}</div>
          <div className="text-[9px] text-muted-foreground capitalize">{listing.price_type??"fixed"}</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-2.5 text-center">
          <Eye size={13} className="text-muted-foreground mx-auto mb-0.5"/>
          <div className="text-sm font-black">{listing.view_count??0}</div>
          <div className="text-[9px] text-muted-foreground">views</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {listing.is_verified && (
          <span className="flex items-center gap-1 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-bold border border-blue-200/50 dark:border-blue-700/30">
            <Shield size={9}/> Verified
          </span>
        )}
        {listing.covers_other_routes && (
          <span className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-semibold border border-purple-100 dark:border-purple-800/30">
            🗺️ Multiple Routes
          </span>
        )}
        {listing.tags?.map(tag => (
          <span key={tag} className="flex items-center gap-1 text-[10px] bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-2.5 py-1 rounded-full font-semibold border border-teal-100 dark:border-teal-800/30">
            <Tag size={8}/> {tag}
          </span>
        ))}
      </div>

      {listing.description && (
        <div className="bg-card border border-card-border rounded-2xl p-4 mb-4">
          <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-2">About This Service</h3>
          <p className="text-sm text-foreground leading-relaxed">{listing.description}</p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {listing.phone && (
          <a href={`tel:+265${listing.phone}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted transition-all active:scale-95">
            <Phone size={15}/> Call
          </a>
        )}
        {listing.whatsapp && (
          <a href={`https://wa.me/265${listing.whatsapp}?text=Hi! I found you on TransportMW — I'd like to book a ride.`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all active:scale-95">
            <MessageCircle size={15}/> WhatsApp
          </a>
        )}
      </div>

      <button onClick={() => { setShowBook(!showBook); setBDone(false); setBError(""); }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm transition-all active:scale-95 mb-4">
        <Zap size={15}/> {showBook ? "Hide Form" : "Book This Ride"}
      </button>

      {showBook && !bDone && (
        <div className="bg-card border border-card-border rounded-2xl p-4 mb-4 space-y-3 animate-in fade-in duration-200">
          <h3 className="text-sm font-black flex items-center gap-2"><Calendar size={14} className="text-teal-500"/> Book a Ride</h3>
          <div className="grid grid-cols-2 gap-2">
            {[["From *",bFrom,setBFrom,"Pickup"],["To *",bTo,setBTo,"Drop-off"]].map(([l,v,fn,ph]:[any,any,any,any]) => (
              <div key={l}>
                <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground mb-1 block">{l}</label>
                <input value={v} onChange={e => fn(e.target.value)} placeholder={ph}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500 transition-all"/>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[["Name *",bName,setBName,"Full name","text"],["Phone *",bPhone,setBPhone,"08xx xxx xxx","tel"]].map(([l,v,fn,ph,t]:[any,any,any,any,any]) => (
              <div key={l}>
                <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground mb-1 block">{l}</label>
                <input value={v} onChange={e => fn(e.target.value)} placeholder={ph} type={t}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500 transition-all"/>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground mb-1 block">Date (optional)</label>
              <input value={bDate} onChange={e => setBDate(e.target.value)} type="date"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500 transition-all"/>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground mb-1 block flex items-center gap-1"><Users size={9}/> Passengers</label>
              <select value={bPax} onChange={e => setBPax(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500 transition-all appearance-none">
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n===1?"passenger":"passengers"}</option>)}
              </select>
            </div>
          </div>
          {bError && <p className="text-xs text-red-500">{bError}</p>}
          <button onClick={submitBooking} disabled={bLoading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-black text-sm rounded-xl transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
            {bLoading ? <><Loader2 size={14} className="animate-spin"/> Sending...</> : <><Zap size={14}/> Confirm Booking Request</>}
          </button>
          <p className="text-[10px] text-muted-foreground text-center">Driver will contact you to confirm. No payment needed yet.</p>
        </div>
      )}

      {bDone && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-4 text-center animate-in fade-in duration-200">
          <CheckCircle2 size={32} className="text-green-600 mx-auto mb-2"/>
          <h3 className="text-sm font-black text-green-700 dark:text-green-400 mb-1">Booking Request Sent!</h3>
          <p className="text-xs text-green-600 dark:text-green-500">The driver will contact you shortly.</p>
          <p className="text-xs text-muted-foreground mt-1">Check <strong>Bookings</strong> tab to track your ride.</p>
          {listing.whatsapp && (
            <a href={`https://wa.me/265${listing.whatsapp}?text=Hi! I just sent a booking request on TransportMW.`}
              target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-500 transition-all">
              <MessageCircle size={11}/> Follow up on WhatsApp
            </a>
          )}
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black flex items-center gap-2">
            <Star size={13} className="fill-amber-400 text-amber-400"/> Reviews ({revCount})
          </h3>
          <button onClick={() => { setShowReview(!showReview); setRDone(false); setRError(""); }}
            className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline">
            {showReview ? "Cancel" : "+ Write Review"}
          </button>
        </div>

        {showReview && !rDone && (
          <div className="bg-card border border-card-border rounded-2xl p-4 mb-3 space-y-3 animate-in fade-in duration-200">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setRRating(i)} className="transition-all active:scale-90">
                  <Star size={28} className={i<=rRating?"fill-amber-400 text-amber-400":"fill-muted text-muted"}/>
                </button>
              ))}
            </div>
            <input value={rName} onChange={e => setRName(e.target.value)} placeholder="Your name (optional)"
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500 transition-all"/>
            <textarea value={rComment} onChange={e => setRComment(e.target.value)}
              placeholder="Tell others about your experience..." rows={3}
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none resize-none focus:border-teal-500 transition-all"/>
            {rError && <p className="text-xs text-red-500">{rError}</p>}
            <button onClick={submitReview} disabled={rLoading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-sm rounded-xl transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
              {rLoading ? <><Loader2 size={13} className="animate-spin"/> Submitting...</> : <><Star size={13}/> Submit Review</>}
            </button>
          </div>
        )}

        {rDone && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-3 flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 size={16} className="text-amber-600"/>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Review submitted — thank you!</p>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">No reviews yet — be the first!</div>
        ) : (
          <div className="space-y-2">
            {reviews.map(r => (
              <div key={r.id} className="bg-card border border-card-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-[10px] font-black text-teal-700 dark:text-teal-400">
                      {(r.reviewer_name??"A").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold">{r.reviewer_name??"Anonymous"}</span>
                  </div>
                  <Stars rating={r.rating} size={11}/>
                </div>
                {r.comment && <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>}
                <p className="text-[9px] text-muted-foreground mt-1.5">
                  {new Date(r.created_at).toLocaleDateString("en-MW",{day:"numeric",month:"short",year:"numeric"})}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-14 lg:bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2 items-center">
          <div className="flex-1">
            <div className="text-sm font-black">{priceDisp}</div>
            <div className="text-[10px] text-muted-foreground capitalize">{listing.price_type??"fixed"} · {listing.vehicle_type}</div>
          </div>
          {listing.whatsapp && (
            <a href={`https://wa.me/265${listing.whatsapp}?text=Hi! I found you on TransportMW.`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl transition-all active:scale-95">
              <MessageCircle size={13}/> WhatsApp
            </a>
          )}
          <button onClick={() => { setShowBook(true); window.scrollTo({top:500,behavior:"smooth"}); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl transition-all active:scale-95">
            <Zap size={13}/> Book
          </button>
        </div>
      </div>
    </div>
  );
}
