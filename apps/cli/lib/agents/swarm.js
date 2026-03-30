/**
 * Swarm Re-export (Backward Compatibility)
 */

import SwarmOrchestrator from '../../../../src/core/agents/swarm-orchestrator.js';

export class AgentSwarm extends SwarmOrchestrator {
  constructor(agents = []) {
    super(agents);
  }
}

export default AgentSwarm;
