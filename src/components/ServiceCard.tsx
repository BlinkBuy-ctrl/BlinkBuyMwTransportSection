import { useState } from "react";
import { Link } from "wouter";
import { MapPin, Star, MessageCircle, Phone, Shield, ChevronRight, ImageOff } from "lucide-react";

const EMOJI: Record<string,string> = {
  "Taxi":"🚕","Motorcycle":"🏍️","Minibus":"🚌","Shuttle":"🚐","Hire Car":"🚗",
  "Airport Transfer":"✈️","Cargo / Delivery":"🚛","School Transport":"🏫",
  "Corporate Transport":"🏢","Other":"🚘",
};

export interface Service {
  id:string; title:string; description?:string;
  vehicle_type?:string; category?:string;
  price?:number|null; price_display?:string|null; priceDisplay?:string|null;
  price_type?:string|null; priceType?:string|null;
  location:string; from_city?:string; to_city?:string;
  rating?:number; review_count?:number; reviewCount?:number;
  is_online?:boolean; isOnline?:boolean;
  is_featured?:boolean; isFeatured?:boolean;
  is_premium?:boolean;
  tags?:string[];
  whatsapp?:string; phone?:string;
  thumbnail_url?:string|null;          // ← from listing_images trigger
  worker?:{ name?:string; profilePhoto?:string; profile_photo?:string;
    isVerified?:boolean; is_verified?:boolean; badge?:string;
    whatsapp?:string; phone?:string; } | null;
}

export function ServiceCard({ service: s }: { service: Service }) {
  const [pressed, setPressed]   = useState(false);
  const [imgErr, setImgErr]     = useState(false);

  const w          = s.worker;
  const isOnline   = s.is_online   ?? s.isOnline   ?? false;
  const isPremium  = s.is_premium  ?? false;
  const isFeatured = s.is_featured ?? s.isFeatured  ?? false;
  const verified   = w?.is_verified ?? w?.isVerified ?? false;
  const priceDisp  = s.price_display ?? s.priceDisplay
    ?? (s.price ? `MK ${Number(s.price).toLocaleString()}` : "Negotiable");
  const reviews    = s.review_count ?? s.reviewCount ?? 0;
  const vType      = s.vehicle_type ?? "";
  const waNum      = s.whatsapp ?? w?.whatsapp;
  const phoneNum   = s.phone ?? w?.phone;
  const rating     = s.rating ?? 0;
  const thumb      = (!imgErr && s.thumbnail_url) ? s.thumbnail_url : null;

  return (
    <Link href={`/transport/${s.id}`}>
      <div
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        style={{ transform: pressed ? "scale(0.97)" : "scale(1)", transition: "transform 120ms ease" }}
        className={`group relative bg-card rounded-2xl overflow-hidden cursor-pointer
          ${isPremium
            ? "border-2 border-yellow-400/60 shadow-lg shadow-yellow-500/10"
            : isFeatured
            ? "border-2 border-teal-400/60 shadow-lg shadow-teal-500/10"
            : "border border-card-border hover:border-teal-500/40 hover:shadow-md hover:shadow-teal-500/5"
          }`}
      >
        {/* Premium/Featured ribbon */}
        {(isPremium||isFeatured) && (
          <div className={`flex items-center justify-center gap-1.5 py-1 text-[10px] font-black tracking-widest uppercase text-white
            ${isPremium
              ? "bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500"
              : "bg-gradient-to-r from-teal-600 to-teal-500"}`}>
            ⭐ {isPremium ? "Premium Driver" : "Featured"}
          </div>
        )}

        {/* ── Thumbnail image (shown when available) ── */}
        {thumb ? (
          <div className="relative w-full h-36 overflow-hidden">
            <img
              src={thumb}
              alt={s.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgErr(true)}
            />
            {/* Dark gradient so text overlay works */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"/>
            {/* Online badge over image */}
            {isOnline && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/90 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>
                <span className="text-[9px] font-bold text-white">LIVE</span>
              </div>
            )}
          </div>
        ) : (
          /* No photo — emoji avatar fallback */
          isOnline && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-green-500/20 border border-green-400/30 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
              <span className="text-[9px] font-bold text-green-400">LIVE</span>
            </div>
          )
        )}

        <div className="p-4">
          {/* Top row: emoji avatar + title */}
          <div className="flex items-start gap-3 mb-3">
            {/* Only show emoji avatar when no thumbnail */}
            {!thumb && (
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/30 border border-teal-500/20 flex items-center justify-center text-3xl">
                  {EMOJI[vType] ?? "🚗"}
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-sm font-black text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 leading-snug mb-1">
                {s.title}
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin size={9} className="shrink-0 text-teal-500"/>
                <span className="truncate">{s.location}</span>
              </div>
              {s.from_city && s.to_city && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded-full">
                    {s.from_city} → {s.to_city}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1 flex-wrap mb-3">
            {verified && (
              <span className="flex items-center gap-0.5 text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-200/50 dark:border-blue-700/30">
                <Shield size={8}/> Verified
              </span>
            )}
            {/* Photo badge — signals trust */}
            {thumb && (
              <span className="flex items-center gap-0.5 text-[9px] bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-bold border border-teal-100 dark:border-teal-800/30">
                📷 Photo
              </span>
            )}
            {s.tags?.slice(0,2).map(t => (
              <span key={t} className="text-[9px] bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-semibold border border-teal-100 dark:border-teal-800/30">
                {t}
              </span>
            ))}
          </div>

          {/* Rating + price */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={12} className={i<=Math.round(rating)?"fill-amber-400 text-amber-400":"fill-muted text-muted"}/>
                ))}
              </div>
              <span className="text-xs font-bold text-foreground">{rating>0 ? rating.toFixed(1) : "New"}</span>
              {reviews>0 && <span className="text-[10px] text-muted-foreground">({reviews})</span>}
            </div>
            <span className="text-sm font-black text-teal-600 dark:text-teal-400">{priceDisp}</span>
          </div>

          {/* CTA row */}
          <div className="flex items-center justify-between pt-2.5 border-t border-border/50">
            <div className="flex gap-1.5">
              {phoneNum && (
                <a href={`tel:+265${phoneNum}`} onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95">
                  <Phone size={11}/> Call
                </a>
              )}
              {waNum && (
                <a href={`https://wa.me/265${waNum}?text=Hi, I found you on TransportMW!`}
                  target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-green-600 text-[11px] text-white font-bold hover:bg-green-500 transition-all active:scale-95">
                  <MessageCircle size={11}/> WhatsApp
                </a>
              )}
            </div>
            <span className="flex items-center gap-0.5 text-[11px] text-teal-600 dark:text-teal-400 font-bold group-hover:gap-1.5 transition-all">
              Book <ChevronRight size={12}/>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
