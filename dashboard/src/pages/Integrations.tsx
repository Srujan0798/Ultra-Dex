const integrations = [
  { name: 'GitHub', status: 'connected' },
  { name: 'Stripe', status: 'connected' },
  { name: 'Linear', status: 'pending' },
  { name: 'Notion', status: 'connected' },
  { name: 'Slack', status: 'disconnected' },
];

const statusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'text-green-400';
    case 'pending':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
};

export function Integrations() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-gray-400">Connection status and sync health</p>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
          >
            <div>
              <p className="text-lg font-semibold">{integration.name}</p>
              <p className={`text-sm ${statusColor(integration.status)}`}>
                {integration.status}
              </p>
            </div>
            <button className="px-3 py-2 bg-purple-600 rounded text-sm">
              Manage
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
