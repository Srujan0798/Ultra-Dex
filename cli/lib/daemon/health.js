export function collectDaemonHealth() {
  const memory = process.memoryUsage();
  return {
    pid: process.pid,
    uptime: process.uptime(),
    memory,
    timestamp: new Date().toISOString()
  };
}
