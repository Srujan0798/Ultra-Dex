export function activate(api) {
  api.registerCommand('ultraDex.sync', () => api.notify('Ultra-Dex context synced'));
  api.registerCommand('ultraDex.swarm', () => api.notify('Ultra-Dex swarm executing'));
}

export function deactivate() {}
