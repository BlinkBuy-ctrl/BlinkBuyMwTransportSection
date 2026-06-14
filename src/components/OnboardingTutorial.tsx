import { useState, useEffect } from "react";

const STEPS = [
  { label: "menu",      isMenu: true,  title: "Quick Menu ☰",              desc: "Tap the three lines for notifications, messages, settings and more." },
  { label: "Home",      isMenu: false, title: "Welcome to TransportMW 🎉", desc: "Your Home — browse all transport listings across Malawi." },
  { label: "Find Ride", isMenu: false, title: "Find a Ride 🔍",             desc: "Search and filter taxis, motorcycles, minibuses and more." },
  { label: "Post",      isMenu: false, title: "Post Your Vehicle ➕",        desc: "Driver? List your vehicle here — no account needed!" },
  { label: "Bookings",  isMenu: false, title: "Your Bookings 📋",            desc: "Track all your ride requests and their status here." },
  { label: "Dashboard", isMenu: false, title: "Dashboard 📊",                desc: "Manage listings, toggle availability and upgrade to premium." },
];

export const KEY = "tmw_onboarding_done";
interface Rect { left:number; top:number; width:number; height:number; }

function getRect(s: number): Rect | null {
  let el: Element | null = null;
  if (STEPS[s].isMenu) {
    el = Array.from(document.querySelectorAll("header button"))
      .find(b => b.className.includes("lg:hidden")) ?? null;
  } else {
    const items = Array.from(document.querySelectorAll("nav a")).filter(a =>
      a.closest("nav")?.className.includes("bottom-0")
    );
    el = items[s - 1] ?? null;
  }
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function waitForRect(s: number, cb: (r: Rect) => void) {
  let tries = 0;
  const poll = () => {
    const r = getRect(s);
    if (r) { cb(r); return; }
    if (++tries < 30) setTimeout(poll, 100);
  };
  poll();
}

export default function OnboardingTutorial() {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect]       = useState<Rect | null>(null);

  useEffect(() => {
    const handler = () => {
      setStep(0); setRect(null); setVisible(false);
      setTimeout(() => waitForRect(0, r => { setRect(r); setVisible(true); }), 300);
    };
    window.addEventListener("tmw:restart-tutorial", handler);
    return () => window.removeEventListener("tmw:restart-tutorial", handler);
  }, []);

  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    waitForRect(0, r => { setRect(r); setVisible(true); });
  }, []);

  useEffect(() => {
    if (!visible) return;
    waitForRect(step, r => setRect(r));
  }, [step, visible]);

  const next   = () => step < STEPS.length - 1 ? setStep(s => s + 1) : finish();
  const finish = () => { setVisible(false); localStorage.setItem(KEY, "1"); };

  if (!visible || !rect) return null;

  const cur     = STEPS[step];
  const isMenu  = cur.isMenu;
  const W       = window.innerWidth;
  const H       = window.innerHeight;
  const cx      = rect.left + rect.width  / 2;
  const cy      = rect.top  + rect.height / 2;

  // ── Tooltip placement ──────────────────────────────────────────────────────
  // Menu button (top-right): tooltip below-left, arrow points UP-RIGHT
  // Nav buttons (bottom bar): tooltip ABOVE, positioned left/center/right
  // depending on which nav item so it never goes off-screen
  const PAD = 12;

  let tooltipStyle: React.CSSProperties;
  // Arrow direction: which side of the tooltip card the pointer tip comes from
  // "top" = arrow on top edge  "bottom" = arrow on bottom  "left" / "right"
  let arrowSide: "top"|"bottom"|"left"|"right" = "bottom";
  // Arrow horizontal offset within the card (% from left, for top/bottom arrows)
  let arrowOffsetPct = 50; // default center

  if (isMenu) {
    // Tooltip below the header bar, left-aligned, arrow top-right
    tooltipStyle = { top: rect.bottom + 10, left: PAD, right: PAD };
    arrowSide = "top";
    // arrow offset: roughly where the menu button is relative to card width
    const cardW = W - PAD * 2;
    arrowOffsetPct = Math.min(90, Math.max(10, ((cx - PAD) / cardW) * 100));
  } else {
    // Tooltip above the nav bar
    const cardBottom = rect.top - 10;
    tooltipStyle = { bottom: H - cardBottom, left: PAD, right: PAD };
    arrowSide = "bottom";
    // horizontal offset aligns arrow with button center
    const cardW = W - PAD * 2;
    arrowOffsetPct = Math.min(90, Math.max(10, ((cx - PAD) / cardW) * 100));
  }

  // ── Arrow SVG (16×10, points toward the target) ───────────────────────────
  const ARROW_COLOR = "#2dd4bf";
  const arrowUp = (
    // triangle pointing UP (for top arrow — toward menu button above)
    <svg width="24" height="14" viewBox="0 0 24 14" fill="none" style={{
      position:"absolute", top:-13, left:`calc(${arrowOffsetPct}% - 12px)`,
      filter:"drop-shadow(0 -2px 4px rgba(45,212,191,.6))"
    }}>
      <polygon points="12,0 24,14 0,14" fill={ARROW_COLOR}/>
    </svg>
  );
  const arrowDown = (
    // triangle pointing DOWN (for bottom arrow — toward nav bar below)
    <svg width="24" height="14" viewBox="0 0 24 14" fill="none" style={{
      position:"absolute", bottom:-13, left:`calc(${arrowOffsetPct}% - 12px)`,
      filter:"drop-shadow(0 2px 4px rgba(45,212,191,.6))"
    }}>
      <polygon points="12,14 24,0 0,0" fill={ARROW_COLOR}/>
    </svg>
  );

  return (
    <>
      <style>{`
        @keyframes tmwGlow {
          0%,100%{ box-shadow:0 0 0 0px rgba(45,212,191,.9),0 0 16px 4px rgba(45,212,191,.5); }
          50%    { box-shadow:0 0 0 10px rgba(45,212,191,.2),0 0 32px 12px rgba(45,212,191,.7); }
        }
        @keyframes tmwBounce {
          0%,100%{ transform:translateY(0); }
          50%    { transform:translateY(-5px); }
        }
        .tmw-glow   { animation: tmwGlow   1s ease-in-out infinite; }
        .tmw-bounce { animation: tmwBounce .7s ease-in-out infinite; }
      `}</style>

      {/* 4-slice overlay */}
      <div className="fixed inset-x-0 top-0 bg-black/60 pointer-events-none" style={{zIndex:80, height:Math.max(0,rect.top-6)}}/>
      <div className="fixed inset-x-0 bg-black/60 pointer-events-none"       style={{zIndex:80, top:rect.top+rect.height+6, bottom:0}}/>
      <div className="fixed bg-black/60 pointer-events-none"                  style={{zIndex:80, top:rect.top-6, height:rect.height+12, left:0, width:Math.max(0,rect.left-6)}}/>
      <div className="fixed bg-black/60 pointer-events-none"                  style={{zIndex:80, top:rect.top-6, height:rect.height+12, left:rect.left+rect.width+6, right:0}}/>

      {/* Glow ring around target */}
      <div className="tmw-glow fixed rounded-xl pointer-events-none" style={{
        zIndex:81,
        left:rect.left-6, top:rect.top-6,
        width:rect.width+12, height:rect.height+12,
        border:"2.5px solid #2dd4bf",
        transition:"left .3s,top .3s,width .3s,height .3s",
      }}/>

      {/* Tooltip card with built-in arrow */}
      <div className="fixed pointer-events-auto" style={{...tooltipStyle, zIndex:90}}>
        <div className="relative bg-[hsl(215,58%,10%)] border border-teal-400/60 rounded-2xl p-4 shadow-2xl">
          {/* Arrow pointer */}
          {arrowSide === "top"    && arrowUp}
          {arrowSide === "bottom" && <div className="tmw-bounce" style={{position:"absolute",bottom:-13,left:`calc(${arrowOffsetPct}% - 12px)`}}>
            <svg width="24" height="14" viewBox="0 0 24 14" fill="none" style={{filter:"drop-shadow(0 2px 6px rgba(45,212,191,.8))"}}>
              <polygon points="12,14 24,0 0,0" fill={ARROW_COLOR}/>
            </svg>
          </div>}
          {arrowSide === "top" && <div className="tmw-bounce" style={{position:"absolute",top:-13,left:`calc(${arrowOffsetPct}% - 12px)`}}>
            <svg width="24" height="14" viewBox="0 0 24 14" fill="none" style={{filter:"drop-shadow(0 -2px 6px rgba(45,212,191,.8))"}}>
              <polygon points="12,0 24,14 0,14" fill={ARROW_COLOR}/>
            </svg>
          </div>}

          {/* Step dots */}
          <div className="flex gap-1.5 mb-3">
            {STEPS.map((_,i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${
                i===step ? "w-6 h-2 bg-teal-400" : "w-2 h-2 bg-white/20"
              }`}/>
            ))}
          </div>

          <p className="text-white font-black text-sm mb-1">{cur.title}</p>
          <p className="text-white/70 text-xs leading-relaxed mb-4">{cur.desc}</p>

          <div className="flex items-center gap-3">
            <button onClick={finish}
              className="text-xs text-white/50 border border-white/15 px-3 py-2 rounded-xl hover:text-white hover:border-white/30 transition-all active:scale-95 font-semibold">
              Skip tutorial
            </button>
            <button onClick={next}
              className="flex-1 text-xs font-black bg-teal-600 hover:bg-teal-500 text-white py-2 rounded-xl transition-all active:scale-95">
              {step < STEPS.length - 1 ? "Next →" : "Got it ✓"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
