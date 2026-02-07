import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Activity, Bot, CheckCircle, AlertCircle } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { MetricCard } from '../components/MetricCard';
import { Chart } from '../components/Chart';

const metrics = [
  { label: 'Active Agents', value: 17, icon: Bot, accentClass: 'text-purple-500', trend: '+2 today' },
  { label: 'Tasks Today', value: 42, icon: Activity, accentClass: 'text-blue-500', trend: '+12%' },
  { label: 'Completed', value: 38, icon: CheckCircle, accentClass: 'text-green-500', trend: '90% success' },
  { label: 'Errors', value: 2, icon: AlertCircle, accentClass: 'text-red-500', trend: 'Low' },
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
      <div className="mb-4 text-sm text-gray-400">
        WebSocket: <span className={connected ? 'text-green-400' : 'text-red-400'}>{connected ? 'Connected' : 'Disconnected'}</span>
        {data ? <span className="ml-3 text-gray-500">Last event: {data.type || 'event'}</span> : null}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <Chart title="Activity (Last 7 Days)" subtitle="Tasks created vs completed">
        <LineChart data={activityData}>
          <XAxis dataKey="date" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip />
          <Line type="monotone" dataKey="tasks" stroke="#8b5cf6" strokeWidth={2} />
          <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} />
        </LineChart>
      </Chart>
    </div>
  );
}
