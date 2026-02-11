// Copyright (c) 2026 Ultra-Dex

export class AgentExecutor {
  constructor(agent) {
    this.agent = agent;
  }

  async execute(task) {
    if (!this.agent || typeof this.agent.execute !== 'function') {
      throw new Error('AgentExecutor requires an agent with execute()');
    }
    return this.agent.execute(task);
  }
}
