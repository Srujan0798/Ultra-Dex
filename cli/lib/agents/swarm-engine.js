// Copyright (c) 2026 Ultra-Dex

import { AgentSwarm } from './swarm.js';

export class SwarmEngine {
  constructor(agents = []) {
    this.swarm = new AgentSwarm(agents);
  }

  add(agent) {
    this.swarm.addAgent(agent);
    return this;
  }

  async run(task, mode = 'parallel') {
    if (mode === 'sequential') return this.swarm.runSequential(task);
    if (mode === 'waterfall') return this.swarm.runWaterfall(task);
    return this.swarm.runParallel(task);
  }
}
