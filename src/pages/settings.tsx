import { useState } from "react";
import { Download, BookOpen, X, ChevronRight, Shield, Moon, Sun, Trash2, AlertTriangle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { getLanguage, setLanguage } from "@/lib/auth";
import { getIdentitySync, clearIdentity } from "@/lib/identity";
import { usePWA } from "@/hooks/usePWA";

const TUTORIAL_STEPS = [
  { icon:"🚗", title:"Find a Ride",    desc:"Search by city, vehicle type, or route. Filter by availability, sort by rating or price — no account needed." },
  { icon:"📋", title:"Post a Listing", desc:"Tap 'Post Route' and fill in your vehicle details, route, and price. Your listing goes live instantly, tied to this device." },
  { icon:"📅", title:"Book a Driver",  desc:"On any listing, tap 'Book Now' and fill in your trip details. You'll get a live booking tracker to follow your ride status." },
  { icon:"💬", title:"Contact Direct", desc:"Every listing shows WhatsApp and phone contacts. Chat directly with drivers to confirm details and payment." },
  { icon:"⭐", title:"Rate Your Ride", desc:"After a completed trip, the booking tracker shows a one-tap rating form. Your feedback helps future passengers." },
];

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, install } = usePWA();
  const [lang, setLang] = useState<"en"|"ny">(getLanguage());
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const identity = getIdentitySync();

  const handleLangChange = (l: "en"|"ny") => {
    if (l === "ny") {
      alert("Chichewa translation coming soon!");
      return;
    }
    setLang(l);
    setLanguage(l);
  };

  const handleInstall = async () => {
    if (isInstallable) {
      await install();
    } else {
      alert("To install: open browser menu → 'Add to Home Screen'");
    }
  };

  const handleResetIdentity = () => {
    clearIdentity();
    setShowResetConfirm(false);
    alert("Device identity cleared. Your listings are no longer manageable from this device. The listings still exist but cannot be edited or deleted.");
    window.location.reload();
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-black mb-6">Settings</h1>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowTutorial(false)}>
          <div className="bg-card border border-card-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base">How to Use TransportMW</h3>
              <button onClick={() => setShowTutorial(false)} className="p-1 hover:bg-muted rounded-lg transition-all">
                <X size={16} className="text-muted-foreground"/>
              </button>
            </div>
            <div className="flex gap-1 mb-5">
              {TUTORIAL_STEPS.map((_,i) => (
                <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= tutorialStep ? "bg-teal-600" : "bg-muted"}`}/>
              ))}
            </div>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{TUTORIAL_STEPS[tutorialStep].icon}</div>
              <h4 className="font-black text-lg mb-2">{TUTORIAL_STEPS[tutorialStep].title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{TUTORIAL_STEPS[tutorialStep].desc}</p>
            </div>
            <div className="flex gap-3">
              {tutorialStep > 0 && (
                <button onClick={() => setTutorialStep(s => s-1)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-all">Back</button>
              )}
              {tutorialStep < TUTORIAL_STEPS.length-1 ? (
                <button onClick={() => setTutorialStep(s => s+1)}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-500 transition-all flex items-center justify-center gap-1">
                  Next <ChevronRight size={14}/>
                </button>
              ) : (
                <button onClick={() => { setShowTutorial(false); setTutorialStep(0); }}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-500 transition-all">Done 🎉</button>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">Step {tutorialStep+1} of {TUTORIAL_STEPS.length}</p>
          </div>
        </div>
      )}

      {/* Identity info */}
      <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Shield size={15} className="text-green-500"/> Anonymous Identity
        </h2>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          No account is needed. Your listings are automatically tied to this device using a secure anonymous token stored in your browser.
        </p>
        <div className="bg-muted rounded-lg px-3 py-2 mb-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Device Token</div>
          <div className="text-xs font-mono text-foreground break-all">{identity?.token ?? "Not yet generated"}</div>
        </div>
        <div className="text-[10px] text-muted-foreground">
          Generated: {identity?.createdAt ? new Date(identity.createdAt).toLocaleDateString() : "—"}
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
        <h2 className="text-sm font-bold mb-4">App Settings</h2>

        {/* Dark mode */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium">Dark Mode</div>
            <div className="text-xs text-muted-foreground">Switch between light and dark theme</div>
          </div>
          <button onClick={toggleTheme}
            className={`w-12 h-6 rounded-full transition-all relative ${theme === "dark" ? "bg-teal-600" : "bg-muted"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${theme === "dark" ? "left-6" : "left-0.5"}`}/>
          </button>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium">Language</div>
            <div className="text-xs text-muted-foreground">English or Chichewa</div>
          </div>
          <div className="flex rounded-lg border border-input overflow-hidden">
            <button onClick={() => handleLangChange("en")}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${lang==="en" ? "bg-teal-600 text-white" : "text-foreground hover:bg-muted"}`}>
              English
            </button>
            <button onClick={() => handleLangChange("ny")}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${lang==="ny" ? "bg-teal-600 text-white" : "text-foreground hover:bg-muted"}`}>
              Chichewa
            </button>
          </div>
        </div>

        {/* Tutorial */}
        <div className="flex items-center justify-between mb-4 pt-3 border-t border-border">
          <div>
            <div className="text-sm font-medium">How to Use TransportMW</div>
            <div className="text-xs text-muted-foreground">Step-by-step guide</div>
          </div>
          <button onClick={() => { localStorage.removeItem("tmw_onboarding_done"); window.dispatchEvent(new Event("tmw:restart-tutorial")); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-500 text-teal-600 text-xs font-semibold hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all">
            <BookOpen size={13}/> Tutorial
          </button>
        </div>

        {/* Install */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <div className="text-sm font-medium">Install App</div>
            <div className="text-xs text-muted-foreground">Add TransportMW to your home screen</div>
          </div>
          <button onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-500 transition-all active:scale-95">
            <Download size={13}/> Install
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-5">
        <h2 className="text-sm font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
          <AlertTriangle size={14}/> Danger Zone
        </h2>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Clearing your device identity will unlink you from all your listings. The listings will remain live but you won't be able to edit or delete them.
        </p>
        {!showResetConfirm ? (
          <button onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all">
            <Trash2 size={13}/> Clear Device Identity
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-bold text-red-700 dark:text-red-400">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-all">
                Cancel
              </button>
              <button onClick={handleResetIdentity}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition-all active:scale-95">
                Yes, Clear Identity
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
