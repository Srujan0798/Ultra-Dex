// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { loadState, saveState, withStateLock } from '../commands/state.js';
import { generateMarkdown } from '../commands/plan.js';
import { projectGraph } from './graph.js';
import { ultraMemory } from './memory.js';
import { glob } from 'glob';
import { logger } from '../ui/logger.js';
import { runPostToolUseHooks } from '../quality/hooks.js';
import { AppError } from '../utils/errors.js';
import { capabilitiesRouter } from './router.js';
import { auditGovernance } from '../governance/governor.js';
import { saveADR } from '../governance/schema.js';

export function registerTools(server) {
  const baseTool = server.tool.bind(server);
  server.tool = (name, description, schema, handler) =>
    baseTool(name, description, schema, capabilitiesRouter.wrapTool(name, handler));

  // Tool: Remember Fact
  server.tool(
    'remember',
    'Save a fact, decision, or piece of context to persistent memory for future reference',
    {
      text: z.string().describe('The fact or information to remember'),
      tags: z.array(z.string()).optional().describe('Tags to categorize the information'),
      source: z.string().optional().default('agent').describe('Source of the information'),
    },
    async ({ text, tags, source }) => {
      try {
        await ultraMemory.remember(text, tags, source);
        return {
          content: [{ type: 'text', text: `✅ Remembered: "${text.slice(0, 50)}..."` }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to remember: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Recall Context
  server.tool(
    'recall',
    'Search persistent memory for relevant past context, decisions, or facts',
    {
      query: z.string().describe('Search query to find relevant memories'),
      limit: z.number().optional().default(5).describe('Maximum number of memories to return'),
    },
    async ({ query, limit }) => {
      try {
        const results = await ultraMemory.search(query, limit);
        if (results.length === 0) {
          return {
            content: [{ type: 'text', text: 'No relevant memories found.' }],
          };
        }

        const formatted = results
          .map(
            (r) =>
              `[${new Date(r.timestamp).toLocaleDateString()}] (${r.source}) ${r.tags?.length ? '#' + r.tags.join(' #') : ''}\n${r.text}`
          )
          .join('\n\n---\n\n');

        return {
          content: [{ type: 'text', text: `Relevant memories found:\n\n${formatted}` }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Recall failed: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Clear Memory
  server.tool(
    'clear_memory',
    'Clear all or part of the persistent memory',
    {
      before: z.string().optional().describe('Clear memories older than this date (ISO format)'),
    },
    async ({ before }) => {
      try {
        await ultraMemory.clear(before);
        return {
          content: [
            { type: 'text', text: `✅ Memory cleared${before ? ' before ' + before : ''}.` },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to clear memory: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Update Task Status
  server.tool(
    'update_task_status',
    'Update the status of a task in the project plan',
    {
      taskId: z.string().describe("The ID of the task (e.g., '1.1', '2.3')"),
      status: z.enum(['pending', 'in_progress', 'completed']).describe('New status'),
    },
    async ({ taskId, status }) => {
      // Use state locking to prevent race conditions
      return await withStateLock(async () => {
        const state = await loadState();
        if (!state) return { content: [{ type: 'text', text: 'Error: No state found.' }] };

        let taskFound = false;
        let oldStatus = '';

        for (const phase of state.phases) {
          const step = phase.steps.find((s) => s.id === taskId);
          if (step) {
            oldStatus = step.status;
            step.status = status;
            taskFound = true;
            break;
          }
        }

        if (taskFound) {
          const success = await saveState(state);
          if (success) {
            // Also update the Markdown plan file
            const md = generateMarkdown(state);
            await fs.writeFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), md);

            return {
              content: [
                { type: 'text', text: `✅ Task ${taskId} updated: ${oldStatus} -> ${status}` },
              ],
            };
          }
          return { content: [{ type: 'text', text: 'Error: Failed to save state.' }] };
        }

        return { content: [{ type: 'text', text: `Error: Task ${taskId} not found.` }] };
      });
    }
  );

  // Tool: Query Codebase Graph
  server.tool(
    'query_codebase',
    'Search the codebase structure and dependencies',
    {
      query: z.string().describe('Search term or file name'),
      type: z.enum(['files', 'dependencies', 'reverse_deps']).default('files'),
    },
    async ({ query, type }) => {
      // Ensure graph is populated
      if (projectGraph.nodes.size === 0) {
        await projectGraph.scan();
      }

      const summary = projectGraph.getSummary();

      if (type === 'files') {
        const matches = summary.files.filter((f) => f.toLowerCase().includes(query.toLowerCase()));
        return {
          content: [
            {
              type: 'text',
              text: `Found ${matches.length} files matching '${query}':\n${matches.slice(0, 20).join('\n')}${matches.length > 20 ? '\n...' : ''}`,
            },
          ],
        };
      }

      if (type === 'dependencies') {
        const deps = summary.dependencies.filter((e) => e.from.includes(query));
        return {
          content: [
            {
              type: 'text',
              text: `Dependencies for files matching '${query}':\n${deps
                .map((d) => `${d.from} -> ${d.to}`)
                .slice(0, 20)
                .join('\n')}`,
            },
          ],
        };
      }

      if (type === 'reverse_deps') {
        const refs = summary.dependencies.filter((e) => e.to.includes(query));
        return {
          content: [
            {
              type: 'text',
              text: `Files depending on '${query}':\n${refs
                .map((d) => `${d.from}`)
                .slice(0, 20)
                .join('\n')}`,
            },
          ],
        };
      }

      return { content: [{ type: 'text', text: 'Invalid query type.' }] };
    }
  );

  // Tool: Verify Task
  server.tool(
    'verify_task',
    'Run the 21-step verification framework for a specific task',
    {
      taskName: z.string().describe('The name or ID of the task to verify'),
    },
    async ({ taskName }) => {
      try {
        const state = await loadState();
        if (!state) {
          return {
            content: [
              { type: 'text', text: 'Error: No project state found. Run `ultra-dex init` first.' },
            ],
          };
        }

        let taskFound = null;
        for (const phase of state.phases) {
          if (phase.steps) {
            const step = phase.steps.find((s) => s.id === taskName || s.task.includes(taskName));
            if (step) {
              taskFound = step;
              break;
            }
          }
        }

        const checklist = [
          '1. Atomic Scope Defined',
          '2. Context Loaded',
          '3. Architecture Alignment',
          '4. Security Patterns Applied',
          '5. Type Safety Check',
          '6. Error Handling Strategy',
          '7. API Documentation Updated',
          '8. Database Schema Verified',
          '9. Environment Variables Set',
          '10. Implementation Complete',
          '11. Console Logs Removed',
          '12. Edge Cases Handled',
          '13. Performance Check',
          '14. Accessibility (A11y) Check',
          '15. Cross-browser Check',
          '16. Unit Tests Passed',
          '17. Integration Tests Passed',
          '18. Linting & Formatting',
          '19. Code Review Approved',
          '20. Migration Scripts Ready',
          '21. Deployment Readiness',
        ];

        const report = taskFound
          ? `Verification Report for '${taskFound.task}' (${taskFound.id}):\nStatus: ${taskFound.status}\n\n`
          : `General Verification Report for '${taskName}':\n\n`;

        const fullReport = report + checklist.map((step) => `[ ] ${step}`).join('\n');

        // v4.1: Active Governance Audit
        const govResult = await auditGovernance(process.cwd());
        const govReport = govResult.ok 
          ? "\n\n🛡️  Governance: COMPLIANT"
          : `\n\n🛡️  Governance: VIOLATIONS DETECTED\n${govResult.violations.map(v => `  - [${v.adrId}] ${v.title} (${v.file})`).join('\n')}`;

        return {
          content: [
            {
              type: 'text',
              text: fullReport + govReport,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Verification failed: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Read Code
  server.tool(
    'read_code',
    'Read a file from the codebase',
    {
      filePath: z.string().describe('Path to the file relative to project root'),
    },
    async ({ filePath }) => {
      try {
        // Security validation: prevent path traversal
        const normalizedPath = path.normalize(filePath);
        if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
          throw new Error("Access denied: Invalid path containing '..'");
        }

        const fullPath = path.resolve(process.cwd(), normalizedPath);
        // Security check: ensure path is within process.cwd()
        if (!fullPath.startsWith(process.cwd())) {
          throw new Error('Access denied: Path outside project root');
        }

        const content = await fs.readFile(fullPath, 'utf8');
        return {
          content: [{ type: 'text', text: content }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error reading file: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Write Code (God Mode)
  server.tool(
    'write_code',
    'Write or update a file in the codebase',
    {
      filePath: z.string().describe('Path to the file relative to project root'),
      content: z.string().describe('The new content for the file'),
      description: z.string().optional().describe('Description of the change for audit logs'),
    },
    async ({ filePath, content, description }) => {
      try {
        let originalContent = '';
        let fileExists = false;

        // Security validation: prevent path traversal
        const normalizedPath = path.normalize(filePath);
        if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
          throw new Error("Access denied: Invalid path containing '..'");
        }

        const fullPath = path.resolve(process.cwd(), normalizedPath);
        if (!fullPath.startsWith(process.cwd())) {
          throw new Error('Access denied: Path outside project root');
        }

        // Additional security: prevent writing to sensitive locations
        const forbiddenPaths = ['.git', 'node_modules', '.env', 'package-lock.json'];
        const pathParts = fullPath.split(path.sep);
        if (pathParts.some((part) => forbiddenPaths.includes(part))) {
          throw new Error(`Access denied: Cannot write to ${part} directory`);
        }

        try {
          originalContent = await fs.readFile(fullPath, 'utf8');
          fileExists = true;
        } catch {
          fileExists = false;
        }

        // Ensure directory exists
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf8');

        // Log for server visibility
        logger.info(`[MCP] Write: ${filePath} - ${description || 'No description'}`);

        // Quality Gates: Block invalid code automatically
        try {
          await runPostToolUseHooks({
            projectDir: process.cwd(),
            tool: 'write_code',
            mutates: true,
            blockOnFailure: true,
            fast: false,
            context: { filePath, description },
          });
        } catch (gateError) {
          if (fileExists) {
            await fs.writeFile(fullPath, originalContent, 'utf8');
          } else {
            await fs.unlink(fullPath).catch(() => {});
          }
          throw new AppError(`Quality gates failed after write: ${gateError.message}`, {
            cause: gateError,
          });
        }

        return {
          content: [{ type: 'text', text: `Successfully wrote ${filePath}` }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error writing file: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Search Code (Graph-Aware)
  server.tool(
    'search_code',
    'Search for symbols, functions, or patterns using the Code Property Graph',
    {
      query: z.string().describe('The symbol or function name to search for'),
      useGraph: z
        .boolean()
        .default(true)
        .describe('Use structural graph search instead of text grep'),
    },
    async ({ query, useGraph }) => {
      try {
        const { buildGraph, queryGraph } = await import('../utils/graph.js');
        const graph = await buildGraph();

        if (useGraph) {
          const nodes = queryGraph(graph, query);
          if (nodes.length > 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Found structural matches in graph:\n${JSON.stringify(nodes, null, 2)}`,
                },
              ],
            };
          }
        }

        // Fallback to basic text search
        const files = await glob('**/*.{js,ts,jsx,tsx,md,json}', {
          ignore: ['node_modules/**', '.git/**', 'dist/**'],
          nodir: true,
        });

        const results = [];
        for (const file of files) {
          const content = await fs.readFile(file, 'utf8');
          if (content.includes(query)) {
            results.push(file);
          }
        }

        return {
          content: [{ type: 'text', text: `Matches found in files:\n${results.join('\n')}` }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Search failed: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Analyze Impact
  server.tool(
    'analyze_impact',
    'Determine which files or functions will be impacted by changing a specific file',
    {
      filePath: z.string().describe('The file path to analyze'),
    },
    async ({ filePath }) => {
      try {
        const { buildGraph, getImpactAnalysis } = await import('../utils/graph.js');
        const graph = await buildGraph();
        const impacts = getImpactAnalysis(graph, filePath);

        return {
          content: [
            {
              type: 'text',
              text:
                impacts.length > 0
                  ? `Changing ${filePath} may impact the following files:\n- ${impacts.join('\n- ')}`
                  : `No direct dependents found for ${filePath}.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Impact analysis failed: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Get Agent Prompt
  server.tool(
    'get_agent',
    'Get the system prompt for a specialized agent',
    {
      agentName: z.string().describe("Name of the agent (e.g., 'backend', 'planner', 'cto')"),
    },
    async ({ agentName }) => {
      // Sanitize agent name to prevent path traversal
      const sanitizedAgentName = agentName.replace(/[^a-zA-Z0-9_-]/g, '');
      if (sanitizedAgentName !== agentName) {
        return {
          content: [
            {
              type: 'text',
              text: `Invalid agent name format. Only alphanumeric characters, hyphens, and underscores are allowed.`,
            },
          ],
        };
      }

      const lowerName = sanitizedAgentName.toLowerCase();
      const potentialPaths = [
        `agents/1-leadership/${lowerName}.md`,
        `agents/2-development/${lowerName}.md`,
        `agents/3-security/${lowerName}.md`,
        `agents/4-devops/${lowerName}.md`,
        `agents/5-quality/${lowerName}.md`,
        `agents/6-specialist/${lowerName}.md`,
        `agents/0-orchestration/${lowerName}.md`,
        `agents/${lowerName}.md`,
      ];

      for (const p of potentialPaths) {
        try {
          // Additional security check: normalize and validate path
          const normalizedPath = path.normalize(p);
          if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
            continue; // Skip invalid paths
          }

          const fullPath = path.resolve(process.cwd(), normalizedPath);
          // Ensure the path is within the expected directory structure
          const expectedPrefix = path.resolve(process.cwd(), 'agents');
          if (!fullPath.startsWith(expectedPrefix)) {
            continue; // Skip paths that escape the agents directory
          }

          const content = await fs.readFile(fullPath, 'utf8');
          return {
            content: [{ type: 'text', text: content }],
          };
        } catch (e) {
          // continue
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Agent '${agentName}' not found. List of agents available in agents/00-AGENT_INDEX.md`,
          },
        ],
      };
    }
  );

  // Tool: Start Swarm (Agent Orchestration)
  server.tool(
    'start_swarm',
    'Trigger a multi-agent swarm to plan and implement a feature',
    {
      feature: z.string().describe('Description of the feature to build'),
      mode: z
        .enum(['full', 'plan_only'])
        .default('full')
        .describe("Execution mode: 'full' runs entire pipeline, 'plan_only' just generates plan"),
      provider: z.string().optional().describe('AI provider override'),
      key: z.string().optional().describe('API Key override'),
    },
    async ({ feature, mode, provider: providerId, key }) => {
      try {
        logger.info(`[MCP] Starting Swarm: ${feature} (${mode})`);

        if (mode === 'plan_only') {
          const { runAgentLoop } = await import('../commands/run.js');
          const { createProvider, getDefaultProvider } = await import('../providers/index.js');
          const { loadState } = await import('../commands/plan.js');
          const { projectGraph } = await import('./graph.js');
          const { generateMarkdown } = await import('../commands/plan.js');

          // Setup Context
          const state = await loadState();
          const context = {
            state,
            plan: state ? generateMarkdown(state) : '',
            graph: projectGraph.getSummary(),
          };

          const provider = createProvider(providerId || getDefaultProvider(), {
            apiKey: key,
            maxTokens: 8000,
          });

          // Step 1: Planning
          const planOutput = await runAgentLoop('planner', feature, provider, context);

          return {
            content: [{ type: 'text', text: `Swarm Planning Complete:\n\n${planOutput}` }],
          };
        } else {
          // Full Execution Mode
          const { swarmCommand } = await import('../commands/swarm.js');

          // We invoke the main CLI command
          // Note: This might take time. In a real server, we might want to run this detached.
          // For now, we await it to provide feedback.
          await swarmCommand(feature, { provider: providerId, key, parallel: true });

          return {
            content: [
              {
                type: 'text',
                text: `✅ Swarm execution completed for: "${feature}". Check logs for details.`,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Swarm failed: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Deep Impact Analysis (GraphRAG)
  server.tool(
    'deep_impact_analysis',
    "Perform deep impact analysis using graph database. Answers 'What breaks if I change X?'",
    {
      filePath: z.string().describe('The file path to analyze for impact'),
      maxDepth: z
        .number()
        .optional()
        .default(5)
        .describe('Maximum depth for transitive dependency search'),
      includeFunctions: z
        .boolean()
        .optional()
        .default(false)
        .describe('Include function-level impact analysis'),
    },
    async ({ filePath, maxDepth, includeFunctions }) => {
      try {
        const { contextEngine } = await import('./context-engine.js');
        await contextEngine.initialize();

        const result = await contextEngine.query(`What breaks if I change ${filePath}?`, {
          impactDepth: maxDepth,
          includeFunctions,
        });

        return {
          content: [
            {
              type: 'text',
              text: result.answer || 'No impact analysis available.',
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Deep impact analysis failed: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Find Circular Dependencies
  server.tool(
    'find_circular_deps',
    'Detect circular dependencies in the codebase using graph analysis',
    {},
    async () => {
      try {
        const { projectGraph } = await import('./graph.js');
        await projectGraph.scan();

        const cycles = await projectGraph.findCircularDependencies();

        if (cycles.length === 0) {
          return {
            content: [{ type: 'text', text: '✅ No circular dependencies found in the codebase.' }],
          };
        }

        const formatted = cycles
          .map((cycle, i) => `${i + 1}. ${cycle.join(' → ')} → ${cycle[0]}`)
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `⚠️ Found ${cycles.length} circular dependencies:\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Circular dependency check failed: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Get Coupling Metrics
  server.tool(
    'get_coupling_metrics',
    'Analyze code coupling metrics to identify tightly coupled components',
    {},
    async () => {
      try {
        const { projectGraph } = await import('./graph.js');
        await projectGraph.scan();

        const metrics = await projectGraph.getCouplingMetrics();

        if (!metrics || Object.keys(metrics).length === 0) {
          return {
            content: [{ type: 'text', text: 'Coupling metrics not available.' }],
          };
        }

        let text = '## Coupling Metrics\n\n';
        text += `- Average coupling: ${metrics.averageCoupling?.toFixed(2) || 'N/A'}\n`;
        text += `- Max coupling: ${metrics.maxCoupling || 'N/A'}\n\n`;

        if (metrics.highlyCoupledFiles && metrics.highlyCoupledFiles.length > 0) {
          text += '### Highly Coupled Files:\n';
          metrics.highlyCoupledFiles.forEach((f) => {
            text += `- ${f.file} (coupling: ${f.coupling})\n`;
          });
        }

        return {
          content: [{ type: 'text', text }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Coupling analysis failed: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Graph RAG Query
  server.tool(
    'graph_rag_query',
    'Query the codebase graph for context-aware information retrieval',
    {
      query: z.string().describe('The query to search for (can be natural language)'),
      includeImpact: z
        .boolean()
        .optional()
        .default(false)
        .describe('Include impact analysis in results'),
      includeCoupling: z.boolean().optional().default(false).describe('Include coupling metrics'),
      includeCircularDeps: z
        .boolean()
        .optional()
        .default(false)
        .describe('Include circular dependency detection'),
    },
    async ({ query, includeImpact, includeCoupling, includeCircularDeps }) => {
      try {
        const { contextEngine } = await import('./context-engine.js');
        await contextEngine.initialize();

        const result = await contextEngine.query(query, {
          includeImpact,
          includeCoupling,
          includeCircularDeps,
        });

        return {
          content: [
            {
              type: 'text',
              text: result.answer || 'No results found.',
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Graph RAG query failed: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Store Architectural Decision
  server.tool(
    'store_decision',
    'Store an architectural decision in the graph for future impact analysis',
    {
      title: z.string().describe('Title of the decision'),
      description: z.string().describe('Description of the decision'),
      affectedFiles: z.array(z.string()).describe('List of files affected by this decision'),
      status: z
        .enum(['proposed', 'active', 'deprecated', 'superseded'])
        .optional()
        .default('active')
        .describe('Decision status'),
      patterns: z.array(z.string()).optional().describe('Regex patterns to enforce for this ADR'),
      enforcement: z.enum(['strict', 'warning', 'info']).optional().default('strict').describe('Enforcement level'),
    },
    async ({ title, description, affectedFiles, status, patterns, enforcement }) => {
      try {
        const adrId = `ADR-${Date.now()}`;
        
        // Save to ADR Index if patterns are provided
        if (patterns && patterns.length > 0) {
          await saveADR({
            id: adrId,
            title,
            status: status || 'active',
            patterns,
            enforcement: enforcement || 'strict',
            rationale: description,
            date: new Date().toISOString()
          });
        }

        const { projectGraph } = await import('./graph.js');
        await projectGraph.scan();

        const success = await projectGraph.storeDecision({
          id: adrId,
          title,
          description,
          affectedFiles,
          status,
        });

        if (success) {
          return {
            content: [
              {
                type: 'text',
                text: `✅ Decision stored: "${title}"\n\nAffects ${affectedFiles.length} files.`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Decision stored locally (GraphDB not connected).\n\nTitle: "${title}"\nAffects: ${affectedFiles.join(', ')}`,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to store decision: ${error.message}` }],
        };
      }
    }
  );

  // Tool: Search Symbols
  server.tool(
    'search_symbols',
    'Search for functions, classes, or symbols across the codebase using the graph',
    {
      query: z.string().describe('Symbol name to search for'),
      limit: z.number().optional().default(10).describe('Maximum number of results'),
    },
    async ({ query, limit }) => {
      try {
        const { projectGraph } = await import('./graph.js');
        await projectGraph.scan();

        const results = await projectGraph.searchSymbols(query, { limit });

        if (results.length === 0) {
          return {
            content: [{ type: 'text', text: `No symbols found matching "${query}".` }],
          };
        }

        const formatted = results
          .map((r) => `- ${r.name}${r.file ? ` (${r.file})` : ''}${r.type ? ` [${r.type}]` : ''}`)
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${results.length} symbols matching "${query}":\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Symbol search failed: ${error.message}` }],
        };
      }
    }
  );
}
