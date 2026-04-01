import { BaseAgent } from './base-agent.js';

/**
 * Controller Agent
 * Manages and coordinates other agents in the Ultra-Dex ecosystem
 */
export class ControllerAgent extends BaseAgent {
  constructor(options = {}) {
    super('controller', {
      ...options,
      capabilities: ['coordination', 'scheduling', 'monitoring', 'resource-management']
    });
    
    this.agents = new Map();
    this.taskQueue = [];
    this.activeJobs = new Map();
    this.maxConcurrency = options.maxConcurrency || 5;
  }

  /**
   * Register an agent with the controller
   */
  registerAgent(agent) {
    this.agents.set(agent.id, agent);
    
    // Listen to agent events
    agent.on('task-complete', (event) => {
      this.emit('agent-task-complete', { agentId: agent.id, ...event });
    });
    
    agent.on('task-error', (event) => {
      this.emit('agent-task-error', { agentId: agent.id, ...event });
    });
    
    this.emit('agent-registered', { agent: agent.getStatus() });
  }

  /**
   * Distribute a task to the best available agent
   */
  async distributeTask(task) {
    // Find capable agents
    const capableAgents = Array.from(this.agents.values())
      .filter(agent => agent.canHandle(task.type) && agent.state === 'ready');

    if (capableAgents.length === 0) {
      throw new Error(`No capable agents available for task type: ${task.type}`);
    }

    // Simple round-robin selection
    const selectedAgent = capableAgents[0];
    
    this.emit('task-assigned', { 
      task, 
      agentId: selectedAgent.id, 
      agentName: selectedAgent.name 
    });

    try {
      const result = await selectedAgent.execute(task);
      return { success: true, result, agentId: selectedAgent.id };
    } catch (error) {
      this.emit('task-distribution-error', { task, agentId: selectedAgent.id, error });
      throw error;
    }
  }

  /**
   * Controller execution logic
   */
  async onExecute(task) {
    switch (task.type) {
      case 'status-report':
        return this.generateStatusReport();
      case 'distribute':
        return this.distributeTask(task.payload);
      case 'health-check':
        return this.performHealthCheck();
      default:
        return this.distributeTask(task);
    }
  }

  /**
   * Generate system status report
   */
  generateStatusReport() {
    const agents = Array.from(this.agents.values()).map(agent => agent.getStatus());
    const summary = {
      totalAgents: agents.length,
      readyAgents: agents.filter(a => a.state === 'ready').length,
      busyAgents: agents.filter(a => a.state === 'executing').length,
      errorAgents: agents.filter(a => a.state === 'error').length,
      capabilities: [...new Set(agents.flatMap(a => a.capabilities))]
    };

    return { summary, agents };
  }

  /**
   * Initialize controller
   */
  async onInitialize() {
    this.emit('controller-ready');
  }
}
