"use client";

import { useEffect, useState } from "react";
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Database, 
  Play, 
  Plus, 
  TrendingUp,
  XCircle 
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const stats = [
  { label: "Active Workflows", value: "12", change: "+3", icon: Activity, color: "cyan" },
  { label: "Success Rate", value: "98.5%", change: "+2.1%", icon: TrendingUp, color: "success" },
  { label: "Tasks Completed", value: "1,284", change: "+42", icon: CheckCircle, color: "amber" },
  { label: "Avg Latency", value: "145ms", change: "-12ms", icon: Clock, color: "cyan" },
];

const recentWorkflows = [
  { id: "wf-001", name: "Deploy Production", status: "running", progress: 65, agent: "deploy-agent", started: "2m ago" },
  { id: "wf-002", name: "Run Test Suite", status: "success", progress: 100, agent: "test-agent", started: "15m ago" },
  { id: "wf-003", name: "Code Review", status: "failed", progress: 45, agent: "review-agent", started: "32m ago" },
  { id: "wf-004", name: "Data Migration", status: "pending", progress: 0, agent: "db-agent", started: "-" },
];

const agentStatus = [
  { name: "Planner", status: "idle", lastActive: "2m ago" },
  { name: "Coder", status: "busy", lastActive: "Now" },
  { name: "Tester", status: "idle", lastActive: "5m ago" },
  { name: "Reviewer", status: "error", lastActive: "1h ago" },
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <span className="badge badge-running flex items-center gap-1"><span className="w-1.5 h-1.5 bg-cyan rounded-full animate-pulse" /> Running</span>;
      case "success":
        return <span className="badge badge-success">Success</span>;
      case "failed":
        return <span className="badge badge-failed">Failed</span>;
      case "pending":
        return <span className="badge badge-pending">Pending</span>;
      default:
        return <span className="badge badge-pending">{status}</span>;
    }
  };

  const getAgentStatusBadge = (status: string) => {
    switch (status) {
      case "idle":
        return <span className="w-2 h-2 bg-success rounded-full" />;
      case "busy":
        return <span className="w-2 h-2 bg-cyan rounded-full animate-pulse" />;
      case "error":
        return <span className="w-2 h-2 bg-failed rounded-full" />;
      default:
        return <span className="w-2 h-2 bg-text-tertiary rounded-full" />;
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-24 pb-8 px-6">
          {/* Page Title */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
                Control Center
              </h1>
              <p className="text-text-secondary">
                Monitor and manage your AI orchestration workflows
              </p>
            </div>
            <button className="btn-industrial flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Workflow
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger-in">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="glass-card p-6 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 bg-${stat.color}/10 border border-${stat.color}/30 rounded flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${stat.color}`} />
                    </div>
                    <span className={`text-sm font-display ${stat.change.startsWith("+") ? "text-success" : "text-cyan"}`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-text-primary mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-text-secondary uppercase tracking-wider font-display">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Workflows */}
            <div className="lg:col-span-2 glass-card">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-text-primary uppercase tracking-wider">
                  Active Workflows
                </h2>
                <button className="text-sm text-cyan hover:text-cyan-dim transition-colors font-display uppercase">
                  View All
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentWorkflows.map((workflow) => (
                    <div 
                      key={workflow.id} 
                      className="flex items-center gap-4 p-4 bg-panel-elevated rounded border border-border hover:border-border-accent transition-all group"
                    >
                      <button className="w-8 h-8 bg-cyan/10 border border-cyan/30 rounded flex items-center justify-center hover:bg-cyan hover:text-void transition-all">
                        <Play className="w-4 h-4 text-cyan group-hover:text-void" />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-display font-medium text-text-primary">
                            {workflow.name}
                          </h4>
                          {getStatusBadge(workflow.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-tertiary font-display">
                          <span>ID: {workflow.id}</span>
                          <span>Agent: {workflow.agent}</span>
                          <span>Started: {workflow.started}</span>
                        </div>
                      </div>
                      <div className="w-32">
                        <div className="progress-bar">
                          <div 
                            className="progress-bar-fill" 
                            style={{ width: `${workflow.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-tertiary font-display mt-1 block text-right">
                          {workflow.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Widgets */}
            <div className="space-y-6">
              {/* Agent Status */}
              <div className="glass-card">
                <div className="p-6 border-b border-border">
                  <h2 className="font-display text-lg font-semibold text-text-primary uppercase tracking-wider">
                    Agent Status
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {agentStatus.map((agent) => (
                      <div 
                        key={agent.name} 
                        className="flex items-center justify-between p-3 bg-panel-elevated rounded border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <Cpu className="w-4 h-4 text-cyan" />
                          <span className="font-display text-sm text-text-primary">
                            {agent.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getAgentStatusBadge(agent.status)}
                          <span className="text-xs text-text-tertiary font-display">
                            {agent.lastActive}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              <div className="glass-card">
                <div className="p-6 border-b border-border">
                  <h2 className="font-display text-lg font-semibold text-text-primary uppercase tracking-wider">
                    Memory Usage
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary font-display">Epodic</span>
                        <span className="text-sm text-cyan font-display">2.4 GB</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: "65%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary font-display">Semantic</span>
                        <span className="text-sm text-cyan font-display">1.8 GB</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: "45%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary font-display">State</span>
                        <span className="text-sm text-cyan font-display">512 MB</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: "25%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card">
                <div className="p-6 border-b border-border">
                  <h2 className="font-display text-lg font-semibold text-text-primary uppercase tracking-wider">
                    Quick Actions
                  </h2>
                </div>
                <div className="p-6 space-y-2">
                  <button className="w-full btn-industrial text-left justify-start">
                    <Play className="w-4 h-4 mr-2" />
                    Run Test Workflow
                  </button>
                  <button className="w-full btn-industrial text-left justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Clear Cache
                  </button>
                  <button className="w-full btn-industrial text-left justify-start">
                    <Activity className="w-4 h-4 mr-2" />
                    View Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
