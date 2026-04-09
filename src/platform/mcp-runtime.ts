export async function createRuntimeMcpServer() {
  const { createMcpServer } = await import('../../apps/cli/lib/mcp/server.js');
  const { registerTools } = await import('../../apps/cli/lib/mcp/tools.js');

  const server = createMcpServer();
  registerTools(server);
  return server;
}
