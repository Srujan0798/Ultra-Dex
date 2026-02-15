import React, { Suspense, lazy, memo, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingTour } from './components/OnboardingTour';
import { useWebSocket } from './hooks/useWebSocket';
import { trackPageView } from './lib/analytics';

const OverviewPage = lazy(() =>
  import('./pages/Overview').then((module) => ({ default: module.Overview }))
);
const MemoryPage = lazy(() =>
  import('./pages/Memory').then((module) => ({ default: module.Memory }))
);
const AgentsPage = lazy(() =>
  import('./pages/Agents').then((module) => ({ default: module.Agents }))
);
const TasksPage = lazy(() =>
  import('./pages/Tasks').then((module) => ({ default: module.Tasks }))
);
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
  const socketUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ULTRA_DEX_WS) ||
    'ws://localhost:3002/ws';
  const { connected } = useWebSocket(socketUrl);

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
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/providers" element={<ProvidersPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/hologram" element={<HologramPage />} />
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
