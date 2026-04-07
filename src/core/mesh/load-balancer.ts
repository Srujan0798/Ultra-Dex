var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
import { singleton, inject } from "tsyringe";
import { DI_TOKENS } from '../di/tokens.js';
let LoadBalancer = class {
  constructor(logger, config, workerPool) {
    this.logger = logger;
    this.config = config;
    this.workerPool = workerPool;
  }
  roundRobinIndex = 0;
  stats = {
    totalRoutings: 0,
    successfulRoutings: 0,
    failedRoutings: 0,
    averageDecisionTime: 0,
    strategyUsage: {
      "round-robin": 0,
      "least-loaded": 0,
      "geographic": 0,
      "capability": 0,
      "weighted": 0
    }
  };
  /**
   * Select best worker for a task
   */
  selectWorker(task, strategy) {
    const startTime = Date.now();
    const candidates = this.workerPool.findCapableWorkers(task.capabilities);
    if (candidates.length === 0) {
      this.stats.failedRoutings++;
      this.logger.warn("No capable workers found", { requirements: task });
      return null;
    }
    const eligible = this.filterByRequirements(candidates, task);
    if (eligible.length === 0) {
      this.stats.failedRoutings++;
      this.logger.warn("No workers meet hard requirements", { requirements: task });
      return null;
    }
    const selectedStrategy = strategy || this.determineBestStrategy(task, eligible);
    const scored = this.scoreWorkers(eligible, task, selectedStrategy);
    scored.sort((a, b) => b.score - a.score);
    const decisionTime = Date.now() - startTime;
    this.updateStats(decisionTime, selectedStrategy);
    const decision = {
      workerId: scored[0].worker.id,
      score: scored[0].score,
      strategy: selectedStrategy,
      alternatives: scored.slice(1, 4).map((s) => ({
        workerId: s.worker.id,
        score: s.score
      })),
      estimatedLatency: scored[0].worker.latency
    };
    this.stats.totalRoutings++;
    this.stats.successfulRoutings++;
    this.logger.debug("Worker selected", {
      workerId: decision.workerId,
      strategy: selectedStrategy,
      score: decision.score,
      alternatives: decision.alternatives.length
    });
    return decision;
  }
  /**
   * Get worker load information
   */
  getWorkerLoad(workerId) {
    const worker = this.workerPool.getWorker(workerId);
    if (!worker) {
      return null;
    }
    return {
      activeTasks: worker.activeTasks,
      queueDepth: worker.queuedTasks,
      loadPercentage: worker.load * 100
    };
  }
  /**
   * Rebalance tasks across workers
   */
  rebalance() {
    const workers = this.workerPool.getAllWorkers();
    const overloaded = workers.filter((w) => w.load > 0.8);
    const underloaded = workers.filter((w) => w.load < 0.3 && w.status !== "offline");
    const reassignments = [];
    for (const overWorker of overloaded) {
      const tasksToMove = Math.ceil((overWorker.load - 0.5) * overWorker.capabilities.maxConcurrentTasks);
      for (let i = 0; i < tasksToMove && underloaded.length > 0; i++) {
        const targetWorker = underloaded.sort((a, b) => a.load - b.load)[0];
        reassignments.push({
          taskId: `task-${Date.now()}-${i}`,
          fromWorker: overWorker.id,
          toWorker: targetWorker.id
        });
        targetWorker.load += 1 / targetWorker.capabilities.maxConcurrentTasks;
        if (targetWorker.load >= 0.3) {
          underloaded.splice(underloaded.indexOf(targetWorker), 1);
        }
      }
    }
    if (reassignments.length > 0) {
      this.logger.info("Rebalanced tasks", { reassignments: reassignments.length });
    }
    return reassignments;
  }
  /**
   * Get load balancer statistics
   */
  getStats() {
    return { ...this.stats };
  }
  /**
   * Preemptively warm up workers with likely needed capabilities
   */
  warmupWorkers(capabilities) {
    const capableWorkers = this.workerPool.findCapableWorkers(capabilities);
    for (const worker of capableWorkers) {
      if (worker.status === "idle") {
        this.logger.debug("Warming up worker", { workerId: worker.id, capabilities });
      }
    }
  }
  filterByRequirements(workers, requirements) {
    return workers.filter((worker) => {
      if (requirements.gpuRequired && !worker.capabilities.gpuEnabled) {
        return false;
      }
      if (requirements.minMemoryGB && worker.capabilities.memoryGB < requirements.minMemoryGB) {
        return false;
      }
      if (requirements.maxLatencyMs && worker.latency > requirements.maxLatencyMs) {
        return false;
      }
      return true;
    });
  }
  determineBestStrategy(task, workers) {
    if (task.region) {
      return "geographic";
    }
    if (task.priority && task.priority > 8) {
      return "least-loaded";
    }
    const uniqueCapabilities = new Set(workers.flatMap((w) => w.capabilities.skills));
    if (uniqueCapabilities.size > 10) {
      return "capability";
    }
    return "weighted";
  }
  scoreWorkers(workers, task, strategy) {
    return workers.map((worker) => ({
      worker,
      score: this.calculateScore(worker, task, strategy)
    }));
  }
  calculateScore(worker, task, strategy) {
    switch (strategy) {
      case "round-robin":
        return this.roundRobinScore(worker);
      case "least-loaded":
        return this.leastLoadedScore(worker);
      case "geographic":
        return this.geographicScore(worker, task.region);
      case "capability":
        return this.capabilityScore(worker, task.capabilities);
      case "weighted":
        return this.weightedScore(worker, task);
      default:
        return this.weightedScore(worker, task);
    }
  }
  roundRobinScore(worker) {
    const workers = this.workerPool.getAllWorkers();
    const index = workers.findIndex((w) => w.id === worker.id);
    const effectiveIndex = (index + this.roundRobinIndex) % workers.length;
    this.roundRobinIndex = (this.roundRobinIndex + 1) % Math.max(1, workers.length);
    return workers.length - effectiveIndex;
  }
  leastLoadedScore(worker) {
    return (1 - worker.load) * 100;
  }
  geographicScore(worker, preferredRegion) {
    let score = 50;
    if (preferredRegion && worker.region === preferredRegion) {
      score += 40;
    }
    const latencyPenalty = Math.min(worker.latency / 10, 30);
    score -= latencyPenalty;
    score += (1 - worker.load) * 20;
    return score;
  }
  capabilityScore(worker, requiredCapabilities) {
    let score = 50;
    const allCapabilities = [
      ...worker.capabilities.agentTypes,
      ...worker.capabilities.skills
    ];
    const matches = requiredCapabilities.filter((cap) => allCapabilities.includes(cap));
    score += matches.length / requiredCapabilities.length * 40;
    const exactMatches = matches.filter((cap) => worker.capabilities.skills.includes(cap));
    score += exactMatches.length * 5;
    score += (1 - worker.load) * 10;
    return score;
  }
  weightedScore(worker, task) {
    const weights = {
      load: 0.35,
      latency: 0.25,
      capability: 0.25,
      region: 0.15
    };
    const loadScore = (1 - worker.load) * 100;
    const latencyScore = Math.max(0, 100 - worker.latency);
    const allCapabilities = [
      ...worker.capabilities.agentTypes,
      ...worker.capabilities.skills
    ];
    const matches = task.capabilities.filter((cap) => allCapabilities.includes(cap));
    const capabilityScore = matches.length / task.capabilities.length * 100;
    let regionScore = 50;
    if (task.region) {
      regionScore = worker.region === task.region ? 100 : 0;
    }
    return loadScore * weights.load + latencyScore * weights.latency + capabilityScore * weights.capability + regionScore * weights.region;
  }
  updateStats(decisionTime, strategy) {
    this.stats.averageDecisionTime = (this.stats.averageDecisionTime * this.stats.totalRoutings + decisionTime) / (this.stats.totalRoutings + 1);
    this.stats.strategyUsage[strategy]++;
  }
};
LoadBalancer = __decorateClass([
  singleton(),
  __decorateParam(0, inject(DI_TOKENS.Logger)),
  __decorateParam(1, inject(DI_TOKENS.ConfigService)),
  __decorateParam(2, inject(DI_TOKENS.WorkerPool))
], LoadBalancer);
export {
  LoadBalancer
};
