// apps/dashboard/pages/index.js
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from '../components/ui/Card';
import {
  Activity,
  Users,
  DollarSign,
  TrendingUp,
  Zap,
  Shield,
  Database,
  Bot,
  Clock,
  Eye,
  Cpu,
  HardDrive,
  Network,
  BarChart3,
  GitBranch,
  Settings,
  Terminal,
  User
} from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalAgents: 0,
    activeUsers: 0,
    mrr: 0,
    uptime: 0,
    performanceScore: 0,
    securityScore: 0,
    memoryUsage: 0,
    taskCompletion: 0
  });

  const [loading, setLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState(null);

  useEffect(() => {
    // Simulate loading metrics
    setTimeout(() => {
      setMetrics({
        totalAgents: 1247,
        activeUsers: 892,
        mrr: 204500,
        uptime: 99.95,
        performanceScore: 94,
        securityScore: 98,
        memoryUsage: 67,
        taskCompletion: 96.8
      });
      setLoading(false);
    }, 1000);

    // Set up real-time WebSocket connection
    setupRealTimeConnection();
  }, []);

  const setupRealTimeConnection = () => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeData({
        timestamp: new Date().toISOString(),
        activeTasks: Math.floor(Math.random() * 50) + 10,
        queuedTasks: Math.floor(Math.random() * 20) + 5,
        errorRate: Math.random() * 0.02,
        systemLoad: Math.random() * 100
      });
    }, 3000);

    return () => clearInterval(interval);
  };

  const StatCard = ({ title, value, icon: Icon, change, color = 'blue' }) => {
    return (
      <Card className="beautiful-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Icon className="w-4 h-4 text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {typeof value === 'number' && value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
            {typeof value === 'number' && value < 1000 && value > 0.1 ? `${value}` : ''}
            {typeof value === 'number' && value <= 0.1 && value > 0 ? `${(value * 100).toFixed(1)}%` : ''}
            {typeof value === 'string' ? value : ''}
          </div>
          {change && (
            <p className={`text-xs ${change > 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
              <TrendingUp className={`w-3 h-3 mr-1 ${change < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(change)}% from last month
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white">Loading Ultra-Dex Dashboard...</h2>
          <p className="text-slate-400 mt-2">Preparing your AI orchestration environment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-white">Ultra-Dex</span>
              </div>
              <nav className="ml-6 hidden md:flex md:space-x-8">
                <a href="#" className="text-slate-300 hover:text-white px-1 py-2 text-sm font-medium">Dashboard</a>
                <a href="#" className="text-slate-300 hover:text-white px-1 py-2 text-sm font-medium">Agents</a>
                <a href="#" className="text-slate-300 hover:text-white px-1 py-2 text-sm font-medium">Memory</a>
                <a href="#" className="text-slate-300 hover:text-white px-1 py-2 text-sm font-medium">Settings</a>
              </nav>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Connected</span>
                </div>
                <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Settings
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm">Admin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="beautiful-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome back, Developer!</h1>
              <p className="text-slate-400 mt-2">Here's what's happening with your AI orchestration platform today.</p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>New Agent</span>
              </button>
              <button className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors">
                Documentation
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Agents"
            value={metrics.totalAgents}
            icon={Bot}
            change={12.5}
          />
          <StatCard
            title="Active Users"
            value={metrics.activeUsers}
            icon={Users}
            change={8.3}
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${(metrics.mrr / 1000).toFixed(1)}K`}
            icon={DollarSign}
            change={15.2}
          />
          <StatCard
            title="System Uptime"
            value={`${metrics.uptime}%`}
            icon={Shield}
            change={0.1}
          />
        </div>

        {/* Real-time Status */}
        {realTimeData && (
          <div className="beautiful-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-400" />
                Real-time Status
              </h2>
              <span className="text-sm text-slate-400">{realTimeData.timestamp}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{realTimeData.activeTasks}</div>
                <div className="text-sm text-slate-400">Active Tasks</div>
              </div>
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">{realTimeData.queuedTasks}</div>
                <div className="text-sm text-slate-400">Queued Tasks</div>
              </div>
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{(realTimeData.errorRate * 100).toFixed(2)}%</div>
                <div className="text-sm text-slate-400">Error Rate</div>
              </div>
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{realTimeData.systemLoad.toFixed(1)}%</div>
                <div className="text-sm text-slate-400">System Load</div>
              </div>
            </div>
          </div>
        )}

        {/* Performance & Security Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="beautiful-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Zap className="w-5 h-5 mr-2 text-blue-400" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Performance Score</span>
                    <span className="text-white">{metrics.performanceScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" 
                      style={{ width: `${metrics.performanceScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Task Completion Rate</span>
                    <span className="text-white">{metrics.taskCompletion}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" 
                      style={{ width: `${metrics.taskCompletion}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Memory Utilization</span>
                    <span className="text-white">{metrics.memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full" 
                      style={{ width: `${metrics.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="beautiful-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Shield className="w-5 h-5 mr-2 text-purple-400" />
                Security & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Security Score</span>
                    <span className="text-white">{metrics.securityScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
                      style={{ width: `${metrics.securityScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                    <Shield className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <div className="text-xs text-slate-400">SOC 2</div>
                    <div className="text-sm font-medium text-white">Compliant</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                    <Shield className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <div className="text-xs text-slate-400">GDPR</div>
                    <div className="text-sm font-medium text-white">Compliant</div>
                  </div>
                </div>
                
                <div className="text-sm text-slate-400 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Zero security incidents in 90 days
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Status & Memory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Agent Status */}
          <Card className="beautiful-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bot className="w-5 h-5 mr-2 text-blue-400" />
                Agent Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'DataProcessor', status: 'online', tasks: 24, responseTime: '187ms' },
                  { name: 'CodeReviewer', status: 'online', tasks: 18, responseTime: '212ms' },
                  { name: 'ContentGenerator', status: 'warning', tasks: 12, responseTime: '345ms' },
                  { name: 'SecurityScanner', status: 'online', tasks: 8, responseTime: '156ms' },
                  { name: 'MemoryManager', status: 'online', tasks: 45, responseTime: '98ms' }
                ].map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        agent.status === 'online' ? 'bg-green-500' : 
                        agent.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-white font-medium">{agent.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-300">{agent.tasks} tasks</div>
                      <div className="text-xs text-slate-500">{agent.responseTime}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Memory System */}
          <Card className="beautiful-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Database className="w-5 h-5 mr-2 text-purple-400" />
                Memory System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Hot Cache</span>
                  <span className="text-white">65%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Warm Storage</span>
                  <span className="text-white">42%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Cold Archive</span>
                  <span className="text-white">28%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                </div>
                
                <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Memory</span>
                    <span className="text-white">2.4 TB</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-400">Cache Hit Rate</span>
                    <span className="text-green-400">94.2%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="beautiful-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 1, agent: 'DataProcessor', action: 'completed task', time: '2 minutes ago', status: 'success' },
                { id: 2, agent: 'ContentGenerator', action: 'started execution', time: '5 minutes ago', status: 'running' },
                { id: 3, agent: 'SecurityScanner', action: 'completed scan', time: '12 minutes ago', status: 'success' },
                { id: 4, agent: 'APIGateway', action: 'processed 1,248 requests', time: '15 minutes ago', status: 'success' },
                { id: 5, agent: 'MemoryManager', action: 'optimized cache', time: '22 minutes ago', status: 'success' }
              ].map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      activity.status === 'success' ? 'bg-green-500' : 
                      activity.status === 'running' ? 'bg-blue-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="font-medium text-white">{activity.agent}</div>
                      <div className="text-sm text-slate-400">{activity.action}</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}