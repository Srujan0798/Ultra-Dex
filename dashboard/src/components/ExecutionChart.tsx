/**
 * Execution Chart Component
 * 
 * Displays workflow execution history over time
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { WorkflowStatus } from '../App';
import './ExecutionChart.css';

interface ExecutionChartProps {
  workflows: WorkflowStatus[];
}

export function ExecutionChart({ workflows }: ExecutionChartProps) {
  const chartData = useMemo(() => {
    // Group workflows by hour
    const hourlyData = new Map<string, {
      hour: string;
      completed: number;
      failed: number;
      running: number;
      cost: number;
    }>();

    workflows.forEach(wf => {
      if (!wf.startedAt) return;
      
      const hour = new Date(wf.startedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const existing = hourlyData.get(hour) || {
        hour,
        completed: 0,
        failed: 0,
        running: 0,
        cost: 0,
      };

      if (wf.status === 'SUCCESS') existing.completed++;
      else if (wf.status === 'FAILED') existing.failed++;
      else if (wf.status === 'RUNNING') existing.running++;

      existing.cost += wf.cost.estimatedUSD;
      hourlyData.set(hour, existing);
    });

    return Array.from(hourlyData.values()).sort((a, b) => 
      a.hour.localeCompare(b.hour)
    );
  }, [workflows]);

  const costData = useMemo(() => {
    return chartData.map(d => ({
      hour: d.hour,
      cost: Number(d.cost.toFixed(2)),
    }));
  }, [chartData]);

  if (workflows.length === 0) {
    return <div className="empty-chart">No execution data available</div>;
  }

  return (
    <div className="execution-chart">
      <div className="chart-container">
        <h3>Workflow Executions</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill="#4caf50" name="Success" />
            <Bar dataKey="failed" fill="#f44336" name="Failed" />
            <Bar dataKey="running" fill="#2196f3" name="Running" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3>Cost Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={costData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value}`} />
            <Line 
              type="monotone" 
              dataKey="cost" 
              stroke="#8884d8" 
              name="Cost (USD)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
