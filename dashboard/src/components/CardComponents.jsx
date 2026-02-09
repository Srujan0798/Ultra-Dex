import React, { memo } from 'react';
import { Activity, Bot, CheckCircle, AlertTriangle, Clock, Zap, Shield, Users, GitBranch, Database, Cpu, HardDrive, Globe, Terminal, Code, Eye, Brain, Cog, TrendingUp, Star, MessageSquare, GitCommit, Server, Smartphone, Globe as GlobeIcon, Activity as ActivityIcon, Shield as ShieldIcon, Cpu as CpuIcon, HardDrive as HardDriveIcon, GitCommit as GitCommitIcon, Bot as BotIcon, CheckCircle as CheckCircleIcon, AlertTriangle as AlertTriangleIcon, MessageSquare as MessageSquareIcon, User, Settings, BarChart3, PieChart as PieChartIcon, BarChart as BarChartIcon, LineChart as LineChartIcon, Eye as EyeIcon, ShieldCheck, Server as ServerIcon, Smartphone as SmartphoneIcon, Globe as GlobeIcon2, Activity as ActivityIcon2, Shield as ShieldIcon2, Cpu as CpuIcon2, HardDrive as HardDriveIcon2, GitCommit as GitCommitIcon2, Bot as BotIcon2, CheckCircle as CheckCircleIcon2, AlertTriangle as AlertTriangleIcon2, MessageSquare as MessageSquareIcon2, GitCommit as GitCommitIcon3, Zap as ZapIcon, Cog as CogIcon, Clock as ClockIcon } from 'lucide-react';

/**
 * StatCard - Displays a statistic with optional change indicator
 * @param {string} title - Card title
 * @param {string|number} value - Displayed value
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} change - Optional change indicator
 */
export const StatCard = memo(({ title, value, icon: Icon, change }) => (
  <article
    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
    role="region"
    aria-label={`${title}: ${value}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm" id={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}>{title}</p>
        <p className="text-2xl font-bold mt-1" aria-labelledby={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}>{value}</p>
        {change && (
          <p
            className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}
            role="status"
            aria-live="polite"
            aria-label={`Change: ${change}`}
          >
            {change}
          </p>
        )}
      </div>
      <div className="p-3 bg-blue-500/20 rounded-lg" aria-hidden="true">
        <Icon className="w-6 h-6 text-blue-400" aria-hidden="true" />
      </div>
    </div>
  </article>
));

/**
 * AgentStatusCard - Displays agent status with tasks count
 * @param {string} name - Agent name
 * @param {string} status - Status: active, busy, or idle
 * @param {number} tasks - Number of tasks
 * @param {React.ComponentType} icon - Lucide icon component
 */
export const AgentStatusCard = memo(({ name, status, tasks, icon: Icon }) => {
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
    <div
      className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
      role="listitem"
      aria-label={`Agent ${name}: ${status}, ${tasks} tasks`}
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-blue-400" aria-hidden="true" />
        <span className="font-medium">{name}</span>
      </div>
      <div className="flex items-center space-x-4">
        <span
          className={`text-sm ${statusColors[status]}`}
          role="status"
          aria-label={`Status: ${status}`}
        >
          <span aria-hidden="true">{statusIcons[status]}</span> {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <span className="text-sm text-gray-400" aria-label={`${tasks} tasks`}>{tasks} tasks</span>
      </div>
    </div>
  );
});

/**
 * StatusCard - Generic status display card
 * @param {string} title - Card title
 * @param {string|number} value - Displayed value
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} change - Optional change indicator
 * @param {string} color - Color theme
 */
export const StatusCard = memo(({ title, value, icon: Icon, change, color = "blue" }) => {
  const colorClasses = {
    blue: "text-blue-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    purple: "text-purple-400"
  };

  return (
    <article
      className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
      role="region"
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p
              className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}
              role="status"
              aria-live="polite"
            >
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-500/20 rounded-lg" aria-hidden="true">
          <Icon className="w-6 h-6 text-blue-400" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
});

/**
 * TaskCard - Displays a task with agent and status
 * @param {string} task - Task description
 * @param {string} agent - Assigned agent name
 * @param {string} status - Task status: completed, in-progress, pending
 * @param {string} time - Time information
 */
export const TaskCard = memo(({ task, agent, status, time }) => {
  const statusColors = {
    completed: 'bg-green-500/20 text-green-400',
    'in-progress': 'bg-yellow-500/20 text-yellow-400',
    pending: 'bg-gray-500/20 text-gray-400'
  };

  return (
    <article
      className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
      role="listitem"
      aria-label={`Task: ${task}, Status: ${status}, Agent: ${agent}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate">{task}</span>
        <span
          className={`text-xs px-2 py-1 rounded ${statusColors[status]}`}
          role="status"
          aria-label={`Status: ${status}`}
        >
          {status}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
        <span aria-label={`Assigned to: ${agent}`}>{agent}</span>
        <time aria-label={`Time: ${time}`}>{time}</time>
      </div>
    </article>
  );
});

/**
 * ActivityItem - Displays activity timeline entry
 * @param {string} timestamp - Activity timestamp
 * @param {number} commits - Number of commits
 * @param {number} aiRequests - Number of AI requests
 * @param {number} errors - Number of errors
 */
export const ActivityItem = memo(({ timestamp, commits, aiRequests, errors }) => (
  <div
    className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-b-0"
    role="listitem"
    aria-label={`Activity at ${timestamp}: ${commits} commits, ${aiRequests} AI requests${errors > 0 ? `, ${errors} errors` : ''}`}
  >
    <time className="text-sm text-gray-400">{timestamp}</time>
    <div className="flex items-center space-x-4 text-sm">
      <span className="text-blue-400 flex items-center" aria-label={`${commits} commits`}>
        <GitCommit className="w-4 h-4 mr-1" aria-hidden="true" />
        +{commits} commits
      </span>
      <span className="text-green-400 flex items-center" aria-label={`${aiRequests} AI requests`}>
        <Zap className="w-4 h-4 mr-1" aria-hidden="true" />
        +{aiRequests} AI req
      </span>
      {errors > 0 && (
        <span className="text-red-400 flex items-center" role="alert" aria-label={`${errors} errors`}>
          <AlertTriangle className="w-4 h-4 mr-1" aria-hidden="true" />
          -{errors} err
        </span>
      )}
    </div>
  </div>
));

export default {
  StatCard,
  AgentStatusCard,
  StatusCard,
  TaskCard,
  ActivityItem
};