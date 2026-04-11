// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra Protocol Handler
 * Manages ultra:// URI scheme for context deep-linking
 */
export class UltraProtocolHandler {
  constructor(projectManager) {
    this.projectManager = projectManager;
  }

  async handle(uri) {
    const url = new URL(uri);
    const path = url.hostname + url.pathname;

    switch (path) {
      case 'project/state':
        return await this.projectManager.getState();
      case 'project/context':
        return await this.projectManager.getContext();
      case 'memory/search': {
        const query = url.searchParams.get('q');
        return await this.projectManager.searchMemory(query);
      }
      default:
        throw new Error(`Unknown ultra protocol path: ${path}`);
    }
  }
}

/**
 * Backward-compatible protocol registration hook used by MCP server bootstrap.
 * Older codepaths call this directly; keep it as a no-op when no project manager exists.
 */
export function registerUltraProtocol(server, projectManager = null) {
  if (!server || !projectManager) return;
  const handler = new UltraProtocolHandler(projectManager);

  // Register a minimal tool contract if the SDK surface is available.
  if (typeof server.tool === 'function') {
    server.tool(
      'ultra_protocol',
      {
        uri: {
          type: 'string',
          description: 'Ultra protocol URI (ultra://...)',
        },
      },
      async ({ uri }) => {
        const result = await handler.handle(uri);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );
  }
}
