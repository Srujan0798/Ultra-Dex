// Copyright (c) 2026 Ultra-Dex
/**
 * Ultra-Dex SDK (v6.0.0)
 * The official gateway for building extensions and integrations.
 */

export { UltraAgent } from './agent';
export { agentOrchestrator as orchestrator } from '../../src/core/orchestration/index.js';
export { ppmManager as memory } from '../../src/core/memory/manager.js';
export { executeProtocol21 as verify } from '../../src/core/quality/protocol-21.js';
export { createDockerSandbox as sandbox } from '../../apps/cli/lib/sandbox/docker.js';

export const VERSION = '6.0.0';
