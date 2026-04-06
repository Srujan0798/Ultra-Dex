function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildResultSummary(task, step, mode) {
  return {
    output: `Completed ${mode} task: ${task}`,
    agent: step.agent,
    stepId: step.id,
  };
}

export class Orchestrator {
  async orchestrate(task, mode = 'simple', options = {}) {
    if (typeof task !== 'string' || task.trim() === '') {
      throw new Error('UltraDex SDK: task must be a non-empty string');
    }

    const assignedAgents = Array.isArray(options.agents) ? options.agents.filter(Boolean) : [];
    const primaryAgent = assignedAgents[0] || 'orchestrator';

    return {
      run_id: createId('run'),
      task,
      mode,
      provider: options.provider || null,
      agents: assignedAgents,
      steps: [
        {
          id: createId('step'),
          type: mode,
          agent: primaryAgent,
          input: task,
        },
      ],
    };
  }
}

export class ExecutionEngine {
  async execute(executionTask) {
    const startedAt = Date.now();
    const results = {};

    for (const step of executionTask.steps) {
      results[step.id] = buildResultSummary(executionTask.task, step, executionTask.mode);
    }

    return {
      run_id: executionTask.run_id,
      status: 'completed',
      results,
      agents: executionTask.agents || [],
      steps: executionTask.steps.map((step) => step.id),
      duration: Date.now() - startedAt,
      trace: {
        mode: executionTask.mode,
        provider: executionTask.provider,
        stepCount: executionTask.steps.length,
      },
    };
  }

  async *executeStream(executionTask, options = {}) {
    const startedAt = Date.now();
    const totalSteps = executionTask.steps.length;
    const startEvent = {
      type: 'start',
      taskId: executionTask.run_id,
      totalSteps,
      status: 'running',
    };

    options.onProgress?.(startEvent);
    yield startEvent;

    const results = {};
    let stepIndex = 0;

    for (const step of executionTask.steps) {
      if (options.cancellationToken?.aborted) {
        throw new Error('Execution cancelled');
      }

      stepIndex += 1;
      const stepStartEvent = {
        type: 'step_start',
        taskId: executionTask.run_id,
        stepId: step.id,
        stepIndex,
        totalSteps,
        stepType: step.type,
        agent: step.agent,
        status: 'running',
      };
      options.onProgress?.(stepStartEvent);
      yield stepStartEvent;

      const result = buildResultSummary(executionTask.task, step, executionTask.mode);
      results[step.id] = result;

      const stepCompleteEvent = {
        type: 'step_complete',
        taskId: executionTask.run_id,
        stepId: step.id,
        stepIndex,
        totalSteps,
        stepType: step.type,
        agent: step.agent,
        result,
        status: 'completed',
      };
      options.onProgress?.(stepCompleteEvent);
      yield stepCompleteEvent;
    }

    const completeEvent = {
      type: 'complete',
      taskId: executionTask.run_id,
      results,
      duration: Date.now() - startedAt,
      status: 'completed',
      trace: {
        mode: executionTask.mode,
        provider: executionTask.provider,
        stepCount: totalSteps,
      },
    };
    options.onProgress?.(completeEvent);
    yield completeEvent;
  }
}

export class ObservabilitySystem {
  constructor() {
    this.events = [];
  }

  log(event, data = {}) {
    const entry = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    this.events.push(entry);
    return entry;
  }

  getEvents() {
    return [...this.events];
  }

  clear() {
    this.events = [];
  }
}

export class DistributedCoordinator {
  constructor(options = {}) {
    this.instanceId = options.instanceId || createId('node');
    this.status = 'initializing';
    this.discoveryUrls = options.discoveryUrls || [];
    this.orchestrator = options.orchestrator || new Orchestrator();
    this.executionEngine = options.executionEngine || new ExecutionEngine();
    this.peers = new Map();

    for (const url of this.discoveryUrls) {
      const peerId = createId('peer');
      this.peers.set(peerId, {
        id: peerId,
        url,
        status: 'connected',
        lastSeen: Date.now(),
        configured: true,
      });
    }
  }

  async initialize() {
    this.status = 'active';
    return this;
  }

  addDistributedPeer(peerUrl) {
    const peerId = createId('peer');
    this.peers.set(peerId, {
      id: peerId,
      url: peerUrl,
      status: 'connected',
      lastSeen: Date.now(),
      configured: true,
    });
    return this;
  }

  removeDistributedPeer(peerUrl) {
    for (const [peerId, peer] of this.peers) {
      if (peer.url === peerUrl) {
        this.peers.delete(peerId);
        break;
      }
    }
    return this;
  }

  listDistributedPeers() {
    return Array.from(this.peers.values());
  }

  selectPeerForTask() {
    return this.peers.values().next().value || null;
  }

  async submitTask(task, options = {}) {
    const executionTask = await this.orchestrator.orchestrate(task, options.mode || 'distributed', {
      provider: options.provider,
      agents: options.agents,
    });
    const result = await this.executionEngine.execute(executionTask);

    return {
      taskId: result.run_id,
      result: result.results,
      success: result.status === 'completed',
      trace: result.trace,
    };
  }

  async *executeTaskLocallyStream(task, options = {}) {
    const executionTask = await this.orchestrator.orchestrate(task, options.mode || 'distributed', {
      provider: options.provider,
      agents: options.agents,
    });
    yield* this.executionEngine.executeStream(executionTask, options);
  }

  getMetrics() {
    return {
      instanceId: this.instanceId,
      status: this.status,
      peerCount: this.peers.size,
    };
  }

  async shutdown() {
    this.status = 'shutdown';
    this.peers.clear();
  }
}
