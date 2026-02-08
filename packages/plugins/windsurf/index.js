export function activate(api) {
  api.registerCommand('ultraDex.plan', () => api.notify('Ultra-Dex plan generated'));
  api.registerCommand('ultraDex.review', () => api.notify('Ultra-Dex review complete'));
}

export function deactivate() {}
