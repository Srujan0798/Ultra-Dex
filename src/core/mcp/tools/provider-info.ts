function getProviderRecords(manager) {
  if (manager.providerRouter?.providers instanceof Map) {
    return Array.from(manager.providerRouter.providers.entries()).map(([id, config]) => {
      const health = manager.providerRouter.getHealth?.(id) || {};
      const primaryModel = config.models?.[0]?.id || config.defaultModel || config.instance?.model || null;
      return {
        name: config.name || id,
        status: health.status || (config.enabled === false ? "disabled" : "unknown"),
        latencyP50: Number(health.averageLatency ?? 0),
        costPer1kTokens: config.costPer1kTokens || null,
        model: primaryModel
      };
    });
  }
  if (manager.aiMetaLayer?.getProviderStatus) {
    const status = manager.aiMetaLayer.getProviderStatus();
    return Object.entries(status).map(([name, provider]) => ({
      name,
      status: provider.available ? "available" : "unavailable",
      latencyP50: 0,
      costPer1kTokens: null,
      model: provider.defaultModel || null
    }));
  }
  return [];
}
function createProviderInfoTool({ manager }) {
  return {
    name: "provider-info",
    description: "List available AI providers, health status, latency, and model metadata.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {}
    },
    async handler() {
      return {
        providers: getProviderRecords(manager)
      };
    }
  };
}
var provider_info_default = createProviderInfoTool;
export {
  createProviderInfoTool,
  provider_info_default as default
};
