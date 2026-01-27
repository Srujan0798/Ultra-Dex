import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { loadState } from '../commands/plan.js';
import { glob } from 'glob';

export function registerTools(server) {
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

  // Tool: Search Code (Semantic/Structural Stub)
  server.tool(
    "search_code",
    "Search for symbols or patterns across the codebase (Graph-Aware Search)",
    {
      query: z.string().describe("The search query or symbol name"),
      includeTests: z.boolean().default(false).describe("Whether to include test files")
    },
    async ({ query, includeTests }) => {
      try {
        // Implementation for God Mode Phase 2.1: 
        // For now, use basic glob + grep-like search, but structured for CPG expansion.
        const files = await glob('**/*.{js,ts,jsx,tsx,md,json}', { 
          ignore: ['node_modules/**', '.git/**', 'dist/**'],
          nodir: true 
        });

        const results = [];
        for (const file of files) {
          if (!includeTests && (file.includes('.test.') || file.includes('/test/'))) continue;
          
          const content = await fs.readFile(file, 'utf8');
          if (content.includes(query)) {
            // Find line numbers
            const lines = content.split('\n');
            const matches = lines.map((l, i) => l.includes(query) ? i + 1 : null).filter(n => n !== null);
            results.push({ file, matches });
          }
        }

        if (results.length === 0) {
          return { content: [{ type: "text", text: `No matches found for "${query}"` }] };
        }

        const report = results.map(r => `- ${r.file} (Lines: ${r.matches.join(', ')})`).join('\n');
        return {
          content: [{ type: "text", text: `Search results for "${query}":\n${report}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Search failed: ${error.message}` }]
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
