// Copyright (c) 2026 Ultra-Dex

export class AgentCoordinator {
  constructor(registry) {
    this.registry = registry;
  }

  select(task) {
    const description = (task?.description || '').toLowerCase();
    const agents = [];

    if (description.includes('security')) agents.push(this.registry.get('security'));
    if (description.includes('db') || description.includes('database')) agents.push(this.registry.get('database'));
    if (description.includes('ui') || description.includes('frontend')) agents.push(this.registry.get('frontend'));
    if (description.includes('api') || description.includes('backend')) agents.push(this.registry.get('backend'));

    if (!agents.length && this.registry.get) {
      const defaultAgent = this.registry.get('planner') || this.registry.get('reviewer');
      if (defaultAgent) agents.push(defaultAgent);
    }

    return agents;
  }
}
