import { memo, type ErrorInfo, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { fetchTasks, createTask, cancelTask, type Task } from '../lib/api';
import { useDashboardStream } from '../lib/websocket';

/**
 * Tasks Dashboard Page - Create, monitor, and cancel tasks
 * @returns {JSX.Element} Tasks page component
 */
export const Tasks = memo(function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({ id: '', description: '', priority: 5 });
  const { logs } = useDashboardStream(
    import.meta.env.VITE_ULTRA_DEX_WS || 'ws://localhost:3002/ws'
  );

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const fetchedTasks = await fetchTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      await createTask(newTask);
      setNewTask({ id: '', description: '', priority: 5 });
      setShowCreateForm(false);
      loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await cancelTask(taskId);
      loadTasks();
    } catch (error) {
      console.error('Failed to cancel task:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <main className="space-y-6" role="main" aria-label="Tasks Dashboard">
      <section className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-100">Task Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white"
        >
          <Plus size={16} />
          Create Task
        </button>
      </section>

      {showCreateForm && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Create New Task</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Task ID"
              value={newTask.id}
              onChange={(e) => setNewTask({ ...newTask, id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              rows={3}
            />
            <input
              type="number"
              placeholder="Priority (1-10)"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              min={1}
              max={10}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

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
                <th className="px-4 py-3 text-left" scope="col" aria-label="Task ID">
                  ID
                </th>
                <th className="px-4 py-3 text-left" scope="col" aria-label="Task description">
                  Description
                </th>
                <th className="px-4 py-3 text-left" scope="col" aria-label="Task status">
                  Status
                </th>
                <th className="px-4 py-3 text-left" scope="col" aria-label="Task progress">
                  Progress
                </th>
                <th className="px-4 py-3 text-left" scope="col" aria-label="Actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-t border-slate-800"
                  role="row"
                  aria-label={`Task ${task.id}: ${task.description}, ${task.status}`}
                >
                  <td className="px-4 py-3 text-slate-400">{task.id}</td>
                  <td className="px-4 py-3 text-slate-100">{task.description}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        task.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : task.status === 'running'
                            ? 'bg-blue-500/20 text-blue-300'
                            : task.status === 'failed'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-slate-500/20 text-slate-300'
                      }`}
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
                      aria-valuenow={task.progress || 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progress: ${task.progress || 0}%`}
                    >
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${task.progress || 0}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(task.status === 'pending' || task.status === 'running') && (
                      <button
                        onClick={() => handleCancelTask(task.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white"
                      >
                        <X size={12} />
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
function handleTasksError(error: Error, errorInfo?: ErrorInfo) {
  try {
    console.error(`[Tasks] Rendering error:`, error.message);
    if (errorInfo) console.error('Component stack:', errorInfo.componentStack);
  } catch (_) {
    // Fail silently to avoid recursive errors
  }
}
