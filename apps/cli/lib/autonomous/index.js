// Copyright (c) 2026 Ultra-Dex
// Autonomous Agent Module — consolidated entry point

// Core autonomous components
export { AutonomousAgent } from './agent.js';
export { ApprovalGates, AUTONOMOUS_GATES } from './gates.js';
export { AutonomousPipeline } from './pipeline.js';

// New autonomous loop components (Maya Cycle 1)
export { PlanningEngine } from './planning-engine.js';
export { TaskDecomposer } from './task-decomposer.js';
export { ExecutionController } from './execution-controller.js';
export { ValidationLayer } from './validation-layer.js';
export { MemoryBridge } from './memory-bridge.js';

// Overnight / autonomous-mode re-export
export {
  runOvernight,
  generateMorningSummary,
  createPullRequest,
  enqueueForReview,
} from '../autonomous-mode/index.js';
