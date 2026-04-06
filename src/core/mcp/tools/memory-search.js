function normalizeResult(item, fallbackTier) {
  return {
    content: item?.content || item?.text || JSON.stringify(item),
    score: Number(item?.score ?? item?.similarity ?? 1),
    tier: item?.tier || fallbackTier || 'hot',
    timestamp: item?.timestamp || item?.createdAt || new Date().toISOString(),
  };
}

async function searchMemory(manager, query, limit, tier) {
  if (!manager.memory) return [];

  if (typeof manager.memory.retrieve === 'function') {
    const result = await manager.memory.retrieve(query, { limit });
    return result?.items || result?.results || [];
  }

  if (typeof manager.memory.search === 'function') {
    const result = await manager.memory.search(query, limit, { tier });
    return Array.isArray(result) ? result : result?.items || result?.results || [];
  }

  return [];
}

export function createMemorySearchTool({ manager }) {
  return {
    name: 'memory-search',
    description: 'Query the Ultra-Dex memory system across hot, warm, or cold tiers.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['query'],
      properties: {
        query: {
          type: 'string',
          description: 'Search query.',
        },
        limit: {
          type: 'number',
          minimum: 1,
          description: 'Maximum number of results to return.',
        },
        tier: {
          type: 'string',
          enum: ['hot', 'warm', 'cold'],
          description: 'Optional storage tier hint.',
        },
      },
    },
    async handler({ query, limit = 5, tier } = {}) {
      if (!query || typeof query !== 'string') {
        throw new Error('query is required');
      }

      const items = await searchMemory(manager, query, limit, tier);
      return {
        results: items.slice(0, limit).map((item) => normalizeResult(item, tier)),
      };
    },
  };
}

export default createMemorySearchTool;
