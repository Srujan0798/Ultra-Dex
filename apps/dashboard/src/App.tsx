import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './pages/Overview';
import { Memory } from './pages/Memory';
import { Agents } from './pages/Agents';
import { Tasks } from './pages/Tasks';
import { Integrations } from './pages/Integrations';
import { Settings } from './pages/Settings';
import { Providers } from './pages/Providers';
import Hologram from './pages/Hologram';
import { useWebSocket } from './hooks/useWebSocket';

/**
 * Accessibility constants for App
 * @see https://www.w3.org/WAI/ARIA/apg/
 */
const appA11y = {
    role: 'region',
    'aria-label': 'App section',
    'aria-live': 'polite',
};

const App = React.memo(function App() {
    const socketUrl =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ULTRA_DEX_WS) ||
        'ws://localhost:3002/ws';
    const { connected } = useWebSocket(socketUrl);

    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
                <div className="flex min-h-screen">
                    <Sidebar />
                    <div className="flex flex-1 flex-col">
                        <Header title="Mission Control" connected={connected} />
                        <main className="flex-1 space-y-6 p-6">
                            <Routes>
                                <Route path="/" element={<Overview />} />
                                <Route path="/memory" element={<Memory />} />
                                <Route path="/agents" element={<Agents />} />
                                <Route path="/tasks" element={<Tasks />} />
                                <Route path="/integrations" element={<Integrations />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/providers" element={<Providers />} />
                                <Route path="/hologram" element={<Hologram />} />
                            </Routes>
                        </main>
                    </div>
                </div>
            </div>
        </BrowserRouter>
    );
});

export default App;

/**
 * Error handler for App component failures
 * @param {Error} error - The error to handle
 * @param {Object} [errorInfo] - React error info
 */
function handleAppError(error: Error, errorInfo?: React.ErrorInfo) {
    try {
        console.error(`[App] Rendering error:`, error.message);
        if (errorInfo) console.error('Component stack:', errorInfo.componentStack);
    } catch (_) {
        // Fail silently to avoid recursive errors
    }
}
