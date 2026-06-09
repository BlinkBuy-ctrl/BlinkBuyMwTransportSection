import { useState, useEffect, useRef } from "react";
import {
  X, MapPin, Clock, CheckCircle, Car, Navigation,
  Phone, MessageCircle, AlertTriangle, ChevronRight,
  User, Banknote, Star
} from "lucide-react";
import { supabase, authedClient } from "@/lib/supabase";
import SOSOverlay from "./SOSOverlay";

// ─── Booking State Machine ────────────────────────────────────────────────────
export type BookingStatus =
  | "requesting"
  | "accepted"
  | "en_route"
  | "arrived"
  | "completed"
  | "cancelled";

const STATUS_STEPS: { key: BookingStatus; label: string; sublabel: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "requesting", label: "Request Sent",    sublabel: "Waiting for driver confirmation",  icon: Clock },
  { key: "accepted",   label: "Driver Accepted", sublabel: "Confirming your pickup details",   icon: CheckCircle },
  { key: "en_route",   label: "Driver En Route", sublabel: "On the way to your location",      icon: Car },
  { key: "arrived",    label: "Driver Arrived",  sublabel: "Your driver is waiting for you",   icon: Navigation },
  { key: "completed",  label: "Trip Complete",   sublabel: "Thank you for riding with us!",    icon: CheckCircle },
];

const STATUS_ORDER: BookingStatus[] = ["requesting", "accepted", "en_route", "arrived", "completed"];

function statusIndex(s: BookingStatus) {
  return STATUS_ORDER.indexOf(s);
}

