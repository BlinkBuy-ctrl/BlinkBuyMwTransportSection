import { useState, useEffect, useRef } from "react";
import { Home, Search, Plus, BookOpen, LayoutDashboard } from "lucide-react";

const STEPS = [
  {
    label: "menu",
    icon: null,
    index: -1, // special — targets header menu button
    title: "Quick Menu ☰",
    desc: "Tap the menu icon for more options — notifications, messages, settings and more.",
  },
  {
    label: "Home",
    icon: Home,
    index: 0,
    title: "Welcome to TransportMW! 🎉",
    desc: "This is your Home — see all available transport listings across Malawi.",
  },
  {
    label: "Find Ride",
    icon: Search,
    index: 1,
    title: "Find a Ride 🔍",
    desc: "Search and filter taxis, motorcycles, minibuses and more near you.",
  },
  {
    label: "Post",
    icon: Plus,
    index: 2,
    title: "Post Your Vehicle ➕",
    desc: "Are you a driver? List your vehicle here — no account needed!",
  },
  {
    label: "Bookings",
    icon: BookOpen,
    index: 3,
    title: "Your Bookings 📋",
    desc: "Track all your ride requests and their status here.",
  },
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    index: 4,
    title: "Dashboard 📊",
    desc: "Manage your listings, toggle availability and upgrade to premium.",
  },
];

const STORAGE_KEY = "tmw_onboarding_done";

export default function OnboardingTutorial() {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [navRects, setNavRects] = useState<DOMRect[]>([]);
  const [handPos, setHandPos]   = useState({ x: 0, y: 0 });
  const [animating, setAnimating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Small delay so nav renders first
    const t = setTimeout(() => {
      measureNav();
      setVisible(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const measureNav = () => {
    // Hamburger button — button with lg:hidden class in header
    const menuBtn = document.querySelector("header button.lg\\:hidden");
    const nav = document.querySelector("nav.lg\\:hidden.fixed.bottom-0");
    if (!nav) return;
    const navItems = Array.from(nav.querySelectorAll("a")).map(el => el.getBoundingClientRect());
    const menuRect = menuBtn ? menuBtn.getBoundingClientRect() : navItems[0];
    // index -1 maps to slot 0 in rects array; nav items follow
    const rects = [menuRect, ...navItems];
    setNavRects(rects);
    if (rects[0]) setHandPos({ x: rects[0].left + rects[0].width / 2, y: rects[0].top + rects[0].height + 10 });
  };

  useEffect(() => {
    if (!visible || navRects.length === 0) return;
    const rect = navRects[step];
    if (!rect) return;
    setAnimating(true);
    // Step 0 = hamburger (top) — hand points down; rest = bottom nav — hand points up
    const isMenuStep = step === 0;
    setHandPos({
      x: rect.left + rect.width / 2,
      y: isMenuStep ? rect.bottom + 6 : rect.top - 10,
    });
    const t = setTimeout(() => setAnimating(false), 400);
    return () => clearTimeout(t);
  }, [step, visible, navRects]);

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 z-[80] pointer-events-none"
        style={{ background: "rgba(0,0,0,0.65)" }}
      />

      {/* Spotlight cutout on current nav item */}
      {navRects[step] && (
        <div
          className="fixed z-[81] pointer-events-none rounded-2xl transition-all duration-400"
          style={{
            left:   navRects[step].left   - 6,
            top:    navRects[step].top    - 6,
            width:  navRects[step].width  + 12,
            height: navRects[step].height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 3px #2dd4bf",
            background: "transparent",
          }}
        />
      )}

      {/* Animated hand pointer */}
      <div
        className="fixed z-[83] pointer-events-none select-none text-3xl"
        style={{
          left:       handPos.x - 16,
          top:        step === 0 ? handPos.y : handPos.y - 40,
          transition: "left 0.4s cubic-bezier(0.4,0,0.2,1), top 0.4s cubic-bezier(0.4,0,0.2,1)",
          animation:  step === 0 ? "handTapDown 0.9s ease-in-out infinite" : "handTap 0.9s ease-in-out infinite",
          filter:     "drop-shadow(0 2px 8px rgba(45,212,191,0.7))",
          transform:  step === 0 ? "scaleY(-1)" : "none",
        }}
      >
        👆
      </div>

      {/* Tooltip card */}
      <div
        className="fixed z-[84] left-4 right-4 pointer-events-auto"
        style={step === 0 ? { top: "70px" } : { bottom: "90px" }}
      >
        <div className="bg-[hsl(215,55%,12%)] border border-teal-500/40 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-3 duration-300">

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-3">
            {STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${
                i === step ? "w-4 h-1.5 bg-teal-400" : "w-1.5 h-1.5 bg-white/20"
              }`}/>
            ))}
          </div>

          <p className="text-white font-black text-sm mb-1">{current.title}</p>
          <p className="text-white/60 text-xs leading-relaxed mb-4">{current.desc}</p>

          <div className="flex items-center justify-between">
            <button onClick={finish} className="text-white/30 text-xs hover:text-white/60 transition-all">
              Skip
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              {step < STEPS.length - 1 ? "Next →" : "Got it ✓"}
            </button>
          </div>
        </div>
      </div>

      {/* Hand tap keyframe */}
      <style>{`
        @keyframes handTap {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(6px) scale(0.92); }
        }
        @keyframes handTapDown {
          0%, 100% { transform: scaleY(-1) translateY(0) scale(1); }
          50%       { transform: scaleY(-1) translateY(-6px) scale(0.92); }
        }
      `}</style>
    </>
  );
}
