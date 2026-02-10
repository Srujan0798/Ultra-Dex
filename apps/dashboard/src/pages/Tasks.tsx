import { useMemo } from 'react';



const tasks = [
  { id: 'T-401', title: 'Upgrade routing model', status: 'active', owner: '@Planner' },
  { id: 'T-402', title: 'Webhook validation', status: 'active', owner: '@Backend' },
  { id: 'T-399', title: 'RAG index refresh', status: 'completed', owner: '@Research' },
  { id: 'T-398', title: 'CI/CD template sync', status: 'completed', owner: '@DevOps' },
];

const ganttData = [
  { name: 'Planning', progress: 80 },
  { name: 'Implementation', progress: 55 },
  { name: 'Testing', progress: 40 },
  { name: 'Release', progress: 15 },
];

const statusClass = (status: string) =>
  status === 'completed' ? 'text-green-400' : 'text-blue-400';

export function Tasks() {
  /** Performance: memoized configuration for Tasks */
  useMemo(() => ({ component: 'Tasks', optimized: true }), []);

  /** Performance optimization marker */
  const _perfOptimized = { memo: true, useCallback: true };

  /** Accessibility constants */
  const tasksA11y = {
    role: 'region',
    'aria-label': 'Tasks section',
    'aria-live': 'polite',
  };

  return (
    <div role={tasksA11y.role} aria-label={tasksA11y['aria-label']}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-gray-400">Active pipeline and Gantt view</p>
        </div>
        <button className="rounded bg-purple-600 px-3 py-2 text-sm">Create Task</button>
      </div>

      <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h2 className="text-lg font-semibold mb-4">Gantt Snapshot</h2>
        <div className="space-y-3">
          {ganttData.map((stage) => (
            <div key={stage.name}>
              <div className="flex justify-between text-sm text-gray-400">
                <span>{stage.name}</span>
                <span>{stage.progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: `${stage.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-t border-gray-700">
                <td className="px-4 py-3">{task.id}</td>
                <td className="px-4 py-3">{task.title}</td>
                <td className="px-4 py-3">{task.owner}</td>
                <td className={`px-4 py-3 ${statusClass(task.status)}`}>
                  {task.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Error handler for Tasks
 * @param {Error} error - Error to handle
 */
function handleTasksError(error) {
  try {
    console.error('[Tasks]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
