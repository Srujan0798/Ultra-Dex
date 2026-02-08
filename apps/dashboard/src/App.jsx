import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Bot, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Shield, 
  Users, 
  GitBranch,
  Database,
  Cpu,
  HardDrive,
  Globe,
  Terminal,
  Code,
  Eye,
  Brain,
  Cog,
  TrendingUp,
  Star,
  MessageSquare,
  GitCommit,
  Server,
  Smartphone,
  Globe as GlobeIcon,
  Activity as ActivityIcon,
  Shield as ShieldIcon,
  Cpu as CpuIcon,
  HardDrive as HardDriveIcon,
  GitCommit as GitCommitIcon,
  Bot as BotIcon
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCommits: 1247,
    activeProjects: 23,
    aiRequests: 8934,
    memoryUsage: 78,
    agentsOnline: 12,
    uptime: 99.9,
    responseTime: 124,
    errorRate: 0.2,
    cpuUsage: 45,
    memoryUsagePercent: 67,
    diskUsage: 34,
    networkTraffic: 2.3
  });

  const [realTimeData, setRealTimeData] = useState([
    { timestamp: '10:00:00', commits: 24, aiRequests: 1200, errors: 2 },
    { timestamp: '10:01:00', commits: 31, aiRequests: 1350, errors: 1 },
    { timestamp: '10:02:00', commits: 28, aiRequests: 980, errors: 3 },
    { timestamp: '10:03:00', commits: 35, aiRequests: 1420, errors: 0 },
    { timestamp: '10:04:00', commits: 42, aiRequests: 1180, errors: 1 },
  ]);

  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for charts
  const activityData = [
    { date: 'Mon', commits: 24, aiRequests: 1200, errors: 2 },
    { date: 'Tue', commits: 52, aiRequests: 1350, errors: 1 },
    { date: 'Wed', commits: 38, aiRequests: 980, errors: 3 },
    { date: 'Thu', commits: 61, aiRequests: 1420, errors: 0 },
    { date: 'Fri', commits: 49, aiRequests: 1180, errors: 1 },
    { date: 'Sat', commits: 23, aiRequests: 650, errors: 0 },
    { date: 'Sun', commits: 18, aiRequests: 520, errors: 2 },
  ];

  const agentData = [
    { name: 'Planner', value: 15, status: 'active', tasks: 45 },
    { name: 'Backend', value: 25, status: 'active', tasks: 67 },
    { name: 'Frontend', value: 20, status: 'busy', tasks: 34 },
    { name: 'Database', value: 10, status: 'idle', tasks: 23 },
    { name: 'Reviewer', value: 15, status: 'active', tasks: 56 },
    { name: 'Debugger', value: 15, status: 'busy', tasks: 12 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const agentStatusData = [
    { status: 'Active', count: 8, color: '#10B981' },
    { status: 'Busy', count: 3, color: '#F59E0B' },
    { status: 'Idle', count: 1, color: '#6B7280' },
  ];

  const recentTasks = [
    { id: 1, task: 'Implement auth system', agent: 'Backend', status: 'completed', time: '2m ago' },
    { id: 2, task: 'Design dashboard UI', agent: 'Frontend', status: 'in-progress', time: '5m ago' },
    { id: 3, task: 'Setup database schema', agent: 'Database', status: 'pending', time: '10m ago' },
    { id: 4, task: 'Write unit tests', agent: 'Testing', status: 'completed', time: '15m ago' },
    { id: 5, task: 'Fix security vulnerability', agent: 'Security', status: 'in-progress', time: '20m ago' },
  ];

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealTimeData(prev => {
        const newData = [...prev, {
          timestamp: new Date().toLocaleTimeString().split(' ')[0],
          commits: Math.floor(Math.random() * 10),
          aiRequests: Math.floor(Math.random() * 100),
          errors: Math.floor(Math.random() * 3)
        }];
        return newData.length > 20 ? newData.slice(-20) : newData;
      });

      // Update stats periodically
      setStats(prev => ({
        ...prev,
        totalCommits: prev.totalCommits + Math.floor(Math.random() * 3),
        aiRequests: prev.aiRequests + Math.floor(Math.random() * 50),
        errorRate: Math.random() * 5,
        responseTime: 50 + Math.random() * 150,
        cpuUsage: 20 + Math.random() * 60,
        memoryUsagePercent: 30 + Math.random() * 50
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon: Icon, change, color = "blue" }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 bg-${color}-500/20 rounded-lg`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  const AgentStatusCard = ({ name, status, tasks, icon: Icon }) => {
    const statusColors = {
      active: 'text-green-400',
      busy: 'text-yellow-400',
      idle: 'text-gray-400'
    };

    const statusIcons = {
      active: '🟢',
      busy: '🟡',
      idle: '⚪'
    };

    return (
      <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
        <div className="flex items-center space-x-3">
          <Icon className="w-5 h-5 text-blue-400" />
          <span className="font-medium">{name}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`text-sm ${statusColors[status]}`}>
            {statusIcons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <span className="text-sm text-gray-400">{tasks} tasks</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold">Ultra-Dex Dashboard</h1>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-400">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Operational</span>
              </span>
              <span>Uptime: {stats.uptime}%</span>
              <span>Version: 4.2.0</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
              New Project
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Cog className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
          <nav className="p-4 space-y-2">
            {[
              { icon: ActivityIcon, label: 'Overview', active: activeTab === 'overview' },
              { icon: BotIcon, label: 'Agents', active: activeTab === 'agents' },
              { icon: Code, label: 'Code Analysis', active: activeTab === 'code' },
              { icon: Eye, label: 'Vision', active: activeTab === 'vision' },
              { icon: Terminal, label: 'Terminal', active: activeTab === 'terminal' },
              { icon: ShieldIcon, label: 'Security', active: activeTab === 'security' },
              { icon: Users, label: 'Team', active: activeTab === 'team' },
              { icon: Server, label: 'Infrastructure', active: activeTab === 'infra' },
              { icon: MessageSquare, label: 'Chat', active: activeTab === 'chat' },
              { icon: GitCommitIcon, label: 'Commits', active: activeTab === 'commits' },
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(item.label.toLowerCase().replace(' ', '-'))}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  item.active 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Commits" 
              value={stats.totalCommits.toLocaleString()} 
              icon={GitCommit} 
              change="+12%" 
              color="green"
            />
            <StatCard 
              title="AI Requests" 
              value={stats.aiRequests.toLocaleString()} 
              icon={Zap} 
              change="+8%" 
              color="purple"
            />
            <StatCard 
              title="Active Agents" 
              value={stats.agentsOnline} 
              icon={Bot} 
              change="+2" 
              color="blue"
            />
            <StatCard 
              title="Response Time" 
              value={`${stats.responseTime.toFixed(0)}ms`} 
              icon={Clock} 
              change="-5%" 
              color="yellow"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Activity Chart */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Activity Overview
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area type="monotone" dataKey="commits" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="aiRequests" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="errors" stackId="3" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Agent Distribution */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Agent Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={agentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {agentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Health and Active Agents */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* System Health */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                System Health
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'CPU Usage', value: `${stats.cpuUsage.toFixed(1)}%`, status: stats.cpuUsage > 80 ? 'warning' : 'good' },
                  { label: 'Memory Usage', value: `${stats.memoryUsagePercent.toFixed(1)}%`, status: stats.memoryUsagePercent > 80 ? 'warning' : 'good' },
                  { label: 'Disk Usage', value: `${stats.diskUsage.toFixed(1)}%`, status: stats.diskUsage > 90 ? 'critical' : 'good' },
                  { label: 'Network Traffic', value: `${stats.networkTraffic.toFixed(1)} Mbps`, status: 'good' },
                ].map((metric, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-300">{metric.label}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${
                        metric.status === 'critical' ? 'text-red-400' : 
                        metric.status === 'warning' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {metric.value}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        metric.status === 'critical' ? 'bg-red-500' : 
                        metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Agents */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Active Agents
              </h3>
              <div className="space-y-3">
                {agentData.filter(a => a.status !== 'idle').map((agent, index) => (
                  <AgentStatusCard
                    key={index}
                    name={agent.name}
                    status={agent.status}
                    tasks={agent.tasks}
                    icon={Bot}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Recent Tasks
              </h3>
              <div className="space-y-3">
                {recentTasks.map((task, index) => (
                  <div key={task.id} className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{task.task}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        task.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>{task.agent}</span>
                      <span>{task.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time Activity Feed */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Real-time Activity
              </h3>
              <div className="h-64 overflow-y-auto space-y-2">
                {realTimeData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-b-0">
                    <span className="text-sm text-gray-400">{data.timestamp}</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-blue-400 flex items-center">
                        <GitCommit className="w-4 h-4 mr-1" />
                        +{data.commits} commits
                      </span>
                      <span className="text-green-400 flex items-center">
                        <Zap className="w-4 h-4 mr-1" />
                        +{data.aiRequests} AI req
                      </span>
                      {data.errors > 0 && (
                        <span className="text-red-400 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          -{data.errors} err
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;