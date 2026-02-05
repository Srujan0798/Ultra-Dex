import { ChromeAgentsClient } from './chrome-agents.js';

export class BrowserOrchestrator {
  constructor(options = {}) {
    this.client = new ChromeAgentsClient(options);
  }

  async runTasks(tasks = []) {
    const results = [];
    for (const task of tasks) {
      results.push(await this.client.submitTask(task.text, task));
    }
    return results;
  }
}

export default BrowserOrchestrator;
