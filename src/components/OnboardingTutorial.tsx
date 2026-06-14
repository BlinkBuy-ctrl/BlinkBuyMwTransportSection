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

function getEl(s: number): Element | null {
  if (STEPS[s].isMenu) {
    return Array.from(document.querySelectorAll("header button"))
      .find(b => b.className.includes("lg:hidden")) ?? null;
  }
  const items = Array.from(document.querySelectorAll("nav a")).filter(a =>
    a.closest("nav")?.className.includes("bottom-0")
  );
  return items[s - 1] ?? null;
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

  // Auto-advance when the highlighted button is tapped
  useEffect(() => {
    if (!visible) return;
    const el = getEl(step);
    if (!el) return;
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      step < STEPS.length - 1 ? setStep(s => s + 1) : finish();
    };
    el.addEventListener("click", handler, true);
    return () => el.removeEventListener("click", handler, true);
  }, [step, visible]);

  const next   = () => step < STEPS.length - 1 ? setStep(s => s + 1) : finish();
  const finish = () => { setVisible(false); localStorage.setItem(KEY, "1"); };

  if (!visible || !rect) return null;

  const cur    = STEPS[step];
  const isMenu = cur.isMenu;
  const W      = window.innerWidth;
  const H      = window.innerHeight;
  const cx     = rect.left + rect.width  / 2;
  const PAD    = 12;
  const GAP    = 14; // gap between emoji and tooltip card
  const HS     = 38; // emoji size px

  // Emoji position:
  // menu  → right of button, pointing left (👈), vertically centred
  // nav   → above button, pointing down (👇), horizontally centred
  const emojiStyle: React.CSSProperties = isMenu
    ? {
        left:  rect.right + 8,
        top:   rect.top + rect.height / 2 - HS / 2,
        fontSize: HS,
      }
    : {
        left:  cx - HS / 2,
        top:   rect.top - HS - 6,
        fontSize: HS,
      };
  const emojiChar = isMenu ? "👈" : "👇";
  const emojiAnim = isMenu ? "tmw-right" : "tmw-up";

  // Tooltip card:
  // menu  → below header, full width
  // nav   → above nav bar, full width; arrow offset tracks button cx
  const cardW = W - PAD * 2;
  const arrowPct = Math.min(88, Math.max(12, ((cx - PAD) / cardW) * 100));

  const tooltipStyle: React.CSSProperties = isMenu
    ? { top:    rect.bottom + HS + GAP,       left: PAD, right: PAD }
    : { bottom: H - (rect.top - HS - GAP - 6), left: PAD, right: PAD };

  const ARROW = "#2dd4bf";

  return (
    <>
      <style>{`
        @keyframes tmwUp    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes tmwRight { 0%,100%{transform:translateX(0)} 50%{transform:translateX(7px)}  }
        @keyframes tmwGlow  {
          0%,100%{ box-shadow:0 0 0 0px rgba(45,212,191,.9),0 0 16px 4px rgba(45,212,191,.5); }
          50%    { box-shadow:0 0 0 10px rgba(45,212,191,.2),0 0 32px 12px rgba(45,212,191,.7); }
        }
        .tmw-up    { animation: tmwUp    .7s ease-in-out infinite; }
        .tmw-right { animation: tmwRight .7s ease-in-out infinite; }
        .tmw-glow  { animation: tmwGlow  1s  ease-in-out infinite; }
      `}</style>

      {/* 4-slice overlay */}
      <div className="fixed inset-x-0 top-0 bg-black/60 pointer-events-none" style={{zIndex:80,height:Math.max(0,rect.top-6)}}/>
      <div className="fixed inset-x-0 bg-black/60 pointer-events-none"       style={{zIndex:80,top:rect.top+rect.height+6,bottom:0}}/>
      <div className="fixed bg-black/60 pointer-events-none"                  style={{zIndex:80,top:rect.top-6,height:rect.height+12,left:0,width:Math.max(0,rect.left-6)}}/>
      <div className="fixed bg-black/60 pointer-events-none"                  style={{zIndex:80,top:rect.top-6,height:rect.height+12,left:rect.left+rect.width+6,right:0}}/>

      {/* Glow ring */}
      <div className="tmw-glow fixed rounded-xl pointer-events-none" style={{
        zIndex:81,
        left:rect.left-6, top:rect.top-6,
        width:rect.width+12, height:rect.height+12,
        border:"2.5px solid #2dd4bf",
        transition:"left .3s,top .3s,width .3s,height .3s",
      }}/>

      {/* Emoji — sits between button and tooltip, z-95, ABOVE overlay but below tooltip */}
      <div
        className={`fixed pointer-events-none select-none ${emojiAnim}`}
        style={{
          ...emojiStyle,
          zIndex: 95,
          lineHeight: 1,
          transition: "left .3s,top .3s",
        }}
      >
        {emojiChar}
      </div>

      {/* Tooltip card — z-90 (BELOW emoji so emoji is never covered) */}
      <div className="fixed pointer-events-auto" style={{...tooltipStyle, zIndex:90}}>
        <div className="relative bg-[hsl(215,58%,10%)] border border-teal-400/60 rounded-2xl p-4 shadow-2xl">

          {/* Arrow pointing toward button */}
          {isMenu ? (
            // Arrow on TOP of card pointing up toward menu button
            <div style={{position:"absolute",top:-13,left:`calc(${arrowPct}% - 12px)`}}>
              <svg width="24" height="13" viewBox="0 0 24 13" fill="none">
                <polygon points="12,0 24,13 0,13" fill={ARROW}/>
              </svg>
            </div>
          ) : (
            // Arrow on BOTTOM of card pointing down toward nav button
            <div style={{position:"absolute",bottom:-13,left:`calc(${arrowPct}% - 12px)`}}>
              <svg width="24" height="13" viewBox="0 0 24 13" fill="none">
                <polygon points="12,13 24,0 0,0" fill={ARROW}/>
              </svg>
            </div>
          )}

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
