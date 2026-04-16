import http from 'http';
import { logger } from './logging.js';
type DashboardLogLevel = 'info' | 'success' | 'warning' | 'error';
type AgentStatus = 'working' | 'idle' | 'completed' | 'error';
interface DashboardNotifier {
  sendAgentStatus(agent: string, status: AgentStatus, activity: string): Promise<boolean>;
  sendLog(message: string, level?: DashboardLogLevel): Promise<boolean>;
  _post(path: string, data: Record<string, unknown>): Promise<boolean>;
}
const dashboardNotifier: DashboardNotifier = {
  /**
   * Send an agent status update
   * @param {string} agent - Agent name (e.g., 'backend')
   * @param {string} status - 'working' | 'idle' | 'completed' | 'error'
   * @param {string} activity - Short description of current activity
   */
  async sendAgentStatus(agent: string, status: AgentStatus, activity: string): Promise<boolean> {
    return this._post('/api/agent/status', { agent, status, activity });
  },
  /**
   * Send a log message to the dashboard
   * @param {string} message - The message text
   * @param {string} level - 'info' | 'success' | 'warning' | 'error'
   */
  async sendLog(message: string, level: DashboardLogLevel = 'info'): Promise<boolean> {
    return this._post('/api/log', { message, level });
  },
  /**
   * Internal POST helper
   */
  async _post(path: string, data: Record<string, unknown>): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const payload = JSON.stringify(data);
      const req = http.request(
        {
          hostname: 'localhost',
          port: 3001,
          // Multiverse Kernel port (from serve.js)
          path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length,
          },
        },
        (res) => {
          resolve(res.statusCode === 200);
        }
      );
      req.on('error', () => {
        resolve(false);
      });
      req.write(payload);
      req.end();
    });
  },
};
async function _safeExecute<T>(
  fn: () => Promise<T>,
  context: string = 'dashboard-notifier'
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
export { dashboardNotifier };
