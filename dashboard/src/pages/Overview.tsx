import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Bot, CheckCircle, AlertCircle } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

const metrics = [
  { label: 'Active Agents', value: 17, icon: Bot, iconClass: 'text-purple-500' },
  { label: 'Tasks Today', value: 42, icon: Activity, iconClass: 'text-blue-500' },
  { label: 'Completed', value: 38, icon: CheckCircle, iconClass: 'text-green-500' },
  { label: 'Errors', value: 2, icon: AlertCircle, iconClass: 'text-red-500' },
];

const activityData = [
  { date: 'Mon', tasks: 24, completed: 20 },
  { date: 'Tue', tasks: 30, completed: 27 },
  { date: 'Wed', tasks: 35, completed: 31 },
  { date: 'Thu', tasks: 28, completed: 25 },
  { date: 'Fri', tasks: 42, completed: 38 },
  { date: 'Sat', tasks: 20, completed: 17 },
  { date: 'Sun', tasks: 18, completed: 14 },
];

export function Overview() {
  const { connected, data } = useWebSocket('ws://localhost:3002');
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <div className="mb-4 text-sm text-gray-400">
        WebSocket: <span className={connected ? 'text-green-400' : 'text-red-400'}>{connected ? 'Connected' : 'Disconnected'}</span>
        {data ? <span className="ml-3 text-gray-500">Last event: {data.type || 'event'}</span> : null}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {metrics.map(({ label, value, icon: Icon, iconClass }) => (
          <div key={label} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <Icon className={`h-8 w-8 ${iconClass}`} />
              <span className="text-3xl font-bold">{value}</span>
            </div>
            <p className="text-gray-400 mt-2">{label}</p>
          </div>
        ))}
      </div>

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
