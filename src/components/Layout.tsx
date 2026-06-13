import { useState, useEffect, memo } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/hooks/useTheme";
import { usePWA } from "@/hooks/usePWA";
import {
  Home, Search, Plus, LayoutDashboard, Sun, Moon,
  Menu, X, Car, Download, MessageCircle, Shield,
  Bell, BookOpen, Settings
} from "lucide-react";
import SOSOverlay from "@/components/SOSOverlay";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import OfflineBanner from "@/components/OfflineBanner";

const BOTTOM_NAV = [
  { label: "Home",       href: "/",              icon: Home },
  { label: "Find Ride",  href: "/transport",     icon: Search },
  { label: "Post",       href: "/post-transport", icon: Plus, highlight: true },
  { label: "Bookings",   href: "/bookings",      icon: BookOpen },
  { label: "Dashboard",  href: "/dashboard",     icon: LayoutDashboard },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, install } = usePWA();
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    if (!isInstallable) return;
    if (sessionStorage.getItem("pwa_banner_dismissed")) return;
    const t = setTimeout(() => setShowInstallBanner(true), 12_000);
    return () => clearTimeout(t);
  }, [isInstallable]);

  useEffect(() => {
    setPageVisible(false);
    const t = setTimeout(() => setPageVisible(true), 80);
    setOpen(false);
    return () => clearTimeout(t);
  }, [loc]);

  const dismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("pwa_banner_dismissed", "1");
  };

  const isActive = (href: string) =>
    href === "/" ? loc === "/" || loc === "" : loc.startsWith(href);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-20 left-4 right-4 z-[60] md:bottom-6 md:left-auto md:right-6 md:w-80 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[hsl(215,55%,12%)] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shrink-0">
              <Car size={18} className="text-white"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">Install TransportMW</p>
              <p className="text-white/50 text-xs mt-0.5">Fast access — works offline too</p>
              <div className="flex gap-2 mt-2.5">
                <button onClick={async () => { await install(); setShowInstallBanner(false); }}
                  className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95">
                  <Download size={12}/> Install
                </button>
                <button onClick={dismissBanner} className="text-white/40 hover:text-white text-xs px-2 transition-all">
                  Not now
                </button>
              </div>
            </div>
            <button onClick={dismissBanner} className="text-white/30 hover:text-white transition-all p-1">
              <X size={14}/>
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[hsl(215,55%,10%)] text-white shadow-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">

            {/* Brand */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-150 active:scale-95">
                <Car size={16} className="text-white"/>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-base tracking-tight text-white">TransportMW</span>
                <span className="text-[9px] text-teal-400 font-semibold tracking-wider uppercase hidden sm:block">
                  Malawi's Ride Hub
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: "Find Ride",   href: "/transport",      icon: Search },
                { label: "Post Route",  href: "/post-transport", icon: Plus },
                { label: "Bookings",    href: "/bookings",       icon: BookOpen },
                { label: "Dashboard",   href: "/dashboard",      icon: LayoutDashboard },
                { label: "Notifications",href: "/notifications", icon: Bell },
              ].map(n => (
                <Link key={n.href} href={n.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive(n.href)
                      ? "text-white bg-white/15"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}>
                  <n.icon size={13}/>{n.label}
                </Link>
              ))}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:flex items-center gap-1 bg-white/10 border border-white/10 rounded-lg px-2.5 py-1">
                <Shield size={11} className="text-green-400"/>
                <span className="text-[10px] text-white/70 font-semibold">No sign-up</span>
              </div>

              <button onClick={toggleTheme}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-95">
                {theme === "dark" ? <Sun size={15}/> : <Moon size={15}/>}
              </button>

              <Link href="/notifications"
                className="hidden sm:flex p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-95">
                <Bell size={15}/>
              </Link>

              <Link href="/post-transport"
                className="hidden sm:flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95">
                <Plus size={13}/> Post Route
              </Link>

              <button onClick={() => setOpen(!open)}
                className="lg:hidden p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-95">
                {open ? <X size={17}/> : <Menu size={17}/>}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="lg:hidden border-t border-white/10 bg-[hsl(215,50%,9%)] animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 grid grid-cols-3 gap-1.5">
              {[
                { label: "Find Ride",    href: "/transport",       icon: Search },
                { label: "Post Route",   href: "/post-transport",  icon: Plus },
                { label: "Dashboard",    href: "/dashboard",       icon: LayoutDashboard },
                { label: "Bookings",     href: "/bookings",        icon: BookOpen },
                { label: "Notifications",href: "/notifications",   icon: Bell },
                { label: "Messages",     href: "/messages",        icon: MessageCircle },
                { label: "Settings",     href: "/settings",        icon: Settings },
              ].map(n => (
                <Link key={n.href} href={n.href}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs text-white/65 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                  onClick={() => setOpen(false)}>
                  <n.icon size={16}/>
                  <span className="text-center leading-tight text-[10px]">{n.label}</span>
                </Link>
              ))}
            </div>
            <div className="px-4 pb-3 flex items-center gap-2 border-t border-white/10 pt-3">
              <Shield size={12} className="text-green-400"/>
              <p className="text-[11px] text-white/50">No signup — anonymous & secure</p>
            </div>
          </div>
        )}
      </header>

      {/* PAGE CONTENT */}
      <OfflineBanner />
      <main
        className="flex-1 pb-16 lg:pb-0"
        style={{ opacity: pageVisible ? 1 : 0, transition: "opacity 120ms ease" }}
      >
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ─────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[hsl(215,55%,10%)] border-t border-white/10">
        <div className="flex items-center justify-around h-14 px-1">
          {BOTTOM_NAV.map(n => {
            const active = isActive(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl transition-all duration-150 active:scale-90 min-w-0 flex-1 ${
                  active ? "text-teal-400" : "text-white/40 hover:text-white/70"
                }`}>
                <div className="relative">
                  {n.highlight ? (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center -mt-4 shadow-lg ${active ? "bg-teal-500" : "bg-teal-700"}`}>
                      <n.icon size={18} className="text-white" strokeWidth={2}/>
                    </div>
                  ) : (
                    <n.icon size={18} strokeWidth={active ? 2.5 : 1.8}/>
                  )}
                </div>
                <span className="text-[9px] font-medium whitespace-nowrap leading-none mt-0.5">{n.label}</span>
                {active && !n.highlight && <span className="w-1 h-1 rounded-full bg-teal-400 mt-0.5"/>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Global SOS float button */}
      <SOSOverlay />
      <OnboardingTutorial />

      {/* ── FOOTER (desktop) ──────────────────────────────────────────── */}
      <footer className="hidden lg:block bg-[hsl(215,55%,8%)] text-white/70 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                  <Car size={16} className="text-white"/>
                </div>
                <span className="font-black text-white text-lg">TransportMW</span>
              </div>
              <p className="text-xs text-white/45 leading-relaxed mb-4">
                Malawi's most trusted transport hub. No account needed — post your route and start earning today.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-green-400 mb-3">
                <Shield size={11}/> 100% Anonymous — No Signup
              </div>
              <a href="https://wa.me/265999626944" target="_blank" rel="noopener noreferrer"
                className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5">
                <MessageCircle size={12}/> WhatsApp Support
              </a>
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">For Passengers</h4>
              <div className="space-y-2 text-xs">
                {[
                  ["Find a Ride",          "/transport"],
                  ["Book a Driver",        "/transport"],
                  ["My Bookings",          "/bookings"],
                  ["Airport Transfer",     "/transport?type=Airport+Transfer"],
                  ["Cargo Delivery",       "/transport?type=Cargo+%2F+Delivery"],
                  ["Fare Estimator",       "/transport"],
                ].map(([l,h]) => (
                  <Link key={h} href={h} className="block text-white/50 hover:text-white transition-all">{l}</Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">For Operators</h4>
              <div className="space-y-2 text-xs">
                {[
                  ["Post Your Route",   "/post-transport"],
                  ["Manage Listings",   "/dashboard"],
                  ["Upgrade to Premium","/dashboard"],
                  ["Live Feed",         "/transport"],
                  ["Notifications",     "/notifications"],
                ].map(([l,h]) => (
                  <Link key={h+l} href={h} className="block text-white/50 hover:text-white transition-all">{l}</Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">Pay With</h4>
              <div className="bg-white/5 rounded-xl p-3 space-y-2 text-xs text-white/50 mb-4">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"/>
                  Airtel Money: <strong className="text-white">0999626944</strong>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0"/>
                  TNM Mpamba: <strong className="text-white">0888712272</strong>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"/>
                  Cash on arrival
                </p>
              </div>
              <div className="space-y-2 text-xs">
                <Link href="/settings" className="block text-white/50 hover:text-white transition-all">Settings</Link>
                <Link href="/messages" className="block text-white/50 hover:text-white transition-all">Contact Support</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/30 text-center sm:text-left">
              Powered by <span className="text-teal-400 font-bold">O-techy</span> · Built for Malawi. Your Ideas To Reality.
            </p>
            <p className="text-xs text-white/20">© 2026 TransportMW. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
