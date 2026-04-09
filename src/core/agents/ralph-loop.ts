var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { EventEmitter } from 'events';
let RALPHLoop = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.selfHealing = options.selfHealing || null;
    this.initialContext = Array.isArray(options.initialContext) ? options.initialContext : [];
    this.config = {
      maxIterations: options.maxIterations || 10,
      feedbackThreshold: options.feedbackThreshold || 0.7,
      maxExecutionTimeMs: options.maxExecutionTimeMs || 3e5,
      // 5 minutes default
      ...options,
    };
    this.iterations = [];
    this.learnings = [];
    this.state = 'idle';
  }
  /**
   * Execute RALPH loop with timeout protection
   */
  async executeRALPHLoop(problem, context = {}) {
    this.state = 'executing';
    let iteration = 0;
    let currentHypothesis = null;
    const initialContext = Array.isArray(context.initialContext)
      ? context.initialContext
      : this.initialContext;
    if (initialContext.length > 0) {
      const hydrationStartedAt = Date.now();
      context.prefetchedMemory = initialContext;
      context.memory = initialContext;
      const durationMs = Date.now() - hydrationStartedAt;
      const payload = {
        count: initialContext.length,
        durationMs,
        context: initialContext,
      };
      process.stdout.write(
        `Context pre-hydrated with ${initialContext.length} memories in ${durationMs}ms
`
      );
      this.emit('ralph.context-prehydrated', payload);
    }
    this.emit('ralph-loop.started', { problem });
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        const timeoutError = new Error(
          `RALPHLoop timeout after ${this.config.maxExecutionTimeMs}ms`
        );
        reject(timeoutError);
      }, this.config.maxExecutionTimeMs);
    });
    const loopPromise = (async () => {
      while (iteration < this.config.maxIterations) {
        iteration++;
        let activePhase = 'reasoning';
        const step = {
          iteration,
          timestamp: Date.now(),
          results: {},
        };
        try {
          activePhase = 'reasoning';
          const reasoning = await this.reason(problem, context, currentHypothesis);
          step.results.reasoning = reasoning;
          this.emit('ralph.reasoning', { iteration, reasoning });
          activePhase = 'analysis';
          const analysis = await this.analyze(reasoning, context);
          step.results.analysis = analysis;
          this.emit('ralph.analysis', { iteration, analysis });
          activePhase = 'planning';
          const plan = await this.plan(analysis, context);
          step.results.plan = plan;
          this.emit('ralph.planning', { iteration, plan });
          activePhase = 'hypothesis';
          currentHypothesis = await this.formHypothesis(plan, context);
          step.results.hypothesis = currentHypothesis;
          this.emit('ralph.hypothesis', { iteration, hypothesis: currentHypothesis });
          activePhase = 'learning';
          const learning = await this.learn(step, context);
          step.results.learning = learning;
          this.emit('ralph.learning', { iteration, learning });
          this.iterations.push(step);
          this.learnings.push(learning);
          if (currentHypothesis.confidence >= this.config.feedbackThreshold) {
            this.emit('ralph-loop.solution-found', {
              iteration,
              hypothesis: currentHypothesis,
            });
            break;
          }
        } catch (error) {
          step.error = error;
          const recovery = await this.recoverIterationFailure(error, {
            iteration,
            phase: activePhase,
            problem,
            partialResults: Object.keys(step.results),
          });
          if (recovery) {
            step.recovery = recovery;
            this.emit('agent.recovery', { iteration, phase: activePhase, recovery, error });
          }
          this.emit('ralph-loop.error', { iteration, error, recovery });
          this.iterations.push(step);
          break;
        }
      }
      this.state = 'completed';
      this.emit('ralph-loop.completed', { iterations: iteration });
      return {
        finalHypothesis: currentHypothesis,
        iterations: this.iterations.length,
        learnings: this.learnings,
      };
    })();
    try {
      return await Promise.race([loopPromise, timeoutPromise]);
    } catch (error) {
      if (error.message.includes('RALPHLoop timeout')) {
        this.emit('ralph.timeout', {
          maxExecutionTimeMs: this.config.maxExecutionTimeMs,
          iterationsCompleted: iteration,
        });
      }
      throw error;
    }
  }
  async getSelfHealing() {
    if (this.selfHealing) {
      return this.selfHealing;
    }
    try {
      const { SelfHealingOrchestrator } = await import('../reliability/self-healing.js');
      this.selfHealing = new SelfHealingOrchestrator();
      if (typeof this.selfHealing.initialize === 'function' && !this.selfHealing.initialized) {
        await this.selfHealing.initialize();
      }
    } catch {
      this.selfHealing = null;
    }
    return this.selfHealing;
  }
  async recoverIterationFailure(error, details = {}) {
    const selfHealing = await this.getSelfHealing();
    if (!selfHealing?.recoverAgentFailure) {
      return null;
    }
    try {
      return await selfHealing.recoverAgentFailure('ralph-loop', error, details);
    } catch (recoveryError) {
      return {
        agentId: 'ralph-loop',
        recovered: false,
        strategy: 'unavailable',
        timestamp: /* @__PURE__ */ new Date().toISOString(),
        diagnostics: {
          ...details,
          error: {
            name: recoveryError?.name || 'Error',
            message: recoveryError?.message || String(recoveryError),
          },
        },
      };
    }
  }
  /**
   * Reasoning phase
   */
  async reason(problem, context, previousHypothesis) {
    return {
      problem,
      previousFindings: previousHypothesis ? previousHypothesis.findings : [],
      reasoning: 'Analyzing the problem systematically...',
      insights: [],
    };
  }
  /**
   * Analysis phase
   */
  async analyze(reasoning, context) {
    return {
      dataPoints: [],
      patterns: [],
      anomalies: [],
      conclusion: 'Analysis suggests...',
    };
  }
  /**
   * Planning phase
   */
  async plan(analysis, context) {
    return {
      strategy: 'experiment',
      steps: [
        { step: 1, action: 'Observe' },
        { step: 2, action: 'Test' },
        { step: 3, action: 'Verify' },
      ],
      expectedOutcome: 'Test should confirm hypothesis',
    };
  }
  /**
   * Hypothesis formation
   */
  async formHypothesis(plan, context) {
    return {
      hypothesis: 'Based on analysis, the solution is...',
      confidence: 0.75,
      reasoning: [],
      findings: [],
      nextSteps: [],
    };
  }
  /**
   * Learning phase
   */
  async learn(step, context) {
    return {
      keyLearnings: ['Observation 1', 'Observation 2'],
      skillsAcquired: [],
      improvementsForNextIteration: [],
      timestamp: Date.now(),
    };
  }
  /**
   * Get iteration history
   */
  getIterationHistory() {
    return this.iterations;
  }
  /**
   * Get learnings summary
   */
  getLearningsSummary() {
    return this.learnings;
  }
  /**
   * Get current hypothesis
   */
  getCurrentHypothesis() {
    return this.iterations.length > 0
      ? this.iterations[this.iterations.length - 1].results.hypothesis
      : null;
  }
};
RALPHLoop = __decorateClass([singleton()], RALPHLoop);
async function runAutonomousTask(
  objective,
  options = {},
  orchestrator = null,
  executionContext = null
) {
  const loop = new RALPHLoop({
    ...options,
    initialContext: options.context?.initialContext || options.initialContext || [],
    selfHealing: options.selfHealing || orchestrator?.selfHealing || null,
  });
  const result = await loop.executeRALPHLoop(objective, {
    ...options.context,
    executionContext,
    orchestrator,
  });
  return {
    status: 'completed',
    objective,
    ...result,
  };
}
var ralph_loop_default = RALPHLoop;
export { RALPHLoop, ralph_loop_default as default, runAutonomousTask };
