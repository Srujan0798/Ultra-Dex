/**
 * Ultra-Dex Agent Tier System v3.0
 * Defines the hierarchical structure of agents and their dependencies.
 */

// ============================================================================
// TIER DEFINITIONS
// ============================================================================

/**
 * Tier structure for all 16 agents.
 * Lower tier numbers indicate higher-level strategic roles.
 */
export const TIERS = {
  META: {
    id: 0,
    name: 'Meta Orchestration',
    description: 'Coordinates all other agents',
    agents: ['orchestrator']
  },
  LEADERSHIP: {
    id: 1,
    name: 'Leadership',
    description: 'Strategic planning and technology decisions',
    agents: ['cto', 'planner', 'research']
  },
  DEVELOPMENT: {
    id: 2,
    name: 'Development',
    description: 'Core implementation of features',
    agents: ['backend', 'frontend', 'database']
  },
  SECURITY: {
    id: 3,
    name: 'Security',
    description: 'Authentication, authorization, and security audits',
    agents: ['auth', 'security']
  },
  DEVOPS: {
    id: 4,
    name: 'DevOps',
    description: 'Deployment and infrastructure management',
    agents: ['devops']
  },
  QUALITY: {
    id: 5,
    name: 'Quality',
    description: 'Testing, debugging, and code review',
    agents: ['testing', 'reviewer', 'debugger', 'documentation']
  },
  SPECIALIST: {
    id: 6,
    name: 'Specialist',
    description: 'Advanced optimization and code improvement',
    agents: ['performance', 'refactoring']
  }
};

// ============================================================================
// AGENT REGISTRY
// ============================================================================

/**
 * Complete agent registry with metadata.
 */
export const AGENTS = {
  // Tier 0: Meta
  orchestrator: {
    name: 'Orchestrator',
    tier: 0,
    tierName: 'Meta Orchestration',
    role: 'Coordinate all agents for complete features',
    invocation: '@orchestrator',
    file: '0-orchestration/orchestrator.md',
    capabilities: ['task_decomposition', 'agent_selection', 'pipeline_execution', 'result_synthesis'],
    canInvoke: ['all']
  },

  // Tier 1: Leadership
  cto: {
    name: 'CTO',
    tier: 1,
    tierName: 'Leadership',
    role: 'Architecture & tech stack decisions',
    invocation: '@cto',
    file: '1-leadership/cto.md',
    capabilities: ['architecture_design', 'tech_selection', 'system_design'],
    canInvoke: ['research']
  },
  planner: {
    name: 'Planner',
    tier: 1,
    tierName: 'Leadership',
    role: 'Task breakdown & sprint planning',
    invocation: '@planner',
    file: '1-leadership/planner.md',
    capabilities: ['task_breakdown', 'estimation', 'prioritization'],
    canInvoke: []
  },
  research: {
    name: 'Research',
    tier: 1,
    tierName: 'Leadership',
    role: 'Technology evaluation & comparison',
    invocation: '@research',
    file: '1-leadership/research.md',
    capabilities: ['technology_evaluation', 'comparison', 'recommendations'],
    canInvoke: []
  },

  // Tier 2: Development
  backend: {
    name: 'Backend',
    tier: 2,
    tierName: 'Development',
    role: 'API & server implementation',
    invocation: '@backend',
    file: '2-development/backend.md',
    capabilities: ['api_development', 'business_logic', 'integrations'],
    canInvoke: ['database']
  },
  frontend: {
    name: 'Frontend',
    tier: 2,
    tierName: 'Development',
    role: 'UI & component implementation',
    invocation: '@frontend',
    file: '2-development/frontend.md',
    capabilities: ['ui_development', 'components', 'state_management'],
    canInvoke: []
  },
  database: {
    name: 'Database',
    tier: 2,
    tierName: 'Development',
    role: 'Schema design & query optimization',
    invocation: '@database',
    file: '2-development/database.md',
    capabilities: ['schema_design', 'migrations', 'query_optimization'],
    canInvoke: []
  },

  // Tier 3: Security
  auth: {
    name: 'Auth',
    tier: 3,
    tierName: 'Security',
    role: 'Authentication & authorization',
    invocation: '@auth',
    file: '3-security/auth.md',
    capabilities: ['authentication', 'authorization', 'session_management'],
    canInvoke: ['backend', 'database']
  },
  security: {
    name: 'Security',
    tier: 3,
    tierName: 'Security',
    role: 'Security audits & vulnerability fixes',
    invocation: '@security',
    file: '3-security/security.md',
    capabilities: ['security_audit', 'vulnerability_detection', 'hardening'],
    canInvoke: []
  },

  // Tier 4: DevOps
  devops: {
    name: 'DevOps',
    tier: 4,
    tierName: 'DevOps',
    role: 'Deployment & infrastructure',
    invocation: '@devops',
    file: '4-devops/devops.md',
    capabilities: ['deployment', 'ci_cd', 'infrastructure', 'monitoring'],
    canInvoke: []
  },

  // Tier 5: Quality
  testing: {
    name: 'Testing',
    tier: 5,
    tierName: 'Quality',
    role: 'QA & test automation',
    invocation: '@testing',
    file: '5-quality/testing.md',
    capabilities: ['unit_testing', 'integration_testing', 'e2e_testing'],
    canInvoke: []
  },
  reviewer: {
    name: 'Reviewer',
    tier: 5,
    tierName: 'Quality',
    role: 'Code review & quality checks',
    invocation: '@reviewer',
    file: '5-quality/reviewer.md',
    capabilities: ['code_review', 'best_practices', 'quality_gates'],
    canInvoke: []
  },
  debugger: {
    name: 'Debugger',
    tier: 5,
    tierName: 'Quality',
    role: 'Bug investigation & fixes',
    invocation: '@debugger',
    file: '5-quality/debugger.md',
    capabilities: ['debugging', 'root_cause_analysis', 'bug_fixing'],
    canInvoke: ['backend', 'frontend', 'database']
  },
  documentation: {
    name: 'Documentation',
    tier: 5,
    tierName: 'Quality',
    role: 'Technical writing & docs maintenance',
    invocation: '@documentation',
    file: '5-quality/documentation.md',
    capabilities: ['technical_writing', 'api_docs', 'user_guides'],
    canInvoke: []
  },

  // Tier 6: Specialist
  performance: {
    name: 'Performance',
    tier: 6,
    tierName: 'Specialist',
    role: 'Performance optimization',
    invocation: '@performance',
    file: '6-specialist/performance.md',
    capabilities: ['profiling', 'optimization', 'caching', 'load_testing'],
    canInvoke: ['backend', 'frontend', 'database']
  },
  refactoring: {
    name: 'Refactoring',
    tier: 6,
    tierName: 'Specialist',
    role: 'Code quality & design patterns',
    invocation: '@refactoring',
    file: '6-specialist/refactoring.md',
    capabilities: ['code_cleanup', 'design_patterns', 'architecture_improvement'],
    canInvoke: ['backend', 'frontend']
  }
};

