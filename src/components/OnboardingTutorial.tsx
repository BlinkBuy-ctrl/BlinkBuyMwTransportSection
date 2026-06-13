import { useState, useEffect } from "react";

const STEPS = [
  {
    label: "menu",
    isMenu: true,
    title: "Quick Menu ☰",
    desc: "Tap the three lines for more — notifications, messages, settings and more.",
  },
  {
    label: "Home",
    isMenu: false,
    title: "Welcome to TransportMW! 🎉",
    desc: "Your Home — browse all transport listings across Malawi.",
  },
  {
    label: "Find Ride",
    isMenu: false,
    title: "Find a Ride 🔍",
    desc: "Search and filter taxis, motorcycles, minibuses and more near you.",
  },
  {
    label: "Post",
    isMenu: false,
    title: "Post Your Vehicle ➕",
    desc: "Are you a driver? List your vehicle here — no account needed!",
  },
  {
    label: "Bookings",
    isMenu: false,
    title: "Your Bookings 📋",
    desc: "Track all your ride requests and their status here.",
  },
  {
    label: "Dashboard",
    isMenu: false,
    title: "Dashboard 📊",
    desc: "Manage listings, toggle availability and upgrade to premium.",
  },
];

const KEY = "tmw_onboarding_done";

interface Rect { left: number; top: number; width: number; height: number; }

export default function OnboardingTutorial() {
  const [step, setStep]     = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect]     = useState<Rect | null>(null);

  // Measure target element for current step
  const measure = (s: number) => {
    let el: Element | null = null;
    if (STEPS[s].isMenu) {
      el = document.querySelector("header button.lg\\:hidden");
    } else {
      const nav  = document.querySelector("nav.lg\\:hidden.fixed.bottom-0");
      const navItems = nav ? Array.from(nav.querySelectorAll("a")) : [];
      // nav items order: Home(0) FindRide(1) Post(2) Bookings(3) Dashboard(4)
      // step 1=Home→index 0, step 2=FindRide→index 1, etc.
      el = navItems[s - 1] ?? null;
    }
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  };

  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    const t = setTimeout(() => {
      const r = measure(0);
      setRect(r);
      setVisible(true);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    setRect(measure(step));
  }, [step, visible]);

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  };

  const finish = () => {
    setVisible(false);
    localStorage.setItem(KEY, "1");
  };

  if (!visible || !rect) return null;

  const cur       = STEPS[step];
  const isMenu    = cur.isMenu;
  const cx        = rect.left + rect.width  / 2;  // center x of target
  const cy        = rect.top  + rect.height / 2;  // center y of target

  // Hand sits just outside the target, pointing at it
  // Menu = top-right → hand below it pointing up (👆 flipped)
  // Bottom nav → hand above it pointing down (👇)
  const handX     = cx - 16;
  const handY     = isMenu ? rect.top + rect.height + 4 : rect.top - 44;
  const handEmoji = isMenu ? "👇" : "👆";

  // Tooltip: below header for menu, above bottom nav for rest
  const tooltipStyle = isMenu
    ? { top:    rect.top + rect.height + 60 + "px", left: "16px", right: "16px" }
    : { bottom: (window.innerHeight - rect.top + 16) + "px", left: "16px", right: "16px" };

  return (
    <>
      <style>{`
        @keyframes obHandBounce {
          0%,100% { transform: translateY(0);   }
          50%      { transform: translateY(6px); }
        }
        @keyframes obPulseRing {
          0%   { transform: scale(1);   opacity: .8; }
          100% { transform: scale(2.2); opacity: 0;  }
        }
        .ob-hand { animation: obHandBounce 0.75s ease-in-out infinite; }
        .ob-ring  { animation: obPulseRing  1.1s ease-out  infinite; }
      `}</style>

      {/* ── Full-screen dark overlay — clicks pass through except tooltip ── */}
      <div className="fixed inset-0 z-[80]" style={{ background: "rgba(0,0,0,0.72)" }} />

      {/* ── Spotlight: clear hole over target element ── */}
      <div
        className="fixed z-[81] rounded-xl pointer-events-none"
        style={{
          left:   rect.left  - 8,
          top:    rect.top   - 8,
          width:  rect.width + 16,
          height: rect.height + 16,
          background: "transparent",
          // Cut hole in overlay using mix-blend-mode trick via box-shadow
          boxShadow: `
            0 0 0 9999px rgba(0,0,0,0.72),
            0 0 0 3px #2dd4bf,
            0 0 18px 4px rgba(45,212,191,0.55)
          `,
        }}
      />

      {/* ── Teal pulse ring centred on target ── */}
      <div
        className="ob-ring fixed z-[82] rounded-full pointer-events-none"
        style={{
          width:  rect.width  * 0.6,
          height: rect.width  * 0.6,
          left:   cx - (rect.width * 0.3),
          top:    cy - (rect.width * 0.3),
          background: "rgba(45,212,191,0.35)",
        }}
      />

      {/* ── Animated hand ── */}
      <div
        className="ob-hand fixed z-[83] pointer-events-none select-none"
        style={{
          fontSize: 28,
          left: handX,
          top:  handY,
          transition: "left 0.35s cubic-bezier(.4,0,.2,1), top 0.35s cubic-bezier(.4,0,.2,1)",
          filter: "drop-shadow(0 2px 10px rgba(45,212,191,0.8))",
        }}
      >
        {handEmoji}
      </div>

      {/* ── Tooltip card ── */}
      <div className="fixed z-[84] pointer-events-auto" style={tooltipStyle}>
        <div className="bg-[hsl(215,55%,11%)] border border-teal-500/50 rounded-2xl p-4 shadow-2xl">

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-3">
            {STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${
                i === step ? "w-5 h-2 bg-teal-400" : "w-2 h-2 bg-white/15"
              }`}/>
            ))}
          </div>

          <p className="text-white font-black text-sm mb-1">{cur.title}</p>
          <p className="text-white/55 text-xs leading-relaxed mb-4">{cur.desc}</p>

          <div className="flex items-center justify-between">
            {/* Skip — prominent so users know it's there */}
            <button
              onClick={finish}
              className="text-xs text-white/40 border border-white/10 px-3 py-1.5 rounded-lg hover:text-white hover:border-white/30 transition-all active:scale-95"
            >
              Skip tutorial
            </button>
            <button
              onClick={next}
              className="text-xs font-black bg-teal-600 hover:bg-teal-500 text-white px-4 py-1.5 rounded-xl transition-all active:scale-95"
            >
              {step < STEPS.length - 1 ? "Next →" : "Got it ✓"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
