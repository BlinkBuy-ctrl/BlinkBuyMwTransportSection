import { useState, useEffect } from "react";

const STEPS = [
  { label: "menu",      isMenu: true,  title: "Quick Menu ☰",             desc: "Tap the three lines for notifications, messages, settings and more." },
  { label: "Home",      isMenu: false, title: "Welcome to TransportMW 🎉", desc: "Your Home — browse all transport listings across Malawi." },
  { label: "Find Ride", isMenu: false, title: "Find a Ride 🔍",            desc: "Search and filter taxis, motorcycles, minibuses and more." },
  { label: "Post",      isMenu: false, title: "Post Your Vehicle ➕",       desc: "Driver? List your vehicle here — no account needed!" },
  { label: "Bookings",  isMenu: false, title: "Your Bookings 📋",           desc: "Track all your ride requests and their status here." },
  { label: "Dashboard", isMenu: false, title: "Dashboard 📊",               desc: "Manage listings, toggle availability and upgrade to premium." },
];

const KEY = "tmw_onboarding_done";

interface Rect { left:number; top:number; width:number; height:number; }

function getRect(s: number): Rect | null {
  let el: Element | null = null;
  if (STEPS[s].isMenu) {
    el = document.querySelector("header button.lg\\:hidden, header button[class*=\"lg:hidden\"]");
  } else {
    const items = document.querySelectorAll("nav.lg\\:hidden.fixed.bottom-0 a");
    el = items[s - 1] ?? null;
  }
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

export default function OnboardingTutorial() {
  const [step, setStep]     = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect]     = useState<Rect | null>(null);

  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    const t = setTimeout(() => { setRect(getRect(0)); setVisible(true); }, 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    // Small delay so transition feels smooth
    const t = setTimeout(() => setRect(getRect(step)), 50);
    return () => clearTimeout(t);
  }, [step, visible]);

  const next   = () => step < STEPS.length - 1 ? setStep(s => s + 1) : finish();
  const finish = () => { setVisible(false); localStorage.setItem(KEY, "1"); };

  if (!visible || !rect) return null;

  const cur     = STEPS[step];
  const isMenu  = cur.isMenu;
  const cx      = rect.left + rect.width  / 2;
  const cy      = rect.top  + rect.height / 2;

  // Hand tip touches the edge of the element
  const handSize = 32;
  const handX  = isMenu ? rect.right  + 2        : cx - handSize / 2;
  const handY  = isMenu ? rect.bottom - handSize  : rect.top - handSize - 2;
  const emoji  = isMenu ? "👉" : "👆";

  const tooltipBottom = isMenu
    ? { top: rect.bottom + 12 + "px" }
    : { bottom: window.innerHeight - rect.top + 12 + "px" };

  return (
    <>
      <style>{`
        @keyframes tmwBounceUp {
          0%,100%{ transform:translateY(0); }
          50%    { transform:translateY(-7px); }
        }
        @keyframes tmwBounceRight {
          0%,100%{ transform:translateX(0); }
          50%    { transform:translateX(7px); }
        }
        @keyframes tmwGlowPulse {
          0%,100%{ box-shadow:0 0 0 0px rgba(45,212,191,0.9), 0 0 0 0px rgba(45,212,191,0.5), 0 0 22px 6px rgba(45,212,191,0.6); }
          50%    { box-shadow:0 0 0 10px rgba(45,212,191,0.35), 0 0 0 22px rgba(45,212,191,0.12), 0 0 40px 14px rgba(45,212,191,0.8); }
        }
        .tmw-hand-up    { animation: tmwBounceUp    0.65s ease-in-out infinite; font-size:${handSize}px; line-height:1; }
        .tmw-hand-right { animation: tmwBounceRight 0.65s ease-in-out infinite; font-size:${handSize}px; line-height:1; }
        .tmw-glow       { animation: tmwGlowPulse   0.9s  ease-in-out infinite; }
      `}</style>

      {/* Dark overlay — two halves with hole in middle via clip trick */}
      {/* Top slice */}
      <div className="fixed z-[80] inset-x-0 top-0 pointer-events-none bg-black/75"
        style={{ height: rect.top - 6 }} />
      {/* Bottom slice */}
      <div className="fixed z-[80] inset-x-0 pointer-events-none bg-black/75"
        style={{ top: rect.top + rect.height + 6, bottom: 0 }} />
      {/* Left slice */}
      <div className="fixed z-[80] pointer-events-none bg-black/75"
        style={{ top: rect.top - 6, height: rect.height + 12, left: 0, width: rect.left - 6 }} />
      {/* Right slice */}
      <div className="fixed z-[80] pointer-events-none bg-black/75"
        style={{ top: rect.top - 6, height: rect.height + 12, left: rect.left + rect.width + 6, right: 0 }} />

      {/* Glow ring on the actual button */}
      <div
        className="tmw-glow fixed z-[81] rounded-xl pointer-events-none"
        style={{
          left:   rect.left  - 6,
          top:    rect.top   - 6,
          width:  rect.width + 12,
          height: rect.height + 12,
          border: "2.5px solid #2dd4bf",
          transition: "left .3s,top .3s,width .3s,height .3s",
        }}
      />

      {/* Hand emoji — precisely touching the button */}
      <div
        className={`fixed z-[82] pointer-events-none select-none ${isMenu ? "tmw-hand-right" : "tmw-hand-up"}`}
        style={{
          left: handX,
          top:  handY,
          transition: "left .35s cubic-bezier(.4,0,.2,1), top .35s cubic-bezier(.4,0,.2,1)",
          filter: "drop-shadow(0 0 8px rgba(45,212,191,1))",
        }}
      >
        {emoji}
      </div>

      {/* Tooltip */}
      <div className="fixed z-[83] left-3 right-3 pointer-events-auto" style={tooltipBottom}>
        <div className="bg-[hsl(215,58%,10%)] border border-teal-400/60 rounded-2xl p-4 shadow-2xl">

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-3">
            {STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${
                i === step ? "w-6 h-2 bg-teal-400" : "w-2 h-2 bg-white/15"
              }`}/>
            ))}
          </div>

          <p className="text-white font-black text-sm mb-1">{cur.title}</p>
          <p className="text-white/55 text-xs leading-relaxed mb-4">{cur.desc}</p>

          <div className="flex items-center justify-between gap-3">
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
