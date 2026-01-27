import fs from 'fs/promises';
import path from 'path';
import { loadState, generateMarkdown } from '../commands/plan.js';
import { projectGraph } from './graph.js';

export function registerResources(server) {
  // Resource: Graph Summary
  server.resource(
    "graph",
    "ultradex://graph/summary",
    async (uri) => {
      if (projectGraph.nodes.size === 0) {
        await projectGraph.scan();
      }
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(projectGraph.getSummary(), null, 2)
        }]
      };
    }
  );

  // Resource: Project Context
  server.resource(
    "context",
    "ultradex://context",
    async (uri) => {
      try {
        const content = await fs.readFile(path.resolve(process.cwd(), 'CONTEXT.md'), 'utf8');
        return {
          contents: [{
            uri: uri.href,
            text: content
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: "_No CONTEXT.md found. Run `ultra-dex init` to create one._"
          }]
        };
      }
    }
  );

  // Resource: Implementation Plan
  server.resource(
    "plan",
    "ultradex://plan",
    async (uri) => {
      try {
        // Try to load state first for dynamic plan
        const state = await loadState();
        let content = "";
        if (state) {
          content = generateMarkdown(state);
        } else {
          // Fallback to file
          content = await fs.readFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), 'utf8');
        }
        return {
          contents: [{
            uri: uri.href,
            text: content
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: "_No IMPLEMENTATION-PLAN.md found._"
          }]
        };
      }
    }
  );

  // Resource: Agents Index
  server.resource(
    "agents",
    "ultradex://agents",
    async (uri) => {
      try {
        const content = await fs.readFile(path.resolve(process.cwd(), 'agents/00-AGENT_INDEX.md'), 'utf8');
        return {
          contents: [{
            uri: uri.href,
            text: content
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: "_No agent index found._"
          }]
        };
      }
    }
  );

  // Resource: Machine State
  server.resource(
    "state",
    "ultradex://state",
    async (uri) => {
      try {
        const state = await loadState();
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(state, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ error: "No state found" })
          }]
        };
      }
    }
  );

  // Resource: Code Property Graph (GOD MODE)
  server.resource(
    "graph",
    "ultradex://graph",
    async (uri) => {
      try {
        const { buildGraph } = await import('../utils/graph.js');
        const graph = await buildGraph();
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(graph, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ error: `Graph build failed: ${error.message}` })
          }]
        };
      }
    }
  );
}
