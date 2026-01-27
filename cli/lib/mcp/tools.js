import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { loadState, saveState, generateMarkdown } from '../commands/plan.js';
import { projectGraph } from './graph.js';

export function registerTools(server) {
  // Tool: Update Task Status
  server.tool(
    "update_task_status",
    "Update the status of a task in the project plan",
    {
      taskId: z.string().describe("The ID of the task (e.g., '1.1', '2.3')"),
      status: z.enum(['pending', 'in_progress', 'completed']).describe("New status")
    },
    async ({ taskId, status }) => {
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
    "Run verification checks for a specific task",
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

        if (taskFound) {
            return {
                content: [{
                    type: "text", 
                    text: `Verification Report for '${taskFound.task}' (${taskFound.id}):\nStatus: ${taskFound.status}\n\n[ ] Check 1: Code implemented\n[ ] Check 2: Tests passed\n[ ] Check 3: Review complete` 
                }]
            };
        }

        return {
            content: [{ type: "text", text: `Task '${taskName}' not found in current plan.` }]
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
        const fullPath = path.resolve(process.cwd(), filePath);
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
        const fullPath = path.resolve(process.cwd(), filePath);
        if (!fullPath.startsWith(process.cwd())) {
          throw new Error("Access denied: Path outside project root");
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
      const lowerName = agentName.toLowerCase();
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
          const fullPath = path.resolve(process.cwd(), p);
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
}
