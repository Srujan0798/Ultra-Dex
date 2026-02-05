import { DynamicTool } from '@langchain/core/tools';

export function toLangChainTool(toolDef) {
  return new DynamicTool({
    name: toolDef.name,
    description: toolDef.description || '',
    func: async (input) => {
      if (toolDef.handler) {
        return toolDef.handler(input);
      }
      return JSON.stringify({ ok: false, error: 'No handler bound' });
    }
  });
}

export function mapTools(toolDefs = []) {
  return toolDefs.map(toLangChainTool);
}
