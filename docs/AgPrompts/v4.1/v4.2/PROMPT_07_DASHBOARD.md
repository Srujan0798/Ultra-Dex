# 📊 Agent Prompt: Dashboard GUI (v4.2)

---

## Stack
- React 18 + TypeScript
- Tailwind CSS
- Recharts for graphs
- WebSocket for real-time

---

## 1. dashboard/package.json

```json
{
  "name": "ultra-dex-dashboard",
  "version": "4.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

---

## 2. dashboard/src/App.tsx

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
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
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
```

---

## 3. dashboard/src/components/Sidebar.tsx

```tsx
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Brain, Bot, ListTodo, 
  Plug, Settings, Zap 
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/memory', icon: Brain, label: 'Memory' },
  { path: '/agents', icon: Bot, label: 'Agents' },
  { path: '/tasks', icon: ListTodo, label: 'Tasks' },
  { path: '/integrations', icon: Plug, label: 'Integrations' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700">
      <div className="p-4 flex items-center gap-2">
        <Zap className="h-8 w-8 text-purple-500" />
        <span className="text-xl font-bold">Ultra-Dex</span>
      </div>
      
      <nav className="mt-4">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              location.pathname === path
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

---

## 4. dashboard/src/pages/Overview.tsx

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Bot, CheckCircle, AlertCircle } from 'lucide-react';

const metrics = [
  { label: 'Active Agents', value: 17, icon: Bot, color: 'purple' },
  { label: 'Tasks Today', value: 42, icon: Activity, color: 'blue' },
  { label: 'Completed', value: 38, icon: CheckCircle, color: 'green' },
  { label: 'Errors', value: 2, icon: AlertCircle, color: 'red' },
];

export function Overview() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <Icon className={`h-8 w-8 text-${color}-500`} />
              <span className="text-3xl font-bold">{value}</span>
            </div>
            <p className="text-gray-400 mt-2">{label}</p>
          </div>
        ))}
      </div>
      
      {/* Activity Chart */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Activity (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={activityData}>
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Line type="monotone" dataKey="tasks" stroke="#8b5cf6" strokeWidth={2} />
            <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

## 5. dashboard/src/pages/Memory.tsx

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const memoryData = [
  { tier: 'Hot', tokens: 2048, max: 4096 },
  { tier: 'Warm', tokens: 6000, max: 8192 },
  { tier: 'Cold', tokens: 45000, max: 100000 },
];

export function Memory() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Memory Tiers</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        {memoryData.map(({ tier, tokens, max }) => (
          <div key={tier} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold">{tier} Tier</h3>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400">
                <span>{tokens.toLocaleString()} tokens</span>
                <span>{Math.round(tokens / max * 100)}%</span>
              </div>
              <div className="mt-2 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${tokens / max * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Token Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={memoryData}>
            <XAxis dataKey="tier" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Bar dataKey="tokens" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

## 6. Create remaining pages

- **Agents.tsx**: Show 17 agents, health status, metrics
- **Tasks.tsx**: Active/completed tasks table
- **Integrations.tsx**: Connected services status
- **Settings.tsx**: Configuration options

---

## 7. WebSocket Real-time Updates

```tsx
// dashboard/src/hooks/useWebSocket.ts
import { useEffect, useState } from 'react';

export function useWebSocket(url: string) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => setData(JSON.parse(event.data));
    
    return () => ws.close();
  }, [url]);

  return { data, connected };
}
```

---

**SUCCESS:** 6-page React dashboard with real-time WebSocket updates
