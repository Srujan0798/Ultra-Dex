/**
 * Ultra-Dex Agent Communication Protocol v3.0
 * Defines schema for agent handoffs, execution state, and rollback support.
 */

// ============================================================================
// AGENT MESSAGE CLASS
// ============================================================================

/**
 * Represents a message passed between agents in the swarm.
 */
export class AgentMessage {
  constructor(from, to, content, context = {}) {
    // Validate required parameters
    if (!from || typeof from !== 'string') {
      throw new Error('from is required and must be a string');
    }
    if (!to || typeof to !== 'string') {
      throw new Error('to is required and must be a string');
    }
    if (content === undefined || content === null) {
      throw new Error('content is required');
    }

    this.id = crypto.randomUUID();
    this.from = from;
    this.to = to;
    this.content = content;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.metadata = {
      retryCount: 0,
      priority: 'normal',
      tags: []
    };
  }

  /**
   * Create a reply message to this message.
   */
  reply(content, additionalContext = {}) {
    return new AgentMessage(
      this.to,
      this.from,
      content,
      { ...this.context, ...additionalContext }
    );
  }

  /**
   * Forward this message to another agent.
   */
  forward(newTo, additionalContent = '') {
    const forwardedContent = additionalContent 
      ? `${additionalContent}\n\n---\nForwarded from ${this.from}:\n${this.content}`
      : this.content;
    return new AgentMessage(this.to, newTo, forwardedContent, this.context);
  }

  /**
   * Serialize to JSON.
   */
  toJSON() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      content: this.content,
      context: this.context,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON object.
   */
  static fromJSON(json) {
    const msg = new AgentMessage(json.from, json.to, json.content, json.context);
    msg.id = json.id;
    msg.timestamp = json.timestamp;
    msg.metadata = json.metadata || { retryCount: 0, priority: 'normal', tags: [] };
    return msg;
  }
}

// ============================================================================
// HANDOFF PAYLOAD CLASS
// ============================================================================

/**
 * Represents the data passed during agent handoffs.
 */
export class HandoffPayload {
  constructor(previousAgent, nextAgent, options = {}) {
    // Validate required parameters
    if (!previousAgent || typeof previousAgent !== 'string') {
      throw new Error('previousAgent is required and must be a string');
    }
    if (!nextAgent || typeof nextAgent !== 'string') {
      throw new Error('nextAgent is required and must be a string');
    }

    this.id = crypto.randomUUID();
    this.previousAgent = previousAgent;
    this.nextAgent = nextAgent;
    this.summary = options.summary || '';
    this.artifacts = Array.isArray(options.artifacts) ? options.artifacts : [];
    this.decisions = Array.isArray(options.decisions) ? options.decisions : [];
    this.constraints = Array.isArray(options.constraints) ? options.constraints : [];
    this.nextTask = options.nextTask || '';
    this.context = options.context || {};
    this.timestamp = new Date().toISOString();
  }

  /**
   * Add an artifact to the handoff.
   */
  addArtifact(filePath, description = '') {
    this.artifacts.push({ path: filePath, description });
    return this;
  }

  /**
   * Add a decision made by the previous agent.
   */
  addDecision(decision) {
    this.decisions.push(decision);
    return this;
  }

  /**
   * Add a constraint for the next agent.
   */
  addConstraint(constraint) {
    this.constraints.push(constraint);
    return this;
  }

  /**
   * Generate handoff message for the next agent.
   */
  toMessage() {
    const content = `
## Handoff: ${this.previousAgent} → ${this.nextAgent}

### Summary
${this.summary}

### Artifacts
${this.artifacts.map(a => `- ${a.path}${a.description ? `: ${a.description}` : ''}`).join('\n') || 'None'}

### Decisions Made
${this.decisions.map(d => `- ${d}`).join('\n') || 'None'}

### Constraints
${this.constraints.map(c => `- ${c}`).join('\n') || 'None'}

### Your Task
${this.nextTask}
    `.trim();

    return new AgentMessage(this.previousAgent, this.nextAgent, content, this.context);
  }

