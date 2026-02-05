export function activate(api) {
  api.registerCommand('ultraDex.run', () => api.notify('Ultra-Dex run invoked'));
  api.registerCommand('ultraDex.context', () => api.notify('Ultra-Dex context injected'));
  api.registerCommand('ultraDex.swarm', () => api.notify('Ultra-Dex swarm started'));
}

export function deactivate() {}
