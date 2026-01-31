import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { loadState, saveState, withStateLock } from '../commands/state.js';
import { generateMarkdown } from '../commands/plan.js';
import { projectGraph } from './graph.js';
import { swarmCommand } from '../commands/swarm.js';
import { ultraMemory } from './memory.js';
import { glob } from 'glob';

export function registerTools(server) {
  // Tool: Remember Fact
  server.tool(
    "remember",
    "Save a fact, decision, or piece of context to persistent memory for future reference",
    {
      text: z.string().describe("The fact or information to remember"),
      tags: z.array(z.string()).optional().describe("Tags to categorize the information"),
      source: z.string().optional().default("agent").describe("Source of the information")
    },
    async ({ text, tags, source }) => {
      try {
        await ultraMemory.remember(text, tags, source);
        return {
          content: [{ type: "text", text: `✅ Remembered: "${text.slice(0, 50)}..."` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Failed to remember: ${error.message}` }]
        };
      }
    }
  );

  // Tool: Recall Context
  server.tool(
    "recall",
    "Search persistent memory for relevant past context, decisions, or facts",
    {
      query: z.string().describe("Search query to find relevant memories"),
      limit: z.number().optional().default(5).describe("Maximum number of memories to return")
    },
    async ({ query, limit }) => {
      try {
        const results = await ultraMemory.search(query, limit);
        if (results.length === 0) {
          return {
            content: [{ type: "text", text: "No relevant memories found." }]
          };
        }

        const formatted = results.map(r => 
          `[${new Date(r.timestamp).toLocaleDateString()}] (${r.source}) ${r.tags?.length ? '#' + r.tags.join(' #') : ''}\n${r.text}`
        ).join('\n\n---\n\n');

        return {
          content: [{ type: "text", text: `Relevant memories found:\n\n${formatted}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Recall failed: ${error.message}` }]
        };
      }
    }
  );

  // Tool: Clear Memory
  server.tool(
    "clear_memory",
    "Clear all or part of the persistent memory",
    {
      before: z.string().optional().describe("Clear memories older than this date (ISO format)")
    },
    async ({ before }) => {
      try {
        await ultraMemory.clear(before);
        return {
          content: [{ type: "text", text: `✅ Memory cleared${before ? ' before ' + before : ''}.` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Failed to clear memory: ${error.message}` }]
        };
      }
    }
  );

  // Tool: Start Swarm
  server.tool(
    "start_swarm",
    "Start a multi-agent swarm workflow for a specific feature",
    {
      feature: z.string().describe("The feature or task to implement"),
      provider: z.string().optional().describe("AI provider (claude, openai, gemini)"),
      key: z.string().optional().describe("API Key for the provider")
    },
    async ({ feature, provider, key }) => {
      try {
        console.error(`[MCP] Starting Swarm for: ${feature}`);
        // Run swarm command (this logs to stdout/stderr which MCP captures)
        // We capture the output by intercepting the console logs or just trust the side effects
        // Since swarmCommand is designed for CLI, we might need to wrap it or modify it to return result.
        // For now, we trigger it and return a success message indicating it started.
        
        await swarmCommand(feature, { provider, key });
        
        return {
          content: [{ type: "text", text: `✅ Swarm started for feature: "${feature}". Check server logs for progress.` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Swarm failed to start: ${error.message}` }]
        };
      }
    }
  );

  // Tool: Update Task Status
  server.tool(
    "update_task_status",
    "Update the status of a task in the project plan",
    {
      taskId: z.string().describe("The ID of the task (e.g., '1.1', '2.3')"),
      status: z.enum(['pending', 'in_progress', 'completed']).describe("New status")
    },
    async ({ taskId, status }) => {
      // Use state locking to prevent race conditions
      return await withStateLock(async () => {
        const state = await loadState();
        if (!state) return { content: [{ type: "text", text: "Error: No state found." }] };

        let taskFound = false;
        let oldStatus = '';

        for (const phase of state.phases) {
          const step = phase.steps.find(s => s.id === taskId);
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
                  content: [{ type: "text", text: `✅ Task ${taskId} updated: ${oldStatus} -> ${status}` }]
              };
          }
          return { content: [{ type: "text", text: "Error: Failed to save state." }] };
        }

        return { content: [{ type: "text", text: `Error: Task ${taskId} not found.` }] };
      });
    }
  );

  // Tool: Query Codebase Graph
  server.tool(
    "query_codebase",
    "Search the codebase structure and dependencies",
    {
      query: z.string().describe("Search term or file name"),
      type: z.enum(['files', 'dependencies', 'reverse_deps']).default('files')
    },
    async ({ query, type }) => {
      // Ensure graph is populated
      if (projectGraph.nodes.size === 0) {
        await projectGraph.scan();
      }

      const summary = projectGraph.getSummary();

      if (type === 'files') {
        const matches = summary.files.filter(f => f.toLowerCase().includes(query.toLowerCase()));
        return {
          content: [{ type: "text", text: `Found ${matches.length} files matching '${query}':\n${matches.slice(0, 20).join('\n')}${matches.length > 20 ? '\n...' : ''}` }]
        };
      }

      if (type === 'dependencies') {
        const deps = summary.dependencies.filter(e => e.from.includes(query));
        return {
          content: [{ type: "text", text: `Dependencies for files matching '${query}':\n${deps.map(d => `${d.from} -> ${d.to}`).slice(0, 20).join('\n')}` }]
        };
      }

      if (type === 'reverse_deps') {
        const refs = summary.dependencies.filter(e => e.to.includes(query));
        return {
          content: [{ type: "text", text: `Files depending on '${query}':\n${refs.map(d => `${d.from}`).slice(0, 20).join('\n')}` }]
        };
      }
      
      return { content: [{ type: "text", text: "Invalid query type." }] };
    }
  );

  // Tool: Verify Task
  server.tool(
    "verify_task",
    "Run the 21-step verification framework for a specific task",
    {
      taskName: z.string().describe("The name or ID of the task to verify")
    },
    async ({ taskName }) => {
      try {
        const state = await loadState();
        if (!state) {
            return {
                content: [{ type: "text", text: "Error: No project state found. Run `ultra-dex init` first." }]
            };
        }

        let taskFound = null;
        for (const phase of state.phases) {
            if (phase.steps) {
                const step = phase.steps.find(s => s.id === taskName || s.task.includes(taskName));
                if (step) {
                    taskFound = step;
                    break;
                }
            }
        }

        const checklist = [
          "1. Atomic Scope Defined", "2. Context Loaded", "3. Architecture Alignment", 
          "4. Security Patterns Applied", "5. Type Safety Check", "6. Error Handling Strategy",
          "7. API Documentation Updated", "8. Database Schema Verified", "9. Environment Variables Set",
          "10. Implementation Complete", "11. Console Logs Removed", "12. Edge Cases Handled",
          "13. Performance Check", "14. Accessibility (A11y) Check", "15. Cross-browser Check",
          "16. Unit Tests Passed", "17. Integration Tests Passed", "18. Linting & Formatting",
          "19. Code Review Approved", "20. Migration Scripts Ready", "21. Deployment Readiness"
        ];

        const report = taskFound 
          ? `Verification Report for '${taskFound.task}' (${taskFound.id}):\nStatus: ${taskFound.status}\n\n`
          : `General Verification Report for '${taskName}':\n\n`;

        const fullReport = report + checklist.map((step) => `[ ] ${step}`).join('\n');

        return {
            content: [{
                type: "text", 
                text: fullReport
            }]
        };

      } catch (error) {
        return {
          content: [{ type: "text", text: `Verification failed: ${error.message}` }]
        };
      }
    }
  );

  // Tool: Read Code
  server.tool(
    "read_code",
    "Read a file from the codebase",
    {
      filePath: z.string().describe("Path to the file relative to project root")
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
          throw new Error("Access denied: Path outside project root");
        }

        const content = await fs.readFile(fullPath, 'utf8');
        return {
          content: [{ type: "text", text: content }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error reading file: ${error.message}` }]
        };
      }
    }
  );

  // Tool: Write Code (God Mode)
  server.tool(
    "write_code",
    "Write or update a file in the codebase",
    {
      filePath: z.string().describe("Path to the file relative to project root"),
      content: z.string().describe("The new content for the file"),
      description: z.string().optional().describe("Description of the change for audit logs")
    },
    async ({ filePath, content, description }) => {
      try {
        // Security validation: prevent path traversal
        const normalizedPath = path.normalize(filePath);
        if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
          throw new Error("Access denied: Invalid path containing '..'");
        }

        const fullPath = path.resolve(process.cwd(), normalizedPath);
        if (!fullPath.startsWith(process.cwd())) {
          throw new Error("Access denied: Path outside project root");
        }

        // Additional security: prevent writing to sensitive locations
        const forbiddenPaths = ['.git', 'node_modules', '.env', 'package-lock.json'];
        const pathParts = fullPath.split(path.sep);
        if (pathParts.some(part => forbiddenPaths.includes(part))) {
          throw new Error(`Access denied: Cannot write to ${part} directory`);
        }

        // Ensure directory exists
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf8');

        // Log to stderr for server visibility
        console.error(`[MCP] Write: ${filePath} - ${description || 'No description'}`);

        return {
          content: [{ type: "text", text: `Successfully wrote ${filePath}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error writing file: ${error.message}` }]
        };
      }
    }
  );

  // Tool: Search Code (Graph-Aware)
  server.tool(
    "search_code",
    "Search for symbols, functions, or patterns using the Code Property Graph",
    {
      query: z.string().describe("The symbol or function name to search for"),
      useGraph: z.boolean().default(true).describe("Use structural graph search instead of text grep")
    },
    async ({ query, useGraph }) => {
      try {
        const { buildGraph, queryGraph } = await import('../utils/graph.js');
        const graph = await buildGraph();
        
        if (useGraph) {
          const nodes = queryGraph(graph, query);
          if (nodes.length > 0) {
            return {
              content: [{ type: "text", text: `Found structural matches in graph:\n${JSON.stringify(nodes, null, 2)}` }]
            };
          }
        }

        // Fallback to basic text search
        const files = await glob('**/*.{js,ts,jsx,tsx,md,json}', { 
          ignore: ['node_modules/**', '.git/**', 'dist/**'],
          nodir: true 
        });

        const results = [];
        for (const file of files) {
          const content = await fs.readFile(file, 'utf8');
          if (content.includes(query)) {
            results.push(file);
          }
        }

        return {
          content: [{ type: "text", text: `Matches found in files:\n${results.join('\n')}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Search failed: ${error.message}` }]
        };
      }
    }
  );

  // Tool: Analyze Impact
  server.tool(
    "analyze_impact",
    "Determine which files or functions will be impacted by changing a specific file",
    {
      filePath: z.string().describe("The file path to analyze")
    },
    async ({ filePath }) => {
      try {
        const { buildGraph, getImpactAnalysis } = await import('../utils/graph.js');
        const graph = await buildGraph();
        const impacts = getImpactAnalysis(graph, filePath);
        
        return {
          content: [{ 
            type: "text", 
            text: impacts.length > 0 
              ? `Changing ${filePath} may impact the following files:\n- ${impacts.join('\n- ')}`
              : `No direct dependents found for ${filePath}.`
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Impact analysis failed: ${error.message}` }]
        };
      }
    }
  );

  // Tool: Get Agent Prompt
  server.tool(
    "get_agent",
    "Get the system prompt for a specialized agent",
    {
      agentName: z.string().describe("Name of the agent (e.g., 'backend', 'planner', 'cto')")
    },
    async ({ agentName }) => {
      // Sanitize agent name to prevent path traversal
      const sanitizedAgentName = agentName.replace(/[^a-zA-Z0-9_-]/g, '');
      if (sanitizedAgentName !== agentName) {
        return {
          content: [{ type: "text", text: `Invalid agent name format. Only alphanumeric characters, hyphens, and underscores are allowed.` }]
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
        `agents/${lowerName}.md`
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
            content: [{ type: "text", text: content }]
          };
        } catch (e) {
          // continue
        }
      }

      return {
        content: [{ type: "text", text: `Agent '${agentName}' not found. List of agents available in agents/00-AGENT_INDEX.md` }]
      };
    }
  );

  // Tool: Start Swarm (Agent Orchestration)
  server.tool(
    "start_swarm",
    "Trigger a multi-agent swarm to plan and implement a feature",
    {
      feature: z.string().describe("Description of the feature to build"),
      mode: z.enum(['plan_only', 'execute']).default('plan_only').describe("Whether to just plan or also execute")
    },
    async ({ feature, mode }) => {
      try {
        const { runAgentLoop } = await import('../commands/run.js');
        const { createProvider, getDefaultProvider } = await import('../providers/index.js');
        const { loadState } = await import('../commands/plan.js');
        const { projectGraph } = await import('./graph.js');

        // Setup Context
        const state = await loadState();
        const context = {
          state,
          plan: state ? generateMarkdown(state) : '',
          graph: projectGraph.getSummary()
        };

        const provider = createProvider(getDefaultProvider(), { maxTokens: 8000 });

        // Step 1: Planning
        const planOutput = await runAgentLoop('planner', feature, provider, context);
        
        if (mode === 'plan_only') {
          return {
            content: [{ type: "text", text: `Swarm Planning Complete:\n\n${planOutput}` }]
          };
        }

        // Step 2: Execution (Simplified for MCP - invoking CTO)
        const execOutput = await runAgentLoop('cto', `Execute this plan:\n${planOutput}`, provider, context);
        
        return {
          content: [{ type: "text", text: `Swarm Execution Complete:\n\n${execOutput}` }]
        };

      } catch (error) {
        return {
          content: [{ type: "text", text: `Swarm failed: ${error.message}` }]
        };
      }
    }
  );

}
