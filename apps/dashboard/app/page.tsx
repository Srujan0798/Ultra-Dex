import React from 'react';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { name: 'Total Tasks', value: '1,284', icon: Activity, trend: '+12%', color: 'text-blue-500' },
    { name: 'Success Rate', value: '98.2%', icon: TrendingUp, trend: '+0.4%', color: 'text-green-500' },
    { name: 'Avg. Latency', value: '42ms', icon: Clock, trend: '-5ms', color: 'text-orange-500' },
    { name: 'Total Cost', value: '$124.50', icon: DollarSign, trend: '+8%', color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Infrastructure Overview</h2>
        <p className="text-muted-foreground">Real-time health and performance metrics for the Ultra-Dex cluster.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.name}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-xs font-medium text-green-500">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Usage Chart Placeholder */}
        <div className="col-span-4 p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Task Volume (24h)
            </h3>
            <select className="bg-background border border-border rounded text-xs px-2 py-1">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full bg-primary/5 rounded-lg border border-dashed border-primary/20 flex items-center justify-center">
            <span className="text-xs text-muted-foreground font-mono italic">
              [ Recharts Visualization: Task Ingress vs. Completion ]
            </span>
          </div>
        </div>

        {/* System Logs Placeholder */}
        <div className="col-span-3 p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertCircle size={18} className="text-primary" />
            System Events
          </h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <span className="text-muted-foreground font-mono text-[10px] mt-0.5">09:42:1{i}</span>
                <div>
                  <p className="font-medium text-xs">Provider node-nvidia-0{i} healthy</p>
                  <p className="text-muted-foreground text-[11px]">Automatic health check passed. Latency stable at 12ms.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
