// Copyright (c) 2026 Ultra-Dex

/**
 * LangGraph State Machine
 * Implements state management for agent workflows
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../utils/errors.js';

/**
 * State Machine for Agent Workflows
 */
export class AgentStateMachine {
  constructor(initialState = {}, options = {}) {
    this.state = {
      currentStep: 'init',
      status: 'idle',
      agents: [],
      tasks: [],
      results: {},
      errors: [],
      metadata: {
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '3.7.2',
      },
      ...initialState,
    };

    this.transitions = new Map();
    this.history = [];
    this.executor = options.executor || null;
  }

  /**
   * Load a persisted state machine from disk (or create a fresh one).
   */
  static async load(filePath) {
    const machine = new AgentStateMachine();
    await machine.loadState(filePath);
    return machine;
  }

  /**
   * Define a transition between states
   */
  addTransition(from, to, condition = () => true, action = null) {
    const key = `${from}->${to}`;
    this.transitions.set(key, { from, to, condition, action });
  }

  /**
   * Transition to a new state
   */
  async transition(newState, data = {}) {
    const transitionKey = `${this.state.currentStep}->${newState}`;
    const transition = this.transitions.get(transitionKey);

    if (!transition) {
      throw new AppError(`Invalid transition: ${this.state.currentStep} -> ${newState}`, {
        code: 'INVALID_TRANSITION',
      });
    }

    if (!transition.condition(data)) {
      throw new AppError(`Transition condition failed: ${transitionKey}`, {
        code: 'TRANSITION_CONDITION_FAILED',
      });
    }

    // Execute transition action if exists
    if (transition.action) {
      await transition.action(data);
    }

    // Record transition in history
    this.history.push({
      from: this.state.currentStep,
      to: newState,
      data,
      timestamp: new Date().toISOString(),
    });

    // Update state
    this.state.currentStep = newState;
    this.state.status = this.deriveStatusFromStep(newState);
    this.state.updatedAt = new Date().toISOString();

    // Store any result data
    if (data.result) {
      this.state.results[newState] = data.result;
    }

    return { ...this.state };
  }

  /**
   * Set state directly (bypasses transition rules).
   */
  setState(step, data = {}) {
    const previousStep = this.state.currentStep;
    if (data && typeof data === 'object') {
      this.updateState(data);
    }

    this.state.currentStep = step;
    this.state.status = this.deriveStatusFromStep(step);
    this.state.updatedAt = new Date().toISOString();

    this.history.push({
      from: previousStep,
      to: step,
      data,
      timestamp: new Date().toISOString(),
    });

    return { ...this.state };
  }

  /**
   * Derive status from step
   */
  deriveStatusFromStep(step) {
    const statusMap = {
      init: 'initializing',
      planning: 'in_progress',
      implementing: 'in_progress',
      testing: 'in_progress',
      reviewing: 'in_progress',
      deploying: 'in_progress',
      completed: 'completed',
      failed: 'failed',
    };

    return statusMap[step] || 'running';
  }

