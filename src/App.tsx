import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useScrollToTop } from "@/hooks/useScrollToTop";

const TransportPage   = lazy(() => import("@/pages/transport"));
const TransportDetail = lazy(() => import("@/pages/transport-detail"));
const PostTransport   = lazy(() => import("@/pages/post-transport"));
const DashboardPage   = lazy(() => import("@/pages/dashboard"));
const BookingsPage    = lazy(() => import("@/pages/bookings"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const MessagesPage    = lazy(() => import("@/pages/messages"));
const SettingsPage    = lazy(() => import("@/pages/settings"));
const NotFound        = lazy(() => import("@/pages/not-found"));
const LoginPage       = lazy(() => import("@/pages/login"));
const RegisterPage    = lazy(() => import("@/pages/register"));
const ProfilePage     = lazy(() => import("@/pages/profile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 600_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

function Loader() {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: '#f0f4f8' }}>

      {/* ── Map grid background ── */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(45,212,191,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.07) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      {/* ── Animated SVG map (route line + building blocks) ── */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes tmwRoute {
            from { stroke-dashoffset: 600; opacity: 0.3; }
            to   { stroke-dashoffset: 0;   opacity: 1; }
          }
          @keyframes tmwLabelA {
            0%   { transform: scale(0) translate(-50%,-50%); opacity: 0; }
            65%  { transform: scale(1.12) translate(-50%,-50%); opacity: 1; }
            100% { transform: scale(1) translate(-50%,-50%); opacity: 1; }
          }
          @keyframes tmwLabelB {
            0%   { transform: scale(0) translate(-50%,-50%); opacity: 0; }
            65%  { transform: scale(1.12) translate(-50%,-50%); opacity: 1; }
            100% { transform: scale(1) translate(-50%,-50%); opacity: 1; }
          }
          .tmw-route-bg { fill:none; stroke:rgba(45,212,191,0.13); stroke-width:7; stroke-linecap:round; stroke-linejoin:round; }
          .tmw-route    { fill:none; stroke:#2dd4bf; stroke-width:3; stroke-linecap:round; stroke-linejoin:round;
                          stroke-dasharray:600; animation: tmwRoute 1.3s ease 0.2s both; }
          .tmw-block    { fill:rgba(45,212,191,0.06); }
          .tmw-dot-start{ fill:#2dd4bf; }
          .tmw-dot-end  { fill:#2dd4bf; }
          .tmw-label-a  { transform-origin:50% 50%; animation: tmwLabelA 0.35s cubic-bezier(0.34,1.56,0.64,1) 1.1s both; transform-box:fill-box; }
          .tmw-label-b  { transform-origin:50% 50%; animation: tmwLabelB 0.35s cubic-bezier(0.34,1.56,0.64,1) 1.9s both; transform-box:fill-box; }
        `}</style>

        {/* Building blocks */}
        <rect className="tmw-block" x="10"  y="100" width="110" height="55" rx="6"/>
        <rect className="tmw-block" x="140" y="55"  width="75"  height="90" rx="6"/>
        <rect className="tmw-block" x="255" y="95"  width="105" height="65" rx="6"/>
        <rect className="tmw-block" x="25"  y="295" width="95"  height="70" rx="6"/>
        <rect className="tmw-block" x="215" y="275" width="125" height="55" rx="6"/>
        <rect className="tmw-block" x="55"  y="490" width="88"  height="80" rx="6"/>
        <rect className="tmw-block" x="235" y="470" width="108" height="60" rx="6"/>
        <rect className="tmw-block" x="10"  y="640" width="135" height="55" rx="6"/>
        <rect className="tmw-block" x="255" y="615" width="115" height="70" rx="6"/>

        {/* Route glow + line */}
        <path className="tmw-route-bg" d="M 68 678 Q 88 575 128 497 Q 168 418 198 378 Q 228 338 248 298 Q 278 238 298 178"/>
        <path className="tmw-route"    d="M 68 678 Q 88 575 128 497 Q 168 418 198 378 Q 228 338 248 298 Q 278 238 298 178"/>

        {/* Start dot */}
        <circle className="tmw-dot-start" cx="68" cy="678" r="6" opacity="0.9"/>
        <circle cx="68" cy="678" r="11" fill="none" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.35"/>

        {/* End dot */}
        <circle className="tmw-dot-end" cx="298" cy="178" r="6" opacity="0.9"/>
        <circle cx="298" cy="178" r="11" fill="none" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.35"/>

        {/* Pickup label */}
        <g className="tmw-label-a">
          <rect x="20" y="668" width="60" height="20" rx="5" fill="white" stroke="#2dd4bf" strokeWidth="1.5"/>
          <text x="50" y="682" textAnchor="middle" fill="#0f6e56" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif">Pickup</text>
        </g>

        {/* Drop-off label */}
        <g className="tmw-label-b">
          <rect x="308" y="168" width="72" height="20" rx="5" fill="white" stroke="#2dd4bf" strokeWidth="1.5"/>
          <text x="344" y="182" textAnchor="middle" fill="#0f6e56" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif">Drop-off</text>
        </g>
      </svg>

      {/* ── Centre content ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">

        {/* GPS Pin */}
        <div className="relative flex flex-col items-center" style={{
          animation: 'tmwPinDrop 0.65s cubic-bezier(0.22,0.61,0.36,1) 0.15s both'
        }}>
          <style>{`
            @keyframes tmwPinDrop {
              0%   { transform: translateY(-80px) scale(0.5); opacity: 0; }
              55%  { transform: translateY(10px)  scale(1.08); opacity: 1; }
              72%  { transform: translateY(-5px)  scale(0.97); }
              84%  { transform: translateY(4px)   scale(1.02); }
              100% { transform: translateY(0)     scale(1);    opacity: 1; }
            }
            @keyframes tmwPinPulse {
              0%,100% { transform: scale(1); }
              50%     { transform: scale(1.06); }
            }
            @keyframes tmwRipple {
              0%   { transform: scale(0.3); opacity: 0.7; }
              100% { transform: scale(2.8); opacity: 0; }
            }
            @keyframes tmwShadow {
              0%,100% { transform: scaleX(1); opacity: 0.18; }
              50%     { transform: scaleX(1.2); opacity: 0.1; }
            }
            @keyframes tmwFadeUp {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes tmwDotWave {
              0%,60%,100% { transform: translateY(0);   opacity: 0.3; }
              30%          { transform: translateY(-7px); opacity: 1; }
            }
          `}</style>

          {/* Pin SVG */}
          <svg style={{ animation: 'tmwPinPulse 2.1s ease-in-out 0.9s infinite', filter: 'drop-shadow(0 8px 22px rgba(45,212,191,0.38))' }}
            width="76" height="86" viewBox="0 0 76 86" xmlns="http://www.w3.org/2000/svg">
            <circle cx="38" cy="36" r="35" fill="rgba(45,212,191,0.13)"/>
            <circle cx="38" cy="36" r="28" fill="#2dd4bf"/>
            <circle cx="38" cy="36" r="20" fill="rgba(255,255,255,0.18)"/>
            <text x="38" y="45" textAnchor="middle" fill="#ffffff"
              fontSize="28" fontWeight="900" fontFamily="Inter,sans-serif" letterSpacing="-1">T</text>
            <polygon points="30,62 46,62 38,78" fill="#2dd4bf"/>
          </svg>

          {/* Ripple rings */}
          <div className="absolute" style={{ bottom: '12px', left: '50%', transform: 'translateX(-50%)', width: '32px', height: '12px' }}>
            {[0, 350].map((delay, i) => (
              <div key={i} className="absolute inset-0 rounded-full border-2" style={{
                borderColor: '#2dd4bf',
                animation: `tmwRipple 1.6s ease-out ${0.9 + delay / 1000}s infinite`,
                opacity: 0
              }}/>
            ))}
          </div>

          {/* Shadow */}
          <div style={{
            width: '22px', height: '6px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '50%',
            marginTop: '2px',
            animation: 'tmwShadow 2.1s ease-in-out 0.9s infinite'
          }}/>
        </div>

        {/* Brand name */}
        <div className="flex items-center gap-2 mt-5" style={{ animation: 'tmwFadeUp 0.4s ease 0.75s both', opacity: 0 }}>
          <span className="text-lg font-black tracking-tight" style={{ color: '#0d1f3c' }}>TransportMW</span>
        </div>

        {/* Status text */}
        <p className="text-xs font-medium mt-1" style={{
          color: '#64748b',
          animation: 'tmwFadeUp 0.4s ease 0.9s both',
          opacity: 0,
          letterSpacing: '0.2px'
        }}>
          Finding your ride…
        </p>

        {/* Three bouncing dots */}
        <div className="flex gap-2 mt-3" style={{ animation: 'tmwFadeUp 0.4s ease 1.0s both', opacity: 0 }}>
          {[0, 150, 300].map(delay => (
            <span key={delay} style={{
              display: 'inline-block',
              width: '9px', height: '9px',
              background: '#2dd4bf',
              borderRadius: '50%',
              animation: `tmwDotWave 0.9s ease-in-out ${delay}ms infinite`
            }}/>
          ))}
        </div>
      </div>

      {/* Powered by */}
      <div className="absolute bottom-5 left-0 right-0 text-center text-xs" style={{ color: 'rgba(13,31,60,0.28)', letterSpacing: '0.4px' }}>
        Powered by <strong style={{ color: '#2dd4bf' }}>Otechy</strong>
      </div>
    </div>
  );
}

function RouterContent() {
  useScrollToTop();
  return (
    <Layout>
      <Suspense fallback={<Loader />}>
        <Switch>
          <Route path="/"                  component={TransportPage} />
          <Route path="/transport"         component={TransportPage} />
          <Route path="/transport/:id"     component={TransportDetail} />
          <Route path="/post-transport"    component={PostTransport} />
          <Route path="/dashboard"         component={DashboardPage} />
          <Route path="/bookings"          component={BookingsPage} />
          <Route path="/notifications"     component={NotificationsPage} />
          <Route path="/messages"          component={MessagesPage} />
          <Route path="/settings"          component={SettingsPage} />
          <Route path="/profile"           component={ProfilePage} />
          {/* Legacy auth routes — redirect gracefully */}
          <Route path="/login"             component={LoginPage} />
          <Route path="/register"          component={RegisterPage} />
          <Route                           component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base="">
            <RouterContent />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
