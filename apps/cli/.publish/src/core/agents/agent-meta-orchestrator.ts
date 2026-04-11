const { ControllerAgent } = require('./controller-agent');
const { EventEmitter } = require('events');
class AgentMetaOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.controllers = /* @__PURE__ */ new Map();
    this.workflows = /* @__PURE__ */ new Map();
    this.globalState = 'idle';
    this.config = options;
  }
  /**
   * Register a controller with the meta orchestrator
   */
  registerController(controller, domain = 'default') {
    this.controllers.set(domain, controller);
    controller.on('task-assigned', (event) => {
      this.emit('meta-task-assigned', { domain, ...event });
    });
    controller.on('agent-registered', (event) => {
      this.emit('meta-agent-registered', { domain, ...event });
    });
    this.emit('controller-registered', { domain, controllerId: controller.id });
  }
  /**
   * Create and manage a complex workflow across multiple domains
   */
  async executeWorkflow(workflowDefinition) {
    const workflowId = `workflow-${Date.now()}`;
    this.workflows.set(workflowId, {
      definition: workflowDefinition,
      state: 'running',
      startTime: Date.now(),
      steps: [],
    });
    this.emit('workflow-started', { workflowId, definition: workflowDefinition });
    try {
      const result = await this.processWorkflowSteps(workflowId, workflowDefinition.steps);
      this.workflows.get(workflowId).state = 'completed';
      this.emit('workflow-completed', { workflowId, result });
      return result;
    } catch (error) {
      this.workflows.get(workflowId).state = 'failed';
      this.emit('workflow-failed', { workflowId, error });
      throw error;
    }
  }
  /**
   * Process workflow steps sequentially or in parallel
   */
  async processWorkflowSteps(workflowId, steps) {
    const results = [];
    const workflow = this.workflows.get(workflowId);
    for (const step of steps) {
      const stepResult = await this.executeWorkflowStep(workflowId, step);
      results.push(stepResult);
      workflow.steps.push({ step, result: stepResult, timestamp: Date.now() });
      this.emit('workflow-step-completed', { workflowId, step, result: stepResult });
    }
    return results;
  }
  /**
   * Execute a single workflow step
   */
  async executeWorkflowStep(workflowId, step) {
    const { domain = 'default', task, dependencies = [] } = step;
    for (const dep of dependencies) {
      if (!this.isDependencySatisfied(workflowId, dep)) {
        throw new Error(`Dependency ${dep} not satisfied for step in workflow ${workflowId}`);
      }
    }
    const controller = this.controllers.get(domain);
    if (!controller) {
      throw new Error(`No controller registered for domain: ${domain}`);
    }
    return await controller.execute(task);
  }
  /**
   * Check if a dependency is satisfied
   */
  isDependencySatisfied(workflowId, dependency) {
    const workflow = this.workflows.get(workflowId);
    return workflow.steps.some((step) => step.step.id === dependency && step.result.success);
  }
  /**
   * Get comprehensive system status across all controllers
   */
  getSystemStatus() {
    const controllerStatuses = {};
    for (const [domain, controller] of this.controllers) {
      controllerStatuses[domain] = controller.generateStatusReport();
    }
    const workflows = Array.from(this.workflows.entries()).map(([id, workflow]) => ({
      id,
      state: workflow.state,
      startTime: workflow.startTime,
      stepCount: workflow.steps.length,
    }));
    return {
      globalState: this.globalState,
      controllers: controllerStatuses,
      activeWorkflows: workflows.filter((w) => w.state === 'running'),
      completedWorkflows: workflows.filter((w) => w.state === 'completed'),
      failedWorkflows: workflows.filter((w) => w.state === 'failed'),
    };
  }
  /**
   * Emergency shutdown of all controllers and workflows
   */
  async emergencyShutdown() {
    this.globalState = 'shutting-down';
    this.emit('emergency-shutdown-initiated');
    for (const [workflowId, workflow] of this.workflows) {
      if (workflow.state === 'running') {
        workflow.state = 'cancelled';
        this.emit('workflow-cancelled', { workflowId });
      }
    }
    for (const [domain, controller] of this.controllers) {
      try {
        await controller.shutdown();
        this.emit('controller-shutdown', { domain });
      } catch (error) {
        this.emit('controller-shutdown-error', { domain, error });
      }
    }
    this.globalState = 'shutdown';
    this.emit('emergency-shutdown-completed');
  }
}
module.exports = { AgentMetaOrchestrator };
