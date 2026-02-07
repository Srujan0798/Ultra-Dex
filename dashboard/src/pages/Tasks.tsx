const tasks = [
  { id: 'T-401', title: 'Upgrade routing model', status: 'active', owner: '@Planner' },
  { id: 'T-402', title: 'Webhook validation', status: 'active', owner: '@Backend' },
  { id: 'T-399', title: 'RAG index refresh', status: 'completed', owner: '@Research' },
  { id: 'T-398', title: 'CI/CD template sync', status: 'completed', owner: '@DevOps' },
];

const statusClass = (status: string) =>
  status === 'completed' ? 'text-green-400' : 'text-blue-400';

export function Tasks() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>

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
