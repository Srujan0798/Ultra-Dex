/**
 * Ultra-Dex Dashboard V2.1
 * 
 * Real-time workflow monitoring and analytics
 */

import { useEffect, useState } from 'react';
import { WorkflowList } from './components/WorkflowList';
import { MetricsPanel } from './components/MetricsPanel';
import { ExecutionChart } from './components/ExecutionChart';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';

export interface WorkflowStatus {
  workflowId: string;
  name: string;
  status: 'CREATED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  progress: number;
  nodes: {
    total: number;
    completed: number;
    failed: number;
    running: number;
  };
  startedAt?: string;
  duration?: number;
  cost: {
    tokens: number;
    estimatedUSD: number;
  };
}

export interface DashboardMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  successRate: number;
  totalCost: {
    tokens: number;
    estimatedUSD: number;
  };
  avgDuration: number;
}

function App() {
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    successRate: 0,
    totalCost: { tokens: 0, estimatedUSD: 0 },
    avgDuration: 0,
  });
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const { isConnected, lastMessage } = useWebSocket('ws://localhost:8080');

  useEffect(() => {
    // Fetch initial data
    fetchWorkflows();
    fetchMetrics();

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchWorkflows();
      fetchMetrics();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastMessage) {
      const event = JSON.parse(lastMessage);
      handleRealtimeEvent(event);
    }
  }, [lastMessage]);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const handleRealtimeEvent = (event: any) => {
    switch (event.type) {
      case 'workflow.started':
        fetchWorkflows();
        break;
      case 'workflow.completed':
      case 'workflow.failed':
        fetchWorkflows();
        fetchMetrics();
        break;
      case 'task.completed':
        // Update specific workflow progress
        setWorkflows(prev => prev.map(w => 
          w.workflowId === event.workflowId
            ? { ...w, progress: calculateProgress(w, event) }
            : w
        ));
        break;
    }
  };

  const calculateProgress = (workflow: WorkflowStatus, event: any): number => {
    const completed = workflow.nodes.completed + 1;
    return Math.round((completed / workflow.nodes.total) * 100);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Ultra-Dex Dashboard</h1>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Live' : '○ Offline'}
        </div>
      </header>

      <main className="main">
        <div className="metrics-section">
          <MetricsPanel metrics={metrics} />
        </div>

        <div className="content-grid">
          <div className="workflows-panel">
            <h2>Active Workflows</h2>
            <WorkflowList 
              workflows={workflows}
              selectedId={selectedWorkflow}
              onSelect={setSelectedWorkflow}
            />
          </div>

          <div className="chart-panel">
            <h2>Execution History</h2>
            <ExecutionChart workflows={workflows} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
