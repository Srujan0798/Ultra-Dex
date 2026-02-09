import React from 'react';
import { Activity, Bot, CheckCircle, AlertTriangle, Clock, Zap, Shield, Users, GitBranch, Database, Cpu, HardDrive, Globe, Terminal, Code, Eye, Brain, Cog, TrendingUp, Star, MessageSquare, GitCommit, Server, Smartphone, Globe as GlobeIcon, Activity as ActivityIcon, Shield as ShieldIcon, Cpu as CpuIcon, HardDrive as HardDriveIcon, GitCommit as GitCommitIcon, Bot as BotIcon, CheckCircle as CheckCircleIcon, AlertTriangle as AlertTriangleIcon, MessageSquare as MessageSquareIcon, User, Settings, BarChart3, PieChart as PieChartIcon, BarChart as BarChartIcon, LineChart as LineChartIcon, Eye as EyeIcon, ShieldCheck, Server as ServerIcon, Smartphone as SmartphoneIcon, Globe as GlobeIcon2, Activity as ActivityIcon2, Shield as ShieldIcon2, Cpu as CpuIcon2, HardDrive as HardDriveIcon2, GitCommit as GitCommitIcon2, Bot as BotIcon2, CheckCircle as CheckCircleIcon2, AlertTriangle as AlertTriangleIcon2, MessageSquare as MessageSquareIcon2, GitCommit as GitCommitIcon3, Zap as ZapIcon, Cog as CogIcon, Clock as ClockIcon } from 'lucide-react';

// StatCard Component
export const StatCard = ({ title, value, icon: Icon, change }) => (
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
      <div className="p-3 bg-blue-500/20 rounded-lg">
        <Icon className="w-6 h-6 text-blue-400" />
      </div>
    </div>
  </div>
);

// AgentStatusCard Component
export const AgentStatusCard = ({ name, status, tasks, icon: Icon }) => {
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

// Status Card Component
export const StatusCard = ({ title, value, icon: Icon, change, color = "blue" }) => {
  const colorClasses = {
    blue: "text-blue-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    purple: "text-purple-400"
  };

  return (
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
        <div className="p-3 bg-blue-500/20 rounded-lg">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
      </div>
    </div>
  );
};

// Task Card Component
export const TaskCard = ({ task, agent, status, time }) => {
  const statusColors = {
    completed: 'bg-green-500/20 text-green-400',
    'in-progress': 'bg-yellow-500/20 text-yellow-400',
    pending: 'bg-gray-500/20 text-gray-400'
  };

  return (
    <div className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate">{task}</span>
        <span className={`text-xs px-2 py-1 rounded ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
        <span>{agent}</span>
        <span>{time}</span>
      </div>
    </div>
  );
};

// Activity Item Component
export const ActivityItem = ({ timestamp, commits, aiRequests, errors }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-b-0">
    <span className="text-sm text-gray-400">{timestamp}</span>
    <div className="flex items-center space-x-4 text-sm">
      <span className="text-blue-400 flex items-center">
        <GitCommit className="w-4 h-4 mr-1" />
        +{commits} commits
      </span>
      <span className="text-green-400 flex items-center">
        <Zap className="w-4 h-4 mr-1" />
        +{aiRequests} AI req
      </span>
      {errors > 0 && (
        <span className="text-red-400 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1" />
          -{errors} err
        </span>
      )}
    </div>
  </div>
);

export default {
  StatCard,
  AgentStatusCard,
  StatusCard,
  TaskCard,
  ActivityItem
};