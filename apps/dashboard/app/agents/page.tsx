"use client";

import { 
  Activity, 
  Brain, 
  CheckCircle, 
  Cpu, 
  MessageSquare, 
  MoreVertical, 
  Pause, 
  Play, 
  RefreshCw, 
  Settings,
  Terminal 
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const agents = [
  { 
    id: "agent-001", 
    name: "Planner", 
    role: "Orchestration",
    status: "active", 
    lastActive: "2m ago",
    tasksCompleted: 1284,
    successRate: 99.2,
    latency: "45ms",
    description: "Plans and coordinates multi-step workflows",
    icon: Brain
  },
  { 
    id: "agent-002", 
    name: "Coder", 
    role: "Development",
    status: "busy", 
    lastActive: "Now",
    tasksCompleted: 892,
    successRate: 96.8,
    latency: "120ms",
    description: "Generates and reviews code changes",
    icon: Terminal
  },
  { 
    id: "agent-003", 
    name: "Tester", 
    role: "QA",
    status: "active", 
    lastActive: "5m ago",
    tasksCompleted: 2156,
    successRate: 98.5,
    latency: "80ms",
    description: "Runs tests and validates outputs",
    icon: CheckCircle
  },
  { 
    id: "agent-004", 
    name: "Reviewer", 
    role: "Quality",
    status: "error", 
    lastActive: "1h ago",
    tasksCompleted: 643,
    successRate: 94.2,
    latency: "200ms",
    description: "Reviews code quality and security",
    icon: MessageSquare
  },
];

export default function AgentsPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="badge badge-success">Active</span>;
      case "busy":
        return <span className="badge badge-running">Busy</span>;
      case "error":
        return <span className="badge badge-failed">Error</span>;
      case "paused":
        return <span className="badge badge-pending">Paused</span>;
    }
  };

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-24 pb-8 px-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
                Agents
              </h1>
              <p className="text-text-secondary">
                Manage AI agent workers and monitor performance
              </p>
            </div>
            <button className="btn-industrial flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Restart All
            </button>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <div key={agent.id} className="glass-card group">
                  {/* Card Header */}
                  <div className="p-6 border-b border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded border flex items-center justify-center ${
                          agent.status === "error" 
                            ? "bg-failed/10 border-failed/30" 
                            : "bg-cyan/10 border-cyan/30"
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            agent.status === "error" ? "text-failed" : "text-cyan"
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-semibold text-text-primary">
                            {agent.name}
                          </h3>
                          <p className="text-sm text-text-tertiary font-display uppercase tracking-wider">
                            {agent.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(agent.status)}
                        <button className="p-2 hover:bg-panel-elevated rounded transition-colors">
                          <Settings className="w-4 h-4 text-text-secondary" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-text-secondary">
                      {agent.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="p-6 border-b border-border">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="font-display text-2xl font-bold text-cyan">
                          {agent.tasksCompleted.toLocaleString()}
                        </p>
                        <p className="text-xs text-text-tertiary font-display uppercase tracking-wider mt-1">
                          Tasks Done
                        </p>
                      </div>
                      <div className="text-center border-x border-border">
                        <p className="font-display text-2xl font-bold text-success">
                          {agent.successRate}%
                        </p>
                        <p className="text-xs text-text-tertiary font-display uppercase tracking-wider mt-1">
                          Success Rate
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-display text-2xl font-bold text-amber">
                          {agent.latency}
                        </p>
                        <p className="text-xs text-text-tertiary font-display uppercase tracking-wider mt-1">
                          Avg Latency
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-text-tertiary font-display">
                      <Activity className="w-4 h-4" />
                      Last active: {agent.lastActive}
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.status === "busy" || agent.status === "active" ? (
                        <button className="p-2 hover:bg-panel-elevated rounded transition-colors border border-border hover:border-amber/50">
                          <Pause className="w-4 h-4 text-amber" />
                        </button>
                      ) : (
                        <button className="p-2 hover:bg-panel-elevated rounded transition-colors border border-border hover:border-cyan/50">
                          <Play className="w-4 h-4 text-cyan" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-panel-elevated rounded transition-colors border border-border hover:border-text-secondary/50">
                        <MoreVertical className="w-4 h-4 text-text-secondary" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