  /**
   * Serialize to JSON.
   */
  toJSON() {
    return {
      id: this.id,
      previousAgent: this.previousAgent,
      nextAgent: this.nextAgent,
      summary: this.summary,
      artifacts: this.artifacts,
      decisions: this.decisions,
      constraints: this.constraints,
      nextTask: this.nextTask,
      context: this.context,
      timestamp: this.timestamp
    };
  }

  /**
   * Create from JSON object.
   */
  static fromJSON(json) {
    const payload = new HandoffPayload(json.previousAgent, json.nextAgent, {
      summary: json.summary,
      artifacts: json.artifacts,
      decisions: json.decisions,
      constraints: json.constraints,
      nextTask: json.nextTask,
      context: json.context
    });
    payload.id = json.id;
    payload.timestamp = json.timestamp;
    return payload;
  }
}

// ============================================================================
// EXECUTION TRACE CLASS
// ============================================================================

/**
 * Tracks the execution history of a swarm task.
 */
export class ExecutionTrace {
  constructor(taskId, goal) {
    this.taskId = taskId || crypto.randomUUID();
    this.goal = goal || '';
    this.status = 'pending'; // pending | planning | executing | completed | failed | rolled_back
    this.pipeline = [];
    this.results = {};
    this.errors = [];
    this.checkpoints = [];
    this.rollbackHistory = [];
    this.startTime = null;
    this.endTime = null;
    this.metadata = {
      complexity: 'unknown',
      tiersUsed: [],
      parallelExecutions: 0
    };
  }

  /**
   * Start execution tracking.
   */
  start() {
    this.status = 'executing';
    this.startTime = new Date().toISOString();
    return this;
  }

  /**
   * Add a step to the pipeline.
   */
  addStep(step, agent, task, dependencies = []) {
    // Validate required parameters
    if (step === undefined || step === null) {
      throw new Error('step is required');
    }
    if (!agent || typeof agent !== 'string') {
      throw new Error('agent is required and must be a string');
    }
    if (task === undefined || task === null) {
      throw new Error('task is required');
    }
    if (!Array.isArray(dependencies)) {
      throw new Error('dependencies must be an array');
    }

    this.pipeline.push({
      step,
      agent,
      task,
      dependencies,
      status: 'pending',
      startTime: null,
      endTime: null
    });
    return this;
  }

  /**
   * Mark a step as started.
   */
  startStep(step) {
    const pipelineStep = this.pipeline.find(s => s.step === step);
    if (pipelineStep) {
      pipelineStep.status = 'executing';
      pipelineStep.startTime = new Date().toISOString();
    }
    return this;
  }

  /**
   * Record result from an agent.
   */
  recordResult(agent, output, success = true) {
    // Validate required parameters
    if (!agent || typeof agent !== 'string') {
      throw new Error('agent is required and must be a string');
    }

    const step = this.pipeline.find(s => s.agent === agent && s.status === 'executing');
    if (step) {
      step.status = success ? 'completed' : 'failed';
      step.endTime = new Date().toISOString();
    }

    this.results[agent] = {
      success,
      output,
      timestamp: new Date().toISOString()
    };

    if (!success) {
      this.errors.push({
        agent,
        error: output,
        timestamp: new Date().toISOString()
      });
    }
    return this;
  }

  /**
   * Create a checkpoint for potential rollback.
   */
  createCheckpoint(name, state = {}) {
    // Validate required parameters
    if (!name || typeof name !== 'string') {
      throw new Error('name is required and must be a string');
    }

    const checkpoint = {
      id: crypto.randomUUID(),
      name,
      step: this.pipeline.filter(s => s.status === 'completed').length,
      state: JSON.parse(JSON.stringify(state)),
      timestamp: new Date().toISOString()
    };
    this.checkpoints.push(checkpoint);
    return checkpoint;
  }

