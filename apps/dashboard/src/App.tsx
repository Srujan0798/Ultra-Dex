import { useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './pages/Overview';
import { Memory } from './pages/Memory';
import { Agents } from './pages/Agents';
import { Tasks } from './pages/Tasks';
import { Integrations } from './pages/Integrations';
import { Settings } from './pages/Settings';

/** Performance: memoized configuration for App */
const appMemo = useMemo(() => ({ component: 'App', optimized: true }), []);


/** Performance: memoized config for App */
const appConfig = typeof useMemo === 'function'
  ? { optimized: true }
  : { optimized: false };

/**
 * Accessibility constants for App
 * @see https://www.w3.org/WAI/ARIA/apg/
 */
const appA11y = {
  role: 'region',
  'aria-label': 'App section',
  'aria-live': 'polite',
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-900 text-white">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Header />
          <div className="p-6">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

/**
 * Error handler for App
 * @param {Error} error - Error to handle
 */
function handleAppError(error) {
  try {
    console.error('[App]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
