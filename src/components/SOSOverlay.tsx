import { useState, useEffect } from "react";
import { AlertTriangle, X, Phone, MessageCircle, Share2, Shield, ChevronRight } from "lucide-react";

const EMERGENCY_CONTACTS = [
  { name: "Malawi Police",      number: "999",          icon: "🚔", color: "bg-blue-600" },
  { name: "Ambulance",          number: "998",          icon: "🚑", color: "bg-red-600" },
  { name: "Fire Brigade",       number: "990",          icon: "🚒", color: "bg-teal-600" },
  { name: "TransportMW Support",number: "+265999626944",icon: "💬", color: "bg-green-600" },
];

const SAFETY_TIPS = [
  "Share your trip link with a trusted contact",
  "Verify the driver's ID and vehicle plate",
  "Note the vehicle color and registration",
  "Trust your instincts — leave if uncomfortable",
];

interface SOSOverlayProps {
  /** Pass tripId if currently in an active booking */
  tripId?: string | null;
  /** Float button position: 'bottom-right' (default) or 'inline' */
  variant?: "float" | "inline";
}

export default function SOSOverlay({ tripId, variant = "float" }: SOSOverlayProps) {
  const [open, setOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareDone, setShareDone] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holding, setHolding] = useState(false);

  // Hold-to-call SOS mechanic (prevents accidental taps)
  useEffect(() => {
    if (!holding) {
      setHoldProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          // Trigger emergency call
          window.location.href = "tel:999";
          setHolding(false);
          return 0;
        }
        return prev + 5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [holding]);

  const shareTrip = async () => {
    setShareLoading(true);
    try {
      const url = tripId
        ? `${window.location.origin}/transport/${tripId}`
        : window.location.href;
      const text = `🚨 I'm currently on a trip via TransportMW. Track my journey: ${url}`;

      if (navigator.share) {
        await navigator.share({ title: "My TransportMW Trip", text, url });
      } else {
        await navigator.clipboard.writeText(text);
        setShareDone(true);
        setTimeout(() => setShareDone(false), 2500);
      }
    } catch {
      // User cancelled share
    } finally {
      setShareLoading(false);
    }
  };

  const triggerButton = variant === "float" ? (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-20 right-4 z-50 lg:bottom-6 w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 animate-pulse-gentle"
      title="Emergency & Safety"
      aria-label="Open SOS and safety overlay"
    >
      <AlertTriangle size={20} strokeWidth={2.5} />
    </button>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95"
    >
      <AlertTriangle size={14} /> SOS & Safety
    </button>
  );

  return (
    <>
      {triggerButton}

      {/* Overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            onClick={() => setOpen(false)}
          />

          {/* Sheet — slides up from bottom on mobile, centered on desktop */}
          <div className="fixed inset-x-0 bottom-0 z-[80] lg:inset-0 lg:flex lg:items-center lg:justify-center animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-card lg:max-w-md lg:w-full lg:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 lg:hidden">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="bg-red-600 px-5 pt-3 pb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <AlertTriangle size={18} className="text-white" />
                    <h2 className="text-white font-black text-base">Emergency & Safety</h2>
                  </div>
                  <p className="text-red-100 text-xs">Available 24/7 — Your safety is priority</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-red-700 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">

                {/* Hold-to-call SOS button */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    {/* Circular progress ring */}
                    <svg className="absolute w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-red-100 dark:text-red-900/30" />
                      <circle
                        cx="50" cy="50" r="45"
                        fill="none" stroke="currentColor" strokeWidth="4"
                        className="text-red-600 transition-all"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - holdProgress / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <button
                      onMouseDown={() => setHolding(true)}
                      onMouseUp={() => setHolding(false)}
                      onMouseLeave={() => setHolding(false)}
                      onTouchStart={() => setHolding(true)}
                      onTouchEnd={() => setHolding(false)}
                      className={`w-20 h-20 rounded-full ${
                        holding ? "bg-red-600 scale-95" : "bg-red-50 dark:bg-red-900/30"
                      } flex flex-col items-center justify-center gap-1 transition-all select-none`}
                    >
                      <Phone size={24} className={holding ? "text-white" : "text-red-600"} />
                      <span className={`text-[10px] font-black ${holding ? "text-white" : "text-red-600"}`}>
                        {holding ? `${Math.round(holdProgress)}%` : "HOLD"}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    {holding ? "Keep holding to call 999..." : "Hold to call Emergency Services (999)"}
                  </p>
                </div>

                {/* Quick contacts */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-2.5">Quick Contacts</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {EMERGENCY_CONTACTS.map(c => (
                      <a
                        key={c.name}
                        href={`tel:${c.number}`}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-all active:scale-95"
                      >
                        <div className={`${c.color} w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0`}>
                          {c.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black leading-tight truncate">{c.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{c.number}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Share trip location */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-2.5">Share Your Location</h3>
                  <button
                    onClick={shareTrip}
                    disabled={shareLoading}
                    className="w-full flex items-center justify-between gap-2 p-3.5 rounded-xl border border-border hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all active:scale-95"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                        <Share2 size={14} className="text-teal-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-black">
                          {shareDone ? "✓ Link copied!" : "Share Trip with Contact"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Send current trip link to someone you trust</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                  </button>
                </div>

                {/* Safety tips */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-2.5 flex items-center gap-1.5">
                    <Shield size={11} /> Safety Tips
                  </h3>
                  <div className="space-y-1.5">
                    {SAFETY_TIPS.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp support */}
                <a
                  href="https://wa.me/265999626944?text=HELP: I need assistance with my TransportMW trip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-black transition-all active:scale-95"
                >
                  <MessageCircle size={15} /> Chat with TransportMW Support
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
