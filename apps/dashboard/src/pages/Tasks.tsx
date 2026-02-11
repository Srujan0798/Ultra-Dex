import { memo } from 'react';

const tasks = [
  { id: 'UDX-401', title: 'Implement payments webhook', owner: 'Backend', status: 'In Progress', progress: 68 },
  { id: 'UDX-402', title: 'Rewrite onboarding flow', owner: 'Frontend', status: 'Pending', progress: 25 },
  { id: 'UDX-403', title: 'Add policy guardrails', owner: 'Security', status: 'Complete', progress: 100 },
  { id: 'UDX-404', title: 'Refine memory compaction', owner: 'Memory', status: 'In Progress', progress: 54 },
  { id: 'UDX-405', title: 'Sync integrations status', owner: 'Ops', status: 'Pending', progress: 18 },
];

const ganttRows = [
  { label: 'Planning', start: 0, duration: 20 },
  { label: 'Build', start: 20, duration: 40 },
  { label: 'Verify', start: 60, duration: 25 },
  { label: 'Deploy', start: 85, duration: 15 },
];

/**
 * Tasks Dashboard Page - View active tasks and timeline
 * @returns {JSX.Element} Tasks page component
 */
export const Tasks = memo(function Tasks() {
  return (
    <main className="space-y-6" role="main" aria-label="Tasks Dashboard">
      <section
        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
        aria-label="Active Tasks Table"
        role="region"
      >
        <h2 className="text-lg font-semibold text-slate-100">Active Tasks</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-sm" role="table" aria-label="Tasks list">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr role="row">
                <th className="px-4 py-3 text-left" scope="col" aria-label="Task ID">ID</th>
                <th className="px-4 py-3 text-left" scope="col" aria-label="Task title">Task</th>
                <th className="px-4 py-3 text-left" scope="col" aria-label="Task owner">Owner</th>
                <th className="px-4 py-3 text-left" scope="col" aria-label="Task status">Status</th>
                <th className="px-4 py-3 text-left" scope="col" aria-label="Task progress">Progress</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-t border-slate-800"
                  role="row"
                  aria-label={`Task ${task.id}: ${task.title}, ${task.status}, ${task.progress}%`}
                >
                  <td className="px-4 py-3 text-slate-400">{task.id}</td>
                  <td className="px-4 py-3 text-slate-100">{task.title}</td>
                  <td className="px-4 py-3 text-slate-400">{task.owner}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                      role="status"
                      aria-label={`Status: ${task.status}`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="h-2 rounded-full bg-slate-800"
                      role="progressbar"
                      aria-valuenow={task.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progress: ${task.progress}%`}
                    >
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${task.progress}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
        aria-label="Project Timeline"
        role="region"
      >
        <h2 className="text-lg font-semibold text-slate-100">Timeline</h2>
        <div className="mt-6 space-y-4" role="list" aria-label="Project phases">
          {ganttRows.map((row) => (
            <div key={row.label} role="listitem" aria-label={`${row.label}: ${row.duration}% duration`}>
              <div className="flex justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>{row.label}</span>
                <span aria-label={`${row.duration}% of timeline`}>{row.duration}%</span>
              </div>
              <div
                className="mt-2 h-3 rounded-full bg-slate-800"
                role="progressbar"
                aria-valuenow={row.duration}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${row.label} progress`}
              >
                <div
                  className="h-3 rounded-full bg-cyan-500"
                  style={{ marginLeft: `${row.start}%`, width: `${row.duration}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
});

/**
 * Error handler for Tasks component failures
 * @param {Error} error - The error to handle
 * @param {Object} [errorInfo] - React error info
 */
function handleTasksError(error, errorInfo) {
  try {
    console.error(`[Tasks] Rendering error:`, error.message);
    if (errorInfo) console.error('Component stack:', errorInfo.componentStack);
  } catch (_) {
    // Fail silently to avoid recursive errors
  }
}
