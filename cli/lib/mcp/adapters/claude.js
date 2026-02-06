// Copyright (c) 2026 Ultra-Dex

export function createClaudeAdapter() {
  return {
    name: 'claude-desktop',
    description: 'Claude Desktop MCP adapter',
    resources: ['ultra://project/state', 'ultra://project/context'],
    tools: ['remember', 'query_graph', 'validate_output'],
  };
}
