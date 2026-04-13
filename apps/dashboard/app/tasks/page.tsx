"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  Clock, 
  Filter, 
  MoreVertical, 
  Pause, 
  Play, 
  Plus, 
  RefreshCw, 
  Search, 
  Trash2,
  XCircle 
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const tasks = [
  { id: "task-001", name: "Code Generation", workflow: "wf-001", status: "running", agent: "coder", duration: "2m 34s", priority: "high" },
  { id: "task-002", name: "Unit Tests", workflow: "wf-001", status: "success", agent: "tester", duration: "45s", priority: "medium" },
  { id: "task-003", name: "Security Scan", workflow: "wf-002", status: "failed", agent: "security", duration: "1m 12s", priority: "high" },
  { id: "task-004", name: "Documentation", workflow: "wf-003", status: "pending", agent: "writer", duration: "-", priority: "low" },
  { id: "task-005", name: "Integration Tests", workflow: "wf-004", status: "running", agent: "tester", duration: "5m 20s", priority: "high" },
  { id: "task-006", name: "Performance Check", workflow: "wf-004", status: "success", agent: "perf", duration: "3m 45s", priority: "medium" },
];

const filters = ["All", "Running", "Success", "Failed", "Pending"];

export default function TasksPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredTasks = activeFilter === "All" 
    ? tasks 
    : tasks.filter(t => t.status.toLowerCase() === activeFilter.toLowerCase());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <RefreshCw className="w-4 h-4 text-cyan animate-spin" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-failed" />;
      case "pending":
        return <Clock className="w-4 h-4 text-pending" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "border-failed text-failed",
      medium: "border-amber text-amber",
      low: "border-text-tertiary text-text-tertiary",
    };
    return (
      <span className={`badge ${colors[priority as keyof typeof colors]}`}>
        {priority}
      </span>
    );
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
                Tasks
              </h1>
              <p className="text-text-secondary">
                Manage and monitor individual task executions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-industrial flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="btn-industrial flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Task
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`
                  px-4 py-2 rounded font-display text-sm uppercase tracking-wider transition-all
                  ${activeFilter === filter
                    ? "bg-cyan text-void"
                    : "bg-panel border border-border text-text-secondary hover:text-text-primary hover:border-cyan/30"
                  }
                `}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Tasks Table */}
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-panel border-b border-border">
                <tr>
                  <th className="text-left p-4 font-display text-xs uppercase tracking-wider text-text-tertiary">Task</th>
                  <th className="text-left p-4 font-display text-xs uppercase tracking-wider text-text-tertiary">Workflow</th>
                  <th className="text-left p-4 font-display text-xs uppercase tracking-wider text-text-tertiary">Status</th>
                  <th className="text-left p-4 font-display text-xs uppercase tracking-wider text-text-tertiary">Agent</th>
                  <th className="text-left p-4 font-display text-xs uppercase tracking-wider text-text-tertiary">Duration</th>
                  <th className="text-left p-4 font-display text-xs uppercase tracking-wider text-text-tertiary">Priority</th>
                  <th className="text-left p-4 font-display text-xs uppercase tracking-wider text-text-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-panel-elevated/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <div>
                          <p className="font-display font-medium text-text-primary">{task.name}</p>
                          <p className="text-xs text-text-tertiary font-display">{task.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-text-secondary font-display">{task.workflow}</span>
                    </td>
                    <td className="p-4">
                      <span className={`badge badge-${task.status}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-text-secondary font-display">{task.agent}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-text-secondary font-display">{task.duration}</span>
                    </td>
                    <td className="p-4">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {task.status === "running" ? (
                          <button className="p-2 hover:bg-panel-elevated rounded transition-colors">
                            <Pause className="w-4 h-4 text-amber" />
                          </button>
                        ) : task.status === "pending" ? (
                          <button className="p-2 hover:bg-panel-elevated rounded transition-colors">
                            <Play className="w-4 h-4 text-cyan" />
                          </button>
                        ) : null}
                        <button className="p-2 hover:bg-panel-elevated rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-failed" />
                        </button>
                        <button className="p-2 hover:bg-panel-elevated rounded transition-colors">
                          <MoreVertical className="w-4 h-4 text-text-secondary" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