  /**
   * Execute an agent task
   */
  async executeAgent(agentName, task, context = {}) {
    const agentStart = Date.now();

    try {
      printInfo(chalk.blue(`🤖 Executing agent: ${agentName}`));

      // Update state to reflect agent execution
      this.state.currentAgent = agentName;
      this.state.currentTask = task;
      this.state.status = 'executing';
      this.state.updatedAt = new Date().toISOString();

      const result = await this.executeAgentCore(agentName, task, context);

      // Record agent execution
      this.state.agents.push({
        name: agentName,
        task,
        status: 'completed',
        result,
        startedAt: new Date(agentStart).toISOString(),
        completedAt: new Date().toISOString(),
        duration: Date.now() - agentStart,
      });

      printSuccess(chalk.green(`✅ Agent ${agentName} completed task: ${task}`));

      return result;
    } catch (error) {
      // Record error
      this.state.errors.push({
        agent: agentName,
        task,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      this.state.status = 'failed';
      this.state.updatedAt = new Date().toISOString();

      printError(chalk.red(`❌ Agent ${agentName} failed: ${error.message}`));

      throw error;
    }
  }

  /**
   * Execute an agent using the injected executor, or simulate if none is provided.
   */
  async executeAgentCore(agentName, task, context) {
    if (typeof this.executor === 'function') {
      return this.executor(agentName, task, context);
    }

    // Simulate agent work with random delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 500));

    return {
      success: true,
      result: `Simulated execution of "${task}" by ${agentName}`,
      metadata: {
        agent: agentName,
        task,
        context,
        simulated: true,
      },
    };
  }

  /**
   * Set a custom executor for agent execution.
   */
  setExecutor(executor) {
    this.executor = executor;
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update state with new data
   */
  updateState(newState) {
    this.state = { ...this.state, ...newState, updatedAt: new Date().toISOString() };
  }

  /**
   * Get state history
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Save state to file
   */
  async saveState(filePath) {
    const statePath = filePath || path.join(process.cwd(), '.ultra-dex', 'state-machine.json');

    try {
      await fs.mkdir(path.dirname(statePath), { recursive: true });
      await fs.writeFile(statePath, JSON.stringify(this.state, null, 2));

      printSuccess(chalk.green(`💾 State saved to: ${statePath}`));
    } catch (error) {
      printError(chalk.red(`❌ Failed to save state: ${error.message}`));
      throw new AppError(`Failed to save state: ${error.message}`, {
        code: 'STATE_SAVE_FAILED',
      });
    }
  }

  /**
   * Save state to disk (alias for saveState).
   */
  async save(filePath) {
    return this.saveState(filePath);
  }

  /**
   * Load state from file
   */
  async loadState(filePath) {
    const statePath = filePath || path.join(process.cwd(), '.ultra-dex', 'state-machine.json');

    try {
      const content = await fs.readFile(statePath, 'utf8');
      const loadedState = JSON.parse(content);

      this.state = { ...this.state, ...loadedState };

      printSuccess(chalk.green(`📂 State loaded from: ${statePath}`));
    } catch (error) {
      if (error.code === 'ENOENT') {
        printWarning(chalk.yellow(`⚠️  State file not found: ${statePath}, starting fresh`));
        return null;
      }

      printError(chalk.red(`❌ Failed to load state: ${error.message}`));
      throw new AppError(`Failed to load state: ${error.message}`, {
        code: 'STATE_LOAD_FAILED',
      });
    }
  }

  /**
   * Reset state machine
   */
  reset() {
    this.state = {
      currentStep: 'init',
      status: 'idle',
      agents: [],
      tasks: [],
      results: {},
      errors: [],
      metadata: {
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '3.7.2',
      },
    };

    this.history = [];
    printInfo(chalk.cyan('🔄 State machine reset'));
  }

  /**
   * Get state summary
   */
  getSummary() {
    const completedAgents = this.state.agents.filter((a) => a.status === 'completed').length;
    const totalAgents = this.state.agents.length;
    const errorCount = this.state.errors.length;

    return {
      currentStep: this.state.currentStep,
      status: this.state.status,
      progress: totalAgents > 0 ? Math.round((completedAgents / totalAgents) * 100) : 0,
      completedAgents,
      totalAgents,
      errorCount,
      totalTransitions: this.history.length,
      startedAt: this.state.metadata.startedAt,
      updatedAt: this.state.updatedAt,
    };
  }
}

export const StateMachine = AgentStateMachine;

/**
 * Create a standard agent workflow state machine
 */
export function createStandardAgentWorkflow() {
  const sm = new AgentStateMachine({
    currentStep: 'init',
    status: 'idle',
    workflowType: 'standard-agent-flow',
  });

  // Define standard transitions for agent workflow
  sm.addTransition(
    'init',
    'planning',
    () => true,
    async (_data) => printInfo(chalk.blue('📋 Starting planning phase...'))
  );

  sm.addTransition(
    'planning',
    'implementation',
    (data) => data.plan && data.plan.valid,
    async (_data) => printInfo(chalk.blue('🛠️  Starting implementation phase...'))
  );

  sm.addTransition(
    'implementation',
    'testing',
    (data) => data.implementation && data.implementation.completed,
    async (_data) => printInfo(chalk.blue('🧪 Starting testing phase...'))
  );

  sm.addTransition(
    'testing',
    'review',
    (data) => data.tests && data.tests.passed,
    async (_data) => printInfo(chalk.blue('🔍 Starting review phase...'))
  );

  sm.addTransition(
    'review',
    'deployment',
    (data) => data.review && data.review.approved,
    async (_data) => printInfo(chalk.blue('🚀 Starting deployment phase...'))
  );

  sm.addTransition(
    'deployment',
    'completed',
    (data) => data.deployment && data.deployment.success,
    async (_data) => printSuccess(chalk.green('✅ Workflow completed successfully!'))
  );

  // Error transitions
  sm.addTransition(
    'planning',
    'failed',
    (data) => data.error && data.step === 'planning',
    async (_data) => printError(chalk.red('❌ Planning failed'))
  );

  sm.addTransition(
    'implementation',
    'failed',
    (data) => data.error && data.step === 'implementation',
    async (_data) => printError(chalk.red('❌ Implementation failed'))
  );

  return sm;
}

/**
 * Create a multi-agent swarm state machine
 */
export function createSwarmStateMachine() {
  const sm = new AgentStateMachine({
    currentStep: 'init',
    status: 'idle',
    workflowType: 'multi-agent-swarm',
  });

  // Define transitions for swarm workflow
  sm.addTransition(
    'init',
    'coordinating',
    () => true,
    async (_data) => printInfo(chalk.magenta('🐝 Starting agent swarm coordination...'))
  );

  sm.addTransition(
    'coordinating',
    'executing',
    (data) => data.coordinated,
    async (_data) => printInfo(chalk.magenta('🤖 Agents executing tasks...'))
  );

  sm.addTransition(
    'executing',
    'synthesizing',
    (data) => data.executionComplete,
    async (_data) => printInfo(chalk.magenta('🔗 Synthesizing agent outputs...'))
  );

  sm.addTransition(
    'synthesizing',
    'validating',
    (data) => data.synthesisComplete,
    async (_data) => printInfo(chalk.magenta('✅ Validating outputs...'))
  );

  sm.addTransition(
    'validating',
    'completed',
    (data) => data.validationPassed,
    async (_data) => printSuccess(chalk.magenta('🎉 Swarm completed successfully!'))
  );

  // Error handling
  sm.addTransition(
    'executing',
    'failed',
    (data) => data.error,
    async (_data) => printError(chalk.red('❌ Swarm execution failed'))
  );

  return sm;
}

export default {
  AgentStateMachine,
  createStandardAgentWorkflow,
  createSwarmStateMachine,
};
