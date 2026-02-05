export function createCursorAdapter() {
  return {
    name: 'cursor',
    description: 'Cursor IDE MCP adapter',
    resources: ['ultra://project/state', 'ultra://project/context'],
    tools: ['remember', 'query_graph', 'validate_output']
  };
}
