/**
 * Workflow List Component
 * 
 * Displays list of workflows with status and progress
 */

import { WorkflowStatus } from '../App';
import './WorkflowList.css';

interface WorkflowListProps {
  workflows: WorkflowStatus[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function WorkflowList({ workflows, selectedId, onSelect }: WorkflowListProps) {
  const getStatusColor = (status: WorkflowStatus['status']) => {
    switch (status) {
      case 'SUCCESS': return 'status-success';
      case 'FAILED': return 'status-failed';
      case 'RUNNING': return 'status-running';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-created';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatCost = (usd: number) => {
    if (usd < 0.01) return '<$0.01';
    return `$${usd.toFixed(2)}`;
  };

  return (
    <div className="workflow-list">
      {workflows.length === 0 ? (
        <div className="empty-state">No workflows running</div>
      ) : (
        workflows.map(workflow => (
          <div
            key={workflow.workflowId}
            className={`workflow-card ${selectedId === workflow.workflowId ? 'selected' : ''} ${getStatusColor(workflow.status)}`}
            onClick={() => onSelect(workflow.workflowId)}
          >
            <div className="workflow-header">
              <span className="workflow-name">{workflow.name}</span>
              <span className={`status-badge ${getStatusColor(workflow.status)}`}>
                {workflow.status}
              </span>
            </div>

            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${workflow.progress}%` }}
              />
            </div>

            <div className="workflow-stats">
              <div className="stat">
                <span className="stat-label">Nodes</span>
                <span className="stat-value">
                  {workflow.nodes.completed}/{workflow.nodes.total}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Duration</span>
                <span className="stat-value">{formatDuration(workflow.duration)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Cost</span>
                <span className="stat-value">{formatCost(workflow.cost.estimatedUSD)}</span>
              </div>
            </div>

            {workflow.nodes.failed > 0 && (
              <div className="error-indicator">
                ⚠️ {workflow.nodes.failed} node(s) failed
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
