export async function connect(config = {}) {
  return { connected: true, provider: 'linear', config };
}

export async function disconnect() {
  return { connected: false, provider: 'linear' };
}

export async function syncTasks() {
  return { synced: true };
}
