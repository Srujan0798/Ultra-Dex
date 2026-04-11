/**
 * Skills Integration for UltraDexCore
 * Adds skills capability to the core orchestrator
 */

import { SkillsAPI, initializeSkills } from '../skills/index.js';
import { ConnectorSkillExecutor } from '../skills/connector-executor.js';

export interface SkillsIntegrationConfig {
  aiRouter: any;
  memory: any;
  governance?: any;
  agentRegistry: any;
  connectors?: any;
}

/**
 * Initialize skills system with UltraDexCore
 */
export function initializeSkillsSystem(config: SkillsIntegrationConfig): SkillsAPI {
  // Initialize all skills
  initializeSkills();

  // Create skills API
  const skillsAPI = new SkillsAPI();

  // Use connector executor if connectors available
  if (config.connectors) {
    const executor = new ConnectorSkillExecutor({
      aiRouter: config.aiRouter,
      memory: config.memory,
      governance: config.governance,
      agentRegistry: config.agentRegistry,
      connectors: config.connectors,
      enableCache: true,
    });

    // Override execute method to use connector executor
    (skillsAPI as any).executor = executor;
  } else {
    // Use basic executor
    skillsAPI.initializeExecutor({
      aiRouter: config.aiRouter,
      memory: config.memory,
      governance: config.governance,
      agentRegistry: config.agentRegistry,
      enableCache: true,
    });
  }

  return skillsAPI;
}

/**
 * Skill execution wrapper for UltraDexCore
 */
export async function executeSkill(
  skillsAPI: SkillsAPI,
  skillId: string,
  input: Record<string, unknown>,
  options: { provider?: string; strategy?: string; userId?: string } = {}
): Promise<any> {
  return await skillsAPI.execute(skillId, input, options);
}

/**
 * Convenience methods for common skills
 */
export function createSkillHelpers(skillsAPI: SkillsAPI) {
  return {
    // Engineering
    codeReview: (input: any) => skillsAPI.codeReview(input),
    architecture: (input: any) => skillsAPI.architecture(input),
    debug: (input: any) => skillsAPI.execute('/debug', input),
    documentation: (input: any) => skillsAPI.execute('/documentation', input),
    systemDesign: (input: any) => skillsAPI.execute('/system-design', input),

    // Data
    sqlQuery: (input: any) => skillsAPI.sqlQuery(input),
    analyze: (input: any) => skillsAPI.analyze(input),
    buildDashboard: (input: any) => skillsAPI.buildDashboard(input),

    // Generic
    execute: (skillId: string, input: any, options?: any) =>
      skillsAPI.execute(skillId, input, options),
    list: () => skillsAPI.list(),
    get: (skillId: string) => skillsAPI.get(skillId),
  };
}
