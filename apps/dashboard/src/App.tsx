import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './pages/Overview';
import { Memory } from './pages/Memory';
import { Agents } from './pages/Agents';
import { Tasks } from './pages/Tasks';
import { Integrations } from './pages/Integrations';
import { Settings } from './pages/Settings';

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
