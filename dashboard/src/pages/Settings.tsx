export function Settings() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Theme</label>
          <select className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
            <option>Dark</option>
            <option>Light</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">WebSocket URL</label>
          <input
            type="text"
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            defaultValue="ws://localhost:3002"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Enable live updates</span>
          <input type="checkbox" defaultChecked />
        </div>
      </div>
    </div>
  );
}
