import { useState } from "react";
import { Share2, Copy, MessageCircle, CheckCircle } from "lucide-react";

interface ShareListingProps {
  listingId: string;
  title: string;
  priceDisplay?: string | null;
  location?: string;
  vehicleType?: string;
}

export default function ShareListing({ listingId, title, priceDisplay, location, vehicleType }: ShareListingProps) {
  const [copied, setCopied] = useState(false);

  const url     = `${window.location.origin}/transport/${listingId}`;
  const emoji   = ({"Taxi":"🚕","Motorcycle":"🏍️","Minibus":"🚌","Hire Car":"🚗","Airport Transfer":"✈️"} as Record<string,string>)[vehicleType??""] ?? "🚗";
  const message = `${emoji} ${title}\n📍 ${location || "Malawi"}\n💰 ${priceDisplay || "Negotiable"}\n\nBook now on TransportMW 👉 ${url}`;

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, text: message, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="flex items-center gap-2">
      <a href={whatsapp} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 hover:underline transition-all">
        <MessageCircle size={11}/> Share on WhatsApp
      </a>
      <span className="text-border">·</span>
      <button onClick={share}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-all">
        {copied ? <CheckCircle size={11} className="text-green-500"/> : <Copy size={11}/>}
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
