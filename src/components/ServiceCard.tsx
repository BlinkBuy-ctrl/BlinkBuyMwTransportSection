import { Link } from "wouter";
import { MapPin, Star, MessageCircle, Phone, Zap, Shield, Award } from "lucide-react";

const EMOJI: Record<string, string> = {
  "Taxi":"🚕","Motorcycle":"🏍️","Minibus":"🚌","Shuttle":"🚐","Hire Car":"🚗",
  "Airport Transfer":"✈️","Cargo / Delivery":"🚛","School Transport":"🏫",
  "Corporate Transport":"🏢","Other":"🚘",
};
const GRAD = [
  "from-orange-400 to-orange-600","from-blue-400 to-blue-600",
  "from-green-400 to-green-600","from-purple-400 to-purple-600",
  "from-pink-400 to-pink-600","from-teal-400 to-teal-600",
];
const pickGrad = (s: string) => GRAD[(s?.charCodeAt(0)||65) % GRAD.length];

interface Worker {
  name?: string; profilePhoto?: string; profile_photo?: string;
  isVerified?: boolean; is_verified?: boolean;
  isTrusted?: boolean; is_trusted?: boolean;
  badge?: string; whatsapp?: string; phone?: string;
  jobs_completed?: number;
}
export interface Service {
  id: string; title: string; description?: string;
  vehicle_type?: string; category?: string;
  price?: number | null;
  price_display?: string | null; priceDisplay?: string | null;
  price_type?: string | null; priceType?: string | null;
  location: string; from_city?: string; to_city?: string;
  rating?: number;
  review_count?: number; reviewCount?: number;
  is_online?: boolean; isOnline?: boolean;
  is_featured?: boolean; isFeatured?: boolean;
  is_premium?: boolean;
  tags?: string[];
  whatsapp?: string; phone?: string;
  worker?: Worker | null;
}

export function ServiceCard({ service: s }: { service: Service }) {
  const w          = s.worker;
  const isOnline   = s.is_online   ?? s.isOnline   ?? false;
  const isFeatured = s.is_featured ?? s.isFeatured  ?? false;
  const isPremium  = s.is_premium  ?? false;
  const verified   = w?.is_verified ?? w?.isVerified ?? false;
  const trusted    = w?.is_trusted  ?? w?.isTrusted  ?? false;
  const photo      = w?.profile_photo ?? w?.profilePhoto;
  const priceDisp  = s.price_display ?? s.priceDisplay
    ?? (s.price ? `MK ${Number(s.price).toLocaleString()}` : "Negotiable");
  const reviews    = s.review_count ?? s.reviewCount ?? 0;
  const vType      = s.vehicle_type ?? s.tags?.[0] ?? "";
  const waNum      = s.whatsapp ?? w?.whatsapp;
  const phone      = s.phone    ?? w?.phone;

  return (
    <Link href={`/transport/${s.id}`}>
      <div className={`group bg-card border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer ${
        isPremium  ? "border-yellow-400/50 shadow-yellow-500/5 shadow-md" :
        isFeatured ? "border-orange-500/40 shadow-orange-500/5 shadow-md" :
        "border-card-border"
      }`}>
        {(isPremium || isFeatured) && (
          <div className={`text-white text-[10px] font-black px-3 py-1 text-center tracking-wider uppercase ${
            isPremium ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                      : "bg-gradient-to-r from-orange-600 to-orange-500"
          }`}>
            {isPremium ? "⭐ Premium Driver" : "⭐ Featured"}
          </div>
        )}

        <div className="p-4">
          {/* Avatar + title row */}
          <div className="flex items-start gap-3 mb-3">
            <div className="relative shrink-0">
              {w?.name ? (
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${pickGrad(w.name)} flex items-center justify-center text-sm font-black text-white overflow-hidden`}>
                  {photo ? <img src={photo} alt="" className="w-full h-full object-cover"/> : w.name.charAt(0)}
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/30 flex items-center justify-center text-2xl">
                  {EMOJI[vType] ?? "🚗"}
                </div>
              )}
              {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card"/>}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug mb-1">
                {s.title}
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground flex-wrap">
                <MapPin size={9} className="shrink-0"/><span className="truncate">{s.location}</span>
                {s.from_city && s.to_city && (
                  <span className="text-orange-500 font-semibold shrink-0">· {s.from_city}→{s.to_city}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {verified && (
                  <span className="flex items-center gap-0.5 text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold">
                    <Shield size={8}/> Verified
                  </span>
                )}
                {w?.badge && (
                  <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
                    🏅 {w.badge}
                  </span>
                )}
                {isOnline && (
                  <span className="flex items-center gap-0.5 text-[9px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold">
                    <Zap size={8}/> Online
                  </span>
                )}
              </div>
            </div>
          </div>

          {s.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">{s.description}</p>
          )}

          {s.tags && s.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mb-2.5">
              {s.tags.slice(0,3).map(t => (
                <span key={t} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{t}</span>
              ))}
              {s.tags.length > 3 && <span className="text-[9px] text-muted-foreground">+{s.tags.length-3}</span>}
            </div>
          )}

          {/* Rating + price */}
          <div className="flex items-center justify-between pt-2.5 border-t border-border/50">
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={10} className={i <= Math.round(s.rating||0) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}/>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground ml-0.5">
                {s.rating ? s.rating.toFixed(1) : "New"}{reviews > 0 && ` (${reviews})`}
              </span>
            </div>
            <div className="text-sm font-black text-orange-600 dark:text-orange-400">{priceDisp}</div>
          </div>
        </div>

        {/* Quick contact strip */}
        {(waNum || phone) && (
          <div className="border-t border-border/60 flex divide-x divide-border/60 lg:opacity-0 lg:group-hover:opacity-100 opacity-100 transition-opacity">
            {phone && (
              <a href={`tel:+265${phone}`} onClick={e => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                <Phone size={11}/> Call
              </a>
            )}
            {waNum && (
              <a href={`https://wa.me/265${waNum}?text=Hi, I found you on TransportMW!`}
                target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all">
                <MessageCircle size={11}/> WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
