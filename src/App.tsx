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
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center animate-pulse shadow-lg">
          <span className="text-white font-black text-lg">T</span>
        </div>
        <div className="flex gap-1">
          {[0,150,300].map(d => (
            <span key={d} className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
              style={{ animationDelay: `${d}ms` }}/>
          ))}
        </div>
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