// ============================================================================
// TIER DEPENDENCY GRAPH
// ============================================================================

/**
 * Defines standard execution flow between tiers.
 * This represents the typical order of operations for a full feature.
 */
export const TIER_FLOW = {
  standard: [
    { tier: 1, phase: 'Planning', required: true },
    { tier: 2, phase: 'Implementation', required: true },
    { tier: 3, phase: 'Security', required: false },
    { tier: 5, phase: 'Quality', required: true },
    { tier: 4, phase: 'Deployment', required: false },
    { tier: 6, phase: 'Optimization', required: false }
  ],
  hotfix: [
    { tier: 5, phase: 'Debug', agents: ['debugger'], required: true },
    { tier: 5, phase: 'Test', agents: ['testing'], required: true },
    { tier: 4, phase: 'Deploy', agents: ['devops'], required: true }
  ],
  optimization: [
    { tier: 6, phase: 'Optimize', required: true },
    { tier: 5, phase: 'Test', agents: ['testing'], required: true },
    { tier: 5, phase: 'Review', agents: ['reviewer'], required: true }
  ]
};

/**
 * Agent dependency graph - which agents depend on outputs from others.
 */
export const AGENT_DEPENDENCIES = {
  // Leadership tier has no dependencies (entry points)
  planner: [],
  cto: ['planner'],
  research: ['planner'],

  // Development depends on leadership decisions
  database: ['cto'],
  backend: ['cto', 'database'],
  frontend: ['cto', 'backend'],

  // Security depends on implementation
  auth: ['backend', 'database'],
  security: ['backend', 'frontend', 'auth'],

  // Quality depends on implementation
  testing: ['backend', 'frontend'],
  reviewer: ['backend', 'frontend', 'testing'],
  debugger: [],  // Can be invoked anytime
  documentation: ['backend', 'frontend'],

  // DevOps depends on quality approval
  devops: ['testing', 'reviewer'],

  // Specialist can run after implementation
  performance: ['backend', 'frontend'],
  refactoring: ['backend', 'frontend']
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get agent by name.
 */
export function getAgent(name) {
  if (!name || typeof name !== 'string') {
    return null;
  }
  const normalized = name.toLowerCase().replace('@', '');
  return AGENTS[normalized] || null;
}

/**
 * Get all agents in a tier.
 */
export function getAgentsByTier(tierId) {
  return Object.values(AGENTS).filter(agent => agent.tier === tierId);
}

/**
 * Get tier by ID.
 */
export function getTier(tierId) {
  return Object.values(TIERS).find(tier => tier.id === tierId) || null;
}

/**
 * Get tier by agent name.
 */
export function getTierForAgent(agentName) {
  const agent = getAgent(agentName);
  return agent ? getTier(agent.tier) : null;
}

/**
 * Get dependencies for an agent.
 */
export function getAgentDependencies(agentName) {
  const normalized = agentName.toLowerCase().replace('@', '');
  return AGENT_DEPENDENCIES[normalized] || [];
}

/**
 * Check if agent A can invoke agent B.
 */
export function canInvoke(agentA, agentB) {
  const a = getAgent(agentA);
  if (!a) return false;
  if (a.canInvoke.includes('all')) return true;
  return a.canInvoke.includes(agentB.toLowerCase().replace('@', ''));
}

/**
 * Get execution order for a set of agents based on dependencies.
 */
export function getExecutionOrder(agentNames) {
  if (!Array.isArray(agentNames)) {
    throw new Error('agentNames must be an array');
  }

  const normalized = agentNames.map(n => {
    if (!n || typeof n !== 'string') {
      throw new Error('Each agent name must be a non-empty string');
    }
    return n.toLowerCase().replace('@', '');
  });

  const visited = new Set();
  const order = [];

  function visit(agent) {
    if (visited.has(agent)) return;
    visited.add(agent);

    const deps = AGENT_DEPENDENCIES[agent] || [];
    for (const dep of deps) {
      if (normalized.includes(dep)) {
        visit(dep);
      }
    }
    order.push(agent);
  }

  for (const agent of normalized) {
    visit(agent);
  }

  return order;
}

/**
 * Identify parallel execution opportunities.
 */
export function findParallelGroups(agentNames) {
  const order = getExecutionOrder(agentNames);
  const groups = [];
  const scheduled = new Set();

  while (scheduled.size < order.length) {
    const group = [];
    
    for (const agent of order) {
      if (scheduled.has(agent)) continue;
      
      const deps = AGENT_DEPENDENCIES[agent] || [];
      const depsInList = deps.filter(d => order.includes(d));
      const depsMet = depsInList.every(d => scheduled.has(d));
      
      if (depsMet) {
        group.push(agent);
      }
    }

    if (group.length === 0) break; // Prevent infinite loop
    
    for (const agent of group) {
      scheduled.add(agent);
    }
    groups.push(group);
  }

  return groups;
}

/**
 * Generate a tier summary for display.
 */
export function getTierSummary() {
  return Object.values(TIERS).map(tier => ({
    id: tier.id,
    name: tier.name,
    description: tier.description,
    agentCount: tier.agents.length,
    agents: tier.agents.map(a => AGENTS[a]?.name || a)
  }));
}

/**
 * Validate a pipeline for dependency violations.
 */
export function validatePipeline(pipeline) {
  if (!Array.isArray(pipeline)) {
    throw new Error('pipeline must be an array');
  }

  const errors = [];

  for (let i = 0; i < pipeline.length; i++) {
    const step = pipeline[i];

    // Validate step structure
    if (!step || typeof step !== 'object') {
      errors.push({
        step: i + 1,
        agent: 'unknown',
        error: 'Step must be an object'
      });
      continue;
    }

    if (!step.agent || typeof step.agent !== 'string') {
      errors.push({
        step: i + 1,
        agent: 'unknown',
        error: 'Step must have a valid agent property'
      });
      continue;
    }

    const agent = step.agent.toLowerCase().replace('@', '');
    const deps = AGENT_DEPENDENCIES[agent] || [];

    for (const dep of deps) {
      // Check if dependency is in pipeline and comes before
      const depIndex = pipeline.findIndex(s =>
        s.agent?.toLowerCase().replace('@', '') === dep
      );

      if (depIndex > i) {
        errors.push({
          step: i + 1,
          agent,
          error: `Depends on ${dep} which is scheduled after (step ${depIndex + 1})`
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  TIERS,
  AGENTS,
  TIER_FLOW,
  AGENT_DEPENDENCIES,
  getAgent,
  getAgentsByTier,
  getTier,
  getTierForAgent,
  getAgentDependencies,
  canInvoke,
  getExecutionOrder,
  findParallelGroups,
  getTierSummary,
  validatePipeline
};