  /**
   * Get the last checkpoint.
   */
  getLastCheckpoint() {
    return this.checkpoints[this.checkpoints.length - 1] || null;
  }

  /**
   * Rollback to a specific checkpoint.
   */
  rollbackTo(checkpointId) {
    const checkpointIndex = this.checkpoints.findIndex(c => c.id === checkpointId);
    if (checkpointIndex === -1) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    const checkpoint = this.checkpoints[checkpointIndex];
    
    // Record rollback action
    this.rollbackHistory.push({
      fromStep: this.pipeline.filter(s => s.status === 'completed').length,
      toCheckpoint: checkpointId,
      timestamp: new Date().toISOString()
    });

    // Reset steps after checkpoint
    for (const step of this.pipeline) {
      if (step.step > checkpoint.step) {
        step.status = 'pending';
        step.startTime = null;
        step.endTime = null;
        delete this.results[step.agent];
      }
    }

    // Remove errors after checkpoint
    this.errors = this.errors.filter(e => {
      const step = this.pipeline.find(s => s.agent === e.agent);
      return step && step.step <= checkpoint.step;
    });

    this.status = 'executing';
    return checkpoint.state;
  }

  /**
   * Mark execution as complete.
   */
  complete(success = true) {
    this.status = success ? 'completed' : 'failed';
    this.endTime = new Date().toISOString();
    return this;
  }

  /**
   * Get execution duration in milliseconds.
   */
  getDuration() {
    if (!this.startTime) return 0;
    const end = this.endTime ? new Date(this.endTime) : new Date();
    return end - new Date(this.startTime);
  }

