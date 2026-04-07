import http from "http";
import { logger } from './logging.js';
const dashboardNotifier = {
  /**
   * Send an agent status update
   * @param {string} agent - Agent name (e.g., 'backend')
   * @param {string} status - 'working' | 'idle' | 'completed' | 'error'
   * @param {string} activity - Short description of current activity
   */
  async sendAgentStatus(agent, status, activity) {
    return this._post("/api/agent/status", { agent, status, activity });
  },
  /**
   * Send a log message to the dashboard
   * @param {string} message - The message text
   * @param {string} level - 'info' | 'success' | 'warning' | 'error'
   */
  async sendLog(message, level = "info") {
    return this._post("/api/log", { message, level });
  },
  /**
   * Internal POST helper
   */
  async _post(path, data) {
    return new Promise((resolve) => {
      const payload = JSON.stringify(data);
      const req = http.request(
        {
          hostname: "localhost",
          port: 3001,
          // Multiverse Kernel port (from serve.js)
          path,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": payload.length
          }
        },
        (res) => {
          resolve(res.statusCode === 200);
        }
      );
      req.on("error", () => {
        resolve(false);
      });
      req.write(payload);
      req.end();
    });
  }
};
async function _safeExecute(fn, context = "dashboard-notifier") {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
export {
  dashboardNotifier
};
