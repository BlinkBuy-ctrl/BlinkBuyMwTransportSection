import { useState } from "react";
import { Star, Zap, CheckCircle, X, TrendingUp, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getOrCreateIdentity } from "@/lib/identity";

const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    price: 10000,
    period: "/ month",
    badge: null,
    perks: ["Top of search results","⭐ Premium badge","Priority in Live Feed","Up to 5x more views"],
  },
  {
    id: "quarterly",
    label: "3 Months",
    price: 25000,
    period: "/ 3 months",
    badge: "SAVE 17%",
    perks: ["Top of search results","⭐ Premium badge","Priority in Live Feed","Up to 5x more views","Featured on homepage"],
  },
];

interface PremiumUpgradeProps {
  listingId: string;
  listingTitle: string;
  onClose: () => void;
}

export default function PremiumUpgrade({ listingId, listingTitle, onClose }: PremiumUpgradeProps) {
  const [plan, setPlan]         = useState<"monthly"|"quarterly">("monthly");
  const [payment, setPayment]   = useState<"airtel"|"mpamba">("airtel");
  const [ref, setRef]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  const PAYMENT_NUMS = { airtel:"0999626944", mpamba:"0888712272" };
  const selected = PLANS.find(p => p.id === plan)!;

  const submit = async () => {
    if (!ref.trim()) { setError("Please enter your payment reference"); return; }
    setLoading(true); setError("");
    try {
      const identity = await getOrCreateIdentity();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (plan === "quarterly" ? 3 : 1));

      await supabase.from("premium_listings").insert({
        listing_id:     listingId,
        operator_token: identity.token,
        plan,
        amount_mk:      selected.price,
        payment_method: payment,
        payment_ref:    ref.trim(),
        expires_at:     expiresAt.toISOString(),
        status:         "pending",
      });
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" onClick={onClose}/>
      <div className="fixed inset-x-0 bottom-0 z-[80] lg:inset-0 lg:flex lg:items-center lg:justify-center animate-in slide-in-from-bottom-4 duration-200">
        <div className="bg-card lg:max-w-md lg:w-full lg:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">

          <div className="flex justify-center pt-3 pb-1 lg:hidden">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30"/>
          </div>

          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-5 pt-3 pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Star size={18} className="text-white fill-white"/>
                <h2 className="text-white font-black text-base">Upgrade to Premium</h2>
              </div>
              <p className="text-yellow-100 text-xs">Get 5x more bookings and appear at the top</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-yellow-600 transition-all">
              <X size={18}/>
            </button>
          </div>

          {done ? (
            <div className="p-8 text-center">
              <CheckCircle size={44} className="text-green-500 mx-auto mb-3"/>
              <h3 className="font-black text-lg mb-1">Payment Submitted!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We'll verify your payment within 2 hours and activate your Premium badge.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400 mb-5 text-left">
                Send <strong>MK {selected.price.toLocaleString()}</strong> to <strong>{PAYMENT_NUMS[payment]}</strong> ({payment === "airtel" ? "Airtel Money" : "TNM Mpamba"}) and use the reference <strong>{ref}</strong>
              </div>
              <button onClick={onClose} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black transition-all active:scale-95">
                Close
              </button>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground">Upgrading: <strong className="text-foreground">{listingTitle}</strong></p>

              {/* Plan selector */}
              <div className="grid grid-cols-2 gap-2">
                {PLANS.map(p => (
                  <button key={p.id} onClick={() => setPlan(p.id as any)}
                    className={`relative p-3 rounded-xl border text-left transition-all ${
                      plan === p.id ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10" : "border-border hover:border-yellow-300"
                    }`}>
                    {p.badge && (
                      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{p.badge}</span>
                    )}
                    <div className="text-sm font-black mb-0.5">{p.label}</div>
                    <div className="text-lg font-black text-yellow-600">MK {p.price.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">{p.period}</div>
                    <div className="mt-2 space-y-0.5">
                      {p.perks.map(perk => (
                        <div key={perk} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <CheckCircle size={8} className="text-green-500 shrink-0"/>{perk}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              {/* Pay with */}
              <div>
                <label className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-2 block">Pay With</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["airtel","mpamba"] as const).map(m => (
                    <button key={m} onClick={() => setPayment(m)}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        payment === m ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300" : "border-border text-muted-foreground hover:border-orange-300"
                      }`}>
                      {m === "airtel" ? "📱 Airtel Money" : "📱 TNM Mpamba"}
                      <div className="text-[9px] font-mono mt-0.5">{PAYMENT_NUMS[m]}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Send <strong className="text-foreground">MK {selected.price.toLocaleString()}</strong> to <strong className="text-foreground">{PAYMENT_NUMS[payment]}</strong>
                </p>
              </div>

              {/* Payment ref */}
              <div>
                <label className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-1.5 block">Payment Reference / Transaction ID *</label>
                <input
                  value={ref}
                  onChange={e => setRef(e.target.value)}
                  placeholder="e.g. AIR12345678 or TNM98765432"
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-yellow-500 transition-all"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Found in your Airtel Money / Mpamba SMS after sending</p>
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">{error}</div>
              )}

              <button onClick={submit} disabled={loading}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-white rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> : <Star size={14} className="fill-white"/>}
                {loading ? "Submitting…" : "Submit Payment & Upgrade"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
