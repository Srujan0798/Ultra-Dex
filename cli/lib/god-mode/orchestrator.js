import { orchestrate } from '../swarm/meta-orchestrator.js';

export async function runGodMode(agent, task, options = {}) {
  return orchestrate(`[${agent}] ${task}`, options);
}

export default { runGodMode };
