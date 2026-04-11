/**
 * MCP Tools for Ultra-Dex Skills
 * Exposes all 20 skills as MCP tools
 */

import { SkillsAPI, initializeSkills } from '../../skills/index.js';

/**
 * Create MCP tools for all registered skills
 */
export function createSkillsTools(config: {
  aiRouter: any;
  memory: any;
  governance: any;
  agentRegistry: any;
}) {
  // Initialize skills
  initializeSkills();

  // Create skills API
  const skillsAPI = new SkillsAPI();
  skillsAPI.initializeExecutor({
    aiRouter: config.aiRouter,
    memory: config.memory,
    governance: config.governance,
    agentRegistry: config.agentRegistry,
  });

  // Get all skills
  const skills = skillsAPI.list();

  // Create tool definitions
  const tools: any[] = [];

  for (const skill of skills) {
    const toolName = skill.id.replace('/', '').replace(/-/g, '_');

    tools.push({
      name: `skill_${toolName}`,
      description: `${skill.name}: ${skill.description}`,
      inputSchema: {
        type: 'object',
        properties: {
          ...(skill.input as Record<string, unknown>).properties,
          provider: {
            type: 'string',
            description: 'AI provider to use (optional, auto-selected if not provided)',
            enum: ['anthropic', 'openai', 'deepseek', 'groq'],
          },
          strategy: {
            type: 'string',
            description: 'Routing strategy',
            enum: ['quality', 'cost', 'latency', 'balanced'],
            default: 'quality',
          },
        },
        required: ((skill.input as Record<string, unknown>).required as string[]) || [],
      },
      handler: async (params: any) => {
        const { provider, strategy, ...input } = params;

        const result = await skillsAPI.execute(skill.id, input, {
          provider,
          strategy,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.result, null, 2),
            },
          ],
          metadata: {
            skill: result.skill,
            provider: result.provider,
            model: result.model,
            latencyMs: result.latencyMs,
            costUsd: result.costUsd,
            cached: result.cached,
          },
        };
      },
    });
  }

  // Add meta-tools
  tools.push(
    {
      name: 'skill_list',
      description: 'List all available skills',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filter by category',
            enum: ['engineering', 'data'],
          },
        },
      },
      handler: async (params: { category?: 'engineering' | 'data' }) => {
        const skills = params.category
          ? skillsAPI.findByCategory(params.category)
          : skillsAPI.list();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                skills.map((s) => ({
                  id: s.id,
                  name: s.name,
                  description: s.description,
                  category: s.category,
                  agent: s.agent.id,
                })),
                null,
                2
              ),
            },
          ],
        };
      },
    },
    {
      name: 'skill_info',
      description: 'Get detailed information about a skill',
      inputSchema: {
        type: 'object',
        properties: {
          skillId: {
            type: 'string',
            description: 'Skill ID (e.g., /code-review)',
          },
        },
        required: ['skillId'],
      },
      handler: async (params: { skillId: string }) => {
        const skill = skillsAPI.get(params.skillId);
        if (!skill) {
          throw new Error(`Skill not found: ${params.skillId}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  id: skill.id,
                  name: skill.name,
                  description: skill.description,
                  category: skill.category,
                  agent: skill.agent,
                  input: skill.input,
                  connectors: skill.connectors,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    }
  );

  return tools;
}

/**
 * Register skills tools with MCP server manager
 */
export function registerSkillsMCPTools(manager: any, config: any): void {
  const tools = createSkillsTools(config);

  for (const tool of tools) {
    manager.registerLocalTool(tool, 'ultra-dex-skills');
  }
}