// ─── One-tap Rating ───────────────────────────────────────────────────────────
function QuickRating({ bookingId, listingId, reviewerToken, onDone }: {
  bookingId: string;
  listingId: string;
  reviewerToken: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await authedClient(reviewerToken).from("reviews").upsert({
        listing_id: listingId,
        booking_id: bookingId,
        reviewer_token: reviewerToken,
        reviewer_name: "Anonymous Passenger",
        rating,
        comment: comment || null,
      }, { onConflict: "listing_id,reviewer_token" });
      setDone(true);
      setTimeout(onDone, 1500);
    } catch {
      // Duplicate or error — still dismiss
      setDone(true);
      setTimeout(onDone, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="text-3xl mb-1">🎉</div>
        <p className="text-sm font-black">Thanks for the feedback!</p>
        <p className="text-xs text-muted-foreground">Your rating helps other passengers</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm font-black mb-1">Rate Your Trip</p>
        <p className="text-xs text-muted-foreground">How was your experience?</p>
      </div>

      {/* Star rating */}
      <div className="flex justify-center gap-2">
        {[1,2,3,4,5].map(s => (
          <button
            key={s}
            onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="transition-all active:scale-90"
          >
            <Star
              size={36}
              className={`transition-all ${
                s <= (hover || rating)
                  ? "fill-amber-400 text-amber-400 scale-110"
                  : "fill-muted text-muted"
              }`}
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <div className="text-center text-xs font-bold text-muted-foreground animate-in fade-in duration-200">
          {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
        </div>
      )}

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Optional: leave a comment..."
        rows={2}
        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none resize-none focus:border-orange-500 transition-all"
      />

      <button
        onClick={submit}
        disabled={!rating || submitting}
        className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-40"
      >
        {submitting ? "Submitting..." : "Submit Rating"}
      </button>
    </div>
  );
}

// ─── Main BookingTracker Component ────────────────────────────────────────────
export interface BookingInfo {
  id: string;
  listing_id: string;
  from_location: string;
  to_location: string;
  status: BookingStatus;
  booker_token: string;
  trip_date?: string;
  trip_time?: string;
  passengers?: number;
  payment_method?: string;
  listing?: {
    title: string;
    vehicle_type: string;
    whatsapp?: string;
    phone?: string;
    price_display?: string;
    price?: number;
  };
}

interface BookingTrackerProps {
  booking: BookingInfo;
  onClose: () => void;
  onStatusChange?: (newStatus: BookingStatus) => void;
}

export default function BookingTracker({ booking, onClose, onStatusChange }: BookingTrackerProps) {
  const [currentStatus, setCurrentStatus] = useState<BookingStatus>(booking.status);
  const [showRating, setShowRating] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const touchStartY = useRef<number | null>(null);

  // Subscribe to realtime booking updates
  useEffect(() => {
    const channel = supabase
      .channel(`booking_${booking.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${booking.id}` },
        (payload) => {
          const newStatus = payload.new.status as BookingStatus;
          setCurrentStatus(newStatus);
          onStatusChange?.(newStatus);
          if (newStatus === "completed") {
            setTimeout(() => setShowRating(true), 800);
          }
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [booking.id, onStatusChange]);

  // Swipe-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 80) onClose();
    touchStartY.current = null;
  };

  const currentIndex = statusIndex(currentStatus);
  const isCancelled = currentStatus === "cancelled";
  const isCompleted = currentStatus === "completed";

  const formatPayment = (method?: string) => {
    if (!method) return "—";
    return { airtel: "Airtel Money", mpamba: "TNM Mpamba", cash: "Cash" }[method] ?? method;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={onClose} />

      {/* Bottom sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[70] bg-card rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1.5 rounded-full bg-muted-foreground/25" />
        </div>

        <div className="px-5 pb-8 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-black">
                {isCancelled ? "Booking Cancelled" : isCompleted ? "Trip Complete ✓" : "Booking Tracker"}
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                #{booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-all active:scale-90">
              <X size={17} />
            </button>
          </div>

          {/* Trip summary card */}
          <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-sm font-semibold">{booking.from_location}</span>
            </div>
            <div className="ml-[2px] border-l-2 border-dashed border-border h-4" />
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-sm font-semibold">{booking.to_location}</span>
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              {booking.trip_date && (
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {booking.trip_date} {booking.trip_time}
                </span>
              )}
              {booking.passengers && (
                <span className="flex items-center gap-1">
                  <User size={10} /> {booking.passengers} pax
                </span>
              )}
              <span className="flex items-center gap-1">
                <Banknote size={10} /> {formatPayment(booking.payment_method)}
              </span>
            </div>
          </div>

          {/* State machine progress */}
          {!isCancelled && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-3">Trip Progress</h3>
              <div className="space-y-1">
                {STATUS_STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isDone = idx < currentIndex;
                  const isActive = idx === currentIndex;
                  const isFuture = idx > currentIndex;

                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      {/* Step indicator */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isDone ? "bg-green-500" :
                          isActive ? "bg-orange-600 animate-pulse" :
                          "bg-muted"
                        }`}>
                          <StepIcon
                            size={14}
                            className={isDone || isActive ? "text-white" : "text-muted-foreground"}
                          />
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div className={`w-0.5 h-6 my-1 rounded-full transition-all ${
                            isDone ? "bg-green-500" : "bg-border"
                          }`} />
                        )}
                      </div>

                      {/* Step content */}
                      <div className={`flex-1 pb-1 ${isFuture ? "opacity-40" : ""}`}>
                        <div className={`text-xs font-black ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                          {step.label}
                          {isActive && (
                            <span className="ml-2 text-[9px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-bold">
                              NOW
                            </span>
                          )}
                        </div>
                        {(isActive || isDone) && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">{step.sublabel}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rating section (post-completion) */}
          {isCompleted && showRating && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 animate-in fade-in duration-300">
              <QuickRating
                bookingId={booking.id}
                listingId={booking.listing_id}
                reviewerToken={booking.booker_token}
                onDone={() => setShowRating(false)}
              />
            </div>
          )}

          {/* Driver contact */}
          {booking.listing && (currentStatus !== "requesting" || true) && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-2.5">Driver Contact</h3>
              <div className="flex gap-2">
                {booking.listing.phone && (
                  <a
                    href={`tel:${booking.listing.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-all active:scale-95"
                  >
                    <Phone size={14} /> Call
                  </a>
                )}
                {booking.listing.whatsapp && (
                  <a
                    href={`https://wa.me/265${booking.listing.whatsapp}?text=Hi, I have a booking with you on TransportMW (Booking ID: ${booking.id.slice(0, 8).toUpperCase()})`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-all active:scale-95"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          {/* SOS */}
          <SOSOverlay tripId={booking.listing_id} variant="inline" />

          {/* Cancel (only when requesting/accepted) */}
          {!isCancelled && !isCompleted && currentIndex <= 1 && (
            <div>
              {!cancelConfirm ? (
                <button
                  onClick={() => setCancelConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                >
                  <X size={12} /> Cancel Booking
                </button>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle size={14} />
                    <span className="text-xs font-black">Cancel this booking?</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Please notify the driver on WhatsApp as well.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCancelConfirm(false)}
                      className="flex-1 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-all"
                    >
                      Keep Booking
                    </button>
                    <button
                      onClick={async () => {
                        await authedClient(booking.booker_token)
                          .from("bookings")
                          .update({ status: "cancelled" })
                          .eq("id", booking.id)
                          .eq("booker_token", booking.booker_token);
                        setCurrentStatus("cancelled");
                        setCancelConfirm(false);
                      }}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition-all active:scale-95"
                    >
                      Yes, Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
