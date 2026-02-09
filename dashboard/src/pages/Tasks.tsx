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

export function Tasks() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Active Tasks</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Task</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Progress</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 text-slate-400">{task.id}</td>
                  <td className="px-4 py-3 text-slate-100">{task.title}</td>
                  <td className="px-4 py-3 text-slate-400">{task.owner}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-2 rounded-full bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Timeline</h2>
        <div className="mt-6 space-y-4">
          {ganttRows.map((row) => (
            <div key={row.label}>
              <div className="flex justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>{row.label}</span>
                <span>{row.duration}%</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-slate-800">
                <div
                  className="h-3 rounded-full bg-cyan-500"
                  style={{ marginLeft: `${row.start}%`, width: `${row.duration}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
