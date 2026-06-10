import { useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getOrCreateIdentity } from "@/lib/identity";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
}

export function StarRating({ rating, count, size = 14 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={size}
            className={star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground font-medium">
        {rating > 0 ? rating.toFixed(1) : "New"}{count !== undefined && count > 0 ? ` (${count})` : ""}
      </span>
    </div>
  );
}

interface InteractiveRatingProps {
  listingId: string;
  bookingId?: string;
  onSubmitted?: (rating: number, comment: string) => void;
}

export function InteractiveRating({ listingId, bookingId, onSubmitted }: InteractiveRatingProps) {
  const [hovered, setHovered]   = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment]   = useState("");
  const [name, setName]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async () => {
    if (!selected) { setError("Please select a star rating"); return; }
    setError("");
    setLoading(true);
    try {
      const identity = await getOrCreateIdentity();
      const { error: err } = await supabase.from("reviews").upsert({
        listing_id:     listingId,
        booking_id:     bookingId ?? null,
        reviewer_token: identity.token,
        reviewer_name:  name.trim() || "Anonymous",
        rating:         selected,
        comment:        comment.trim() || null,
      }, { onConflict: "listing_id,reviewer_token" });
      if (err) throw new Error(err.message);
      setSubmitted(true);
      onSubmitted?.(selected, comment);
    } catch (e: any) {
      setError(e.message || "Failed to submit. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="flex flex-col items-center gap-2 py-6">
      <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl animate-in zoom-in duration-300">
        ✅
      </div>
      <p className="text-sm font-black text-foreground">Thank you!</p>
      <p className="text-xs text-muted-foreground">Your review helps others find great drivers</p>
      <div className="flex gap-0.5 mt-1">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={18} className={i <= selected ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}/>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Star picker */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-muted-foreground font-medium">
          {selected === 0 ? "Tap to rate your experience" :
           selected === 1 ? "😕 Poor" :
           selected === 2 ? "😐 Fair" :
           selected === 3 ? "🙂 Good" :
           selected === 4 ? "😊 Great" : "🤩 Excellent!"}
        </p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <button
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(i)}
              className="p-1 transition-transform active:scale-90"
              style={{ transform: (hovered >= i || selected >= i) ? "scale(1.2)" : "scale(1)", transition: "transform 120ms ease" }}
            >
              <Star size={28}
                className={
                  (hovered || selected) >= i
                    ? "fill-amber-400 text-amber-400"
                    : "fill-muted text-muted"
                }
              />
            </button>
          ))}
        </div>
      </div>

      {selected > 0 && (
        <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500 transition-colors"
          />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience... (optional)"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm outline-none resize-none focus:border-teal-500 transition-colors leading-relaxed"
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !selected}
        className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-black transition-all active:scale-95 disabled:opacity-40 shadow-lg shadow-teal-500/20"
      >
        {loading ? "Submitting…" : selected ? `Submit ${selected}★ Review` : "Select a rating first"}
      </button>
    </div>
  );
}
