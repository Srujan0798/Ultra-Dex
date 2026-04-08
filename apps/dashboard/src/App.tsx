import React, { Suspense, lazy, memo, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingTour } from './components/OnboardingTour';
import { useWebSocket } from './hooks/useWebSocket';
import { trackPageView } from './lib/analytics';
import { hasRole, isAuthenticated } from './lib/api';

const OverviewPage = lazy(() =>
  import('./pages/Overview').then((module) => ({ default: module.Overview }))
);
const MemoryPage = lazy(() =>
  import('./pages/Memory').then((module) => ({ default: module.Memory }))
);
const AgentsPage = lazy(() =>
  import('./pages/Agents').then((module) => ({ default: module.Agents }))
);
const TasksPage = lazy(() => import('./pages/Tasks').then((module) => ({ default: module.Tasks })));
const IntegrationsPage = lazy(() =>
  import('./pages/Integrations').then((module) => ({ default: module.Integrations }))
);
const SettingsPage = lazy(() =>
  import('./pages/Settings').then((module) => ({ default: module.Settings }))
);
const ProvidersPage = lazy(() =>
  import('./pages/Providers').then((module) => ({ default: module.Providers }))
);
const AnalyticsPage = lazy(() =>
  import('./pages/Analytics').then((module) => ({ default: module.Analytics }))
);
const HologramPage = lazy(() => import('./pages/Hologram'));
const TracesPage = lazy(() =>
  import('./pages/Traces').then((module) => ({ default: module.Traces }))
);
const MarketplacePage = lazy(() =>
  import('./pages/Marketplace').then((module) => ({ default: module.Marketplace }))
);
const LoginPage = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const BillingPage = lazy(() =>
  import('./pages/Billing').then((module) => ({ default: module.Billing }))
);
const LandingPage = lazy(() =>
  import('./pages/Landing').then((module) => ({ default: module.Landing }))
);
const OnboardingPage = lazy(() =>
  import('./pages/Onboarding').then((module) => ({ default: module.Onboarding }))
);

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return <></>;
}

function RouteFallback() {
  return (
    <section className="space-y-4" aria-label="Loading content">
      <div className="h-24 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />
      <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />
    </section>
  );
}

function AppShell() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  const socketUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ULTRA_DEX_WS) ||
    'ws://localhost:3002/ws';
  const { connected } = useWebSocket(socketUrl);

  if (!authenticated) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <RouteTracker />
      <OnboardingTour />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header title="Mission Control" connected={connected} />
          <main className="flex-1 space-y-6 p-6">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/memory" element={<MemoryPage />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route
                  path="/tasks"
                  element={
                    hasRole('admin') || hasRole('user') ? <TasksPage /> : <div>Access Denied</div>
                  }
                />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/providers" element={<ProvidersPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/traces" element={<TracesPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/hologram" element={<HologramPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

const App = memo(function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ErrorBoundary>
  );
});

export default App;
