// Copyright (c) 2026 Ultra-Dex
// Autonomous Agent Module — consolidated entry point

// Core autonomous components
export { AutonomousAgent } from './agent.js';
export { ApprovalGates } from './gates.js';
export { AutonomousPipeline } from './pipeline.js';

// Overnight / autonomous-mode re-export
export {
  runOvernight,
  generateMorningSummary,
  createPullRequest,
  enqueueForReview,
} from '../autonomous-mode/index.js';