  /**
   * Get formatted duration string.
   */
  getDurationFormatted() {
    const ms = this.getDuration();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Get list of all artifacts from results.
   */
  getArtifacts() {
    const artifacts = [];
    for (const [agent, result] of Object.entries(this.results)) {
      if (result.success && result.output?.artifacts) {
        artifacts.push(...result.output.artifacts);
      }
    }
    return artifacts;
  }

  /**
   * Get execution summary.
   */
  getSummary() {
    const completed = this.pipeline.filter(s => s.status === 'completed').length;
    const failed = this.pipeline.filter(s => s.status === 'failed').length;
    const pending = this.pipeline.filter(s => s.status === 'pending').length;
    
    return {
      taskId: this.taskId,
      goal: this.goal,
      status: this.status,
      duration: this.getDurationFormatted(),
      progress: {
        completed,
        failed,
        pending,
        total: this.pipeline.length
      },
      agents: this.pipeline.map(s => s.agent),
      errors: this.errors.length,
      rollbacks: this.rollbackHistory.length
    };
  }

  /**
   * Serialize to JSON.
   */
  toJSON() {
    return {
      taskId: this.taskId,
      goal: this.goal,
      status: this.status,
      pipeline: this.pipeline,
      results: this.results,
      errors: this.errors,
      checkpoints: this.checkpoints,
      rollbackHistory: this.rollbackHistory,
      startTime: this.startTime,
      endTime: this.endTime,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON object.
   */
  static fromJSON(json) {
    const trace = new ExecutionTrace(json.taskId, json.goal);
    trace.status = json.status;
    trace.pipeline = json.pipeline;
    trace.results = json.results;
    trace.errors = json.errors;
    trace.checkpoints = json.checkpoints;
    trace.rollbackHistory = json.rollbackHistory;
    trace.startTime = json.startTime;
    trace.endTime = json.endTime;
    trace.metadata = json.metadata;
    return trace;
  }
}

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

/**
 * Input/Output schemas for each agent type.
 */
export const AgentSchemas = {
  // Leadership Tier
  planner: {
    input: {
      feature: 'string',
      constraints: 'string[]',
      timeEstimate: 'string?'
    },
    output: {
      tasks: 'Task[]',
      timeline: 'string',
      risks: 'string[]'
    }
  },
  cto: {
    input: {
      decision: 'string',
      options: 'string[]',
      context: 'string'
    },
    output: {
      recommendation: 'string',
      reasoning: 'string',
      tradeoffs: 'string[]'
    }
  },
  research: {
    input: {
      topic: 'string',
      criteria: 'string[]'
    },
    output: {
      findings: 'Finding[]',
      recommendation: 'string',
      sources: 'string[]'
    }
  },

  // Development Tier
  backend: {
    input: {
      task: 'string',
      requirements: 'string[]',
      existingCode: 'string?'
    },
    output: {
      code: 'string',
      files: 'FileChange[]',
      tests: 'string[]'
    }
  },
  frontend: {
    input: {
      component: 'string',
      design: 'string?',
      requirements: 'string[]'
    },
    output: {
      code: 'string',
      files: 'FileChange[]',
      styles: 'string?'
    }
  },
  database: {
    input: {
      schema: 'string',
      requirements: 'string[]'
    },
    output: {
      migration: 'string',
      files: 'FileChange[]',
      queries: 'string[]'
    }
  },

  // Security Tier
  auth: {
    input: {
      authType: 'string',
      requirements: 'string[]'
    },
    output: {
      implementation: 'string',
      files: 'FileChange[]',
      config: 'object'
    }
  },
  security: {
    input: {
      target: 'string',
      scope: 'string[]'
    },
    output: {
      vulnerabilities: 'Vulnerability[]',
      recommendations: 'string[]',
      severity: 'string'
    }
  },

  // DevOps Tier
  devops: {
    input: {
      task: 'string',
      environment: 'string',
      config: 'object?'
    },
    output: {
      commands: 'string[]',
      files: 'FileChange[]',
      status: 'string'
    }
  },

  // Quality Tier
  testing: {
    input: {
      target: 'string',
      testType: 'string',
      coverage: 'number?'
    },
    output: {
      tests: 'Test[]',
      files: 'FileChange[]',
      coverage: 'number'
    }
  },
  reviewer: {
    input: {
      code: 'string',
      context: 'string'
    },
    output: {
      approved: 'boolean',
      comments: 'Comment[]',
      suggestions: 'string[]'
    }
  },
  debugger: {
    input: {
      issue: 'string',
      logs: 'string?',
      reproduction: 'string?'
    },
    output: {
      rootCause: 'string',
      fix: 'string',
      files: 'FileChange[]'
    }
  },
  documentation: {
    input: {
      target: 'string',
      docType: 'string'
    },
    output: {
      content: 'string',
      files: 'FileChange[]'
    }
  },

  // Specialist Tier
  performance: {
    input: {
      target: 'string',
      metrics: 'string[]?'
    },
    output: {
      analysis: 'string',
      optimizations: 'Optimization[]',
      files: 'FileChange[]'
    }
  },
  refactoring: {
    input: {
      target: 'string',
      goals: 'string[]'
    },
    output: {
      changes: 'string',
      files: 'FileChange[]',
      improvements: 'string[]'
    }
  }
};

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy protocol object for backward compatibility.
 */
export const AgentProtocol = {
  Message: {
    id: 'uuid',
    from: 'agent_name',
    to: 'agent_name',
    content: 'string',
    context: {},
    timestamp: 'ISO8601'
  },
  SwarmState: {
    taskId: 'uuid',
    status: 'planning|executing|reviewing|completed|failed',
    pipeline: [],
    results: {},
    errors: [],
    startTime: 'ISO8601',
    endTime: 'ISO8601'
  },
  Handover: {
    previousAgent: 'string',
    nextAgent: 'string',
    artifacts: [],
    summary: 'string'
  }
};

/**
 * Legacy function for creating messages.
 */
export function createMessage(from, to, content, context = {}) {
  return new AgentMessage(from, to, content, context);
}

/**
 * Legacy function for creating handovers.
 */
export function createHandover(previousAgent, nextAgent, summary, artifacts = []) {
  return new HandoffPayload(previousAgent, nextAgent, { summary, artifacts });
}
