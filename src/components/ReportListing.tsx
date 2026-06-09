import { useState } from "react";
import { Flag, X, CheckCircle } from "lucide-react";
import { authedClient } from "@/lib/supabase";
import { getOrCreateIdentity } from "@/lib/identity";

const REASONS = [
  "Fake or misleading listing",
  "Wrong contact information",
  "Scam / fraud attempt",
  "Inappropriate content",
  "Vehicle doesn't match description",
  "Dangerous driver",
  "Other",
];

interface ReportListingProps {
  listingId: string;
  listingTitle: string;
}

export default function ReportListing({ listingId, listingTitle }: ReportListingProps) {
  const [open, setOpen]       = useState(false);
  const [reason, setReason]   = useState("");
  const [detail, setDetail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const submit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      const identity = await getOrCreateIdentity();
      await authedClient(identity.token).from("reports").insert({
        listing_id:     listingId,
        reporter_token: identity.token,
        reason,
        detail:         detail || null,
      });
      setDone(true);
      setTimeout(() => { setOpen(false); setDone(false); setReason(""); setDetail(""); }, 2000);
    } catch {
      // still close gracefully
      setDone(true);
      setTimeout(() => { setOpen(false); setDone(false); }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-500 transition-all"
      >
        <Flag size={11}/> Report listing
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]" onClick={() => setOpen(false)}/>
          <div className="fixed inset-x-0 bottom-0 z-[80] lg:inset-0 lg:flex lg:items-center lg:justify-center animate-in slide-in-from-bottom-4 duration-200">
            <div className="bg-card rounded-t-3xl lg:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="flex justify-center pt-3 pb-1 lg:hidden">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30"/>
              </div>

              {done ? (
                <div className="p-8 text-center">
                  <CheckCircle size={40} className="text-green-500 mx-auto mb-3"/>
                  <h3 className="font-black text-base mb-1">Report Submitted</h3>
                  <p className="text-sm text-muted-foreground">Thank you. We'll review this listing shortly.</p>
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-base">Report Listing</h3>
                    <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded-lg transition-all">
                      <X size={16} className="text-muted-foreground"/>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 truncate">"{listingTitle}"</p>

                  <div className="space-y-2 mb-4">
                    {REASONS.map(r => (
                      <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="radio" name="reason" value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="accent-red-500 w-4 h-4"
                        />
                        <span className={`text-sm transition-colors ${reason === r ? "text-foreground font-semibold" : "text-muted-foreground group-hover:text-foreground"}`}>{r}</span>
                      </label>
                    ))}
                  </div>

                  {reason && (
                    <textarea
                      value={detail}
                      onChange={e => setDetail(e.target.value)}
                      placeholder="Additional details (optional)..."
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none resize-none focus:border-red-400 transition-all mb-4 animate-in fade-in duration-150"
                    />
                  )}

                  <button
                    onClick={submit}
                    disabled={!reason || loading}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-40"
                  >
                    {loading ? "Submitting…" : "Submit Report"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
