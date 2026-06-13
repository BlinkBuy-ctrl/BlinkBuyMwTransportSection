import { useState, useEffect, useCallback } from "react";

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
    // Find hamburger: any button inside header containing lg:hidden
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
  if (!r.width && !r.height) return null; // not painted yet
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

// Poll until element is found (handles slow renders & SPA navigation)
function waitForRect(s: number, cb: (r: Rect) => void) {
  let tries = 0;
  const poll = () => {
    const r = getRect(s);
    if (r) { cb(r); return; }
    if (++tries < 30) setTimeout(poll, 100); // up to 3s
  };
  poll();
}

export default function OnboardingTutorial() {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect]       = useState<Rect | null>(null);

  // Listen for custom event fired by settings page
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setRect(null);
      setVisible(false);
      // tiny delay so state resets before re-showing
      setTimeout(() => waitForRect(0, r => { setRect(r); setVisible(true); }), 120);
    };
    window.addEventListener("tmw:restart-tutorial", handler);
    return () => window.removeEventListener("tmw:restart-tutorial", handler);
  }, []);

  // First-visit check
  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    waitForRect(0, r => { setRect(r); setVisible(true); });
  }, []);

  // Update rect when step changes
  useEffect(() => {
    if (!visible) return;
    waitForRect(step, r => setRect(r));
  }, [step, visible]);

  const next   = () => step < STEPS.length - 1 ? setStep(s => s + 1) : finish();
  const finish = () => { setVisible(false); localStorage.setItem(KEY, "1"); };

  if (!visible || !rect) return null;

  const cur    = STEPS[step];
  const isMenu = cur.isMenu;
  const cx     = rect.left + rect.width  / 2;
  const HS     = 32; // hand size px

  const handX = isMenu ? rect.right + 2      : cx - HS / 2;
  const handY = isMenu ? rect.bottom - HS     : rect.top - HS - 4;
  const emoji = isMenu ? "👉"                : "👆";

  const tooltipStyle: React.CSSProperties = isMenu
    ? { top: rect.bottom + 14 + "px", left: "12px", right: "12px" }
    : { bottom: window.innerHeight - rect.top + 14 + "px", left: "12px", right: "12px" };

  return (
    <>
      <style>{`
        @keyframes tmwUp    { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-8px)} }
        @keyframes tmwRight { 0%,100%{transform:translateX(0)}  50%{transform:translateX(8px)}  }
        @keyframes tmwGlow  {
          0%,100%{ box-shadow:0 0 0 0px rgba(45,212,191,.9), 0 0 16px 4px rgba(45,212,191,.5); }
          50%    { box-shadow:0 0 0 12px rgba(45,212,191,.2), 0 0 40px 16px rgba(45,212,191,.8); }
        }
        .tmw-up    { animation: tmwUp    .65s ease-in-out infinite; }
        .tmw-right { animation: tmwRight .65s ease-in-out infinite; }
        .tmw-glow  { animation: tmwGlow  .9s  ease-in-out infinite; }
      `}</style>

      {/* 4-slice overlay leaving a clean hole over the target */}
      <div className="fixed z-[80] inset-x-0 top-0 bg-black/75 pointer-events-none"
           style={{ height: Math.max(0, rect.top - 6) }} />
      <div className="fixed z-[80] inset-x-0 bg-black/75 pointer-events-none"
           style={{ top: rect.top + rect.height + 6, bottom: 0 }} />
      <div className="fixed z-[80] bg-black/75 pointer-events-none"
           style={{ top: rect.top - 6, height: rect.height + 12, left: 0, width: Math.max(0, rect.left - 6) }} />
      <div className="fixed z-[80] bg-black/75 pointer-events-none"
           style={{ top: rect.top - 6, height: rect.height + 12, left: rect.left + rect.width + 6, right: 0 }} />

      {/* Animated glow ring around target */}
      <div className="tmw-glow fixed z-[81] rounded-xl pointer-events-none"
           style={{
             left: rect.left - 6, top: rect.top - 6,
             width: rect.width + 12, height: rect.height + 12,
             border: "2.5px solid #2dd4bf",
             transition: "left .3s,top .3s,width .3s,height .3s",
           }} />

      {/* Hand */}
      <div className={`fixed z-[82] pointer-events-none select-none ${isMenu ? "tmw-right" : "tmw-up"}`}
           style={{
             fontSize: HS, lineHeight: 1,
             left: handX, top: handY,
             transition: "left .35s cubic-bezier(.4,0,.2,1), top .35s cubic-bezier(.4,0,.2,1)",
             filter: "drop-shadow(0 0 10px rgba(45,212,191,1))",
           }}>
        {emoji}
      </div>

      {/* Tooltip card */}
      <div className="fixed z-[83] pointer-events-auto" style={tooltipStyle}>
        <div className="bg-[hsl(215,58%,10%)] border border-teal-400/60 rounded-2xl p-4 shadow-2xl">
          <div className="flex gap-1.5 mb-3">
            {STEPS.map((_,i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${
                i === step ? "w-6 h-2 bg-teal-400" : "w-2 h-2 bg-white/15"
              }`}/>
            ))}
          </div>
          <p className="text-white font-black text-sm mb-1">{cur.title}</p>
          <p className="text-white/55 text-xs leading-relaxed mb-4">{cur.desc}</p>
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
