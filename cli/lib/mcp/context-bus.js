import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { EventEmitter } from 'node:events';
import { loadState } from '../commands/state.js';
import { memex } from '../memory/memex.js';
import { ppmManager } from '../memory/manager.js';
import { projectGraph } from './graph.js';
import { runQualityGates } from '../quality/gate.js';
import { ultraMemory } from './memory.js';

export class ContextBus extends EventEmitter {
  constructor() {
    super();
  }

  register(server) {
    // Resources
    server.resource('project_state', 'ultra://project/state', async (uri) => {
      const state = await loadState();
      return {
        contents: [{ uri: uri.href, text: JSON.stringify(state || {}, null, 2) }]
      };
    });

    server.resource('project_context', 'ultra://project/context', async (uri) => {
      try {
        const content = await fs.readFile(path.resolve(process.cwd(), 'CONTEXT.md'), 'utf8');
        return { contents: [{ uri: uri.href, text: content }] };
      } catch {
        return { contents: [{ uri: uri.href, text: 'CONTEXT.md not found.' }] };
      }
    });

    server.resource('memory_relevant', 'ultra://memory/relevant', async (uri) => {
      const query = uri.searchParams.get('q') || '';
      const results = await memex.search(query, 5);
      return {
        contents: [{ uri: uri.href, text: JSON.stringify(results, null, 2) }]
      };
    });

    // Tools
    server.tool(
      'remember',
      'Save project fact to memory',
      {
        text: z.string(),
        tags: z.array(z.string()).optional()
      },
      async ({ text, tags }) => {
        await ultraMemory.remember(text, tags || [], 'context-bus');
        await ppmManager.add({ content: text, type: 'decision', source: { agent: 'context-bus' }, relations: tags || [] });
        return { content: [{ type: 'text', text: '✅ Remembered.' }] };
      }
    );

    server.tool(
      'query_graph',
      'Query the codebase graph',
      {
        query: z.string()
      },
      async ({ query }) => {
        if (projectGraph.nodes.size === 0) {
          await projectGraph.scan();
        }
        const matches = projectGraph.getSummary().files.filter((file) => file.includes(query));
        return { content: [{ type: 'text', text: matches.join('\n') || 'No matches.' }] };
      }
    );

    server.tool(
      'validate_output',
      'Run quality gates on output',
      {
        code: z.string().optional()
      },
      async () => {
        const { results } = await runQualityGates(process.cwd());
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
      }
    );
  }
}

export const contextBus = new ContextBus();
