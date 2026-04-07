import "reflect-metadata";
import { container } from './di/container.js';
import { DI_TOKENS } from './di/tokens.js';
import { WinstonStyleLogger } from './services/logger.js';
import { ConfigService } from './services/config-service.js';
import { EmbeddingModel } from './ai/embedding-model.js';
import { SemanticRouter } from './routing/semantic-router.js';
import { HybridRouter } from './routing/hybrid-router.js';
import { IsolatedVMSandbox } from './sandbox/isolated-vm-sandbox.js';
import { SandboxRouter } from './sandbox/sandbox-router.js';
import { AlertManager } from './monitoring/alert-manager.js';
import { TelemetryService } from './telemetry/telemetry-service.js';
import { SiteReliabilityAgent } from './reliability/site-reliability-agent.js';
import { DistributedAgentMesh } from './mesh/distributed-mesh.js';
import { AgentStreamingService } from './streaming/agent-stream.js';
import { MCPAppStore } from './mcp/app-store.js';
import { StreamPipeline } from './streaming/pipeline.js';
import { AgentCommunicationBus } from './orchestration/communication-bus.js';
import { MCPRegistry } from './mcp/registry.js';
import { PluginManager } from './infrastructure/plugin-manager.js';
async function initializeDiamondState(config = {
  mesh: { enabled: true, region: "default", nodeId: `node-${process.pid}` },
  streaming: { enabled: true, port: 3002 },
  selfHealing: { enabled: true }
}) {
  console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  console.log("\u2551           INITIALIZING DIAMOND STATE ARCHITECTURE            \u2551");
  console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
  container.registerInstance(DI_TOKENS.Logger, new WinstonStyleLogger());
  container.registerInstance(DI_TOKENS.ConfigService, new ConfigService());
  const logger = container.resolve(DI_TOKENS.Logger);
  const configService = container.resolve(DI_TOKENS.ConfigService);
  logger.info("Initializing Diamond State components...");
  const alertManager = new AlertManager(logger);
  container.registerInstance(DI_TOKENS.AlertManager, alertManager);
  logger.info("\u2713 AlertManager initialized");
  const telemetry = new TelemetryService(logger, configService);
  await telemetry.initialize();
  container.registerInstance(DI_TOKENS.TelemetryService, telemetry);
  logger.info("\u2713 TelemetryService initialized");
  const embeddingModel = new EmbeddingModel(logger, configService);
  await embeddingModel.initialize();
  container.registerInstance(DI_TOKENS.EmbeddingModel, embeddingModel);
  logger.info("\u2713 EmbeddingModel initialized (all-MiniLM-L6-v2)");
  const semanticRouter = new SemanticRouter(embeddingModel, logger, configService);
  await semanticRouter.initialize();
  container.registerInstance(DI_TOKENS.SemanticRouter, semanticRouter);
  logger.info("\u2713 SemanticRouter initialized");
  const isolatedVMSandbox = new IsolatedVMSandbox(logger, configService);
  container.registerInstance(DI_TOKENS.IsolatedVMSandbox, isolatedVMSandbox);
  logger.info("\u2713 IsolatedVMSandbox initialized");
  let siteReliability;
  if (config.selfHealing?.enabled) {
    const communicationBus = new AgentCommunicationBus({});
    await communicationBus.initialize();
    const mockAIMetaLayer = {
      switchProvider: async (from, to) => {
        logger.info(`Switched provider from ${from} to ${to}`);
      },
      healthCheck: async (provider) => ({
        provider,
        healthy: true,
        latency: 100
      })
    };
    siteReliability = new SiteReliabilityAgent(
      alertManager,
      mockAIMetaLayer,
      telemetry,
      logger
    );
    container.registerInstance(DI_TOKENS.SiteReliabilityAgent, siteReliability);
    logger.info("\u2713 SiteReliabilityAgent initialized (self-healing enabled)");
  }
  let distributedMesh;
  if (config.mesh?.enabled) {
    const communicationBus = new AgentCommunicationBus({});
    await communicationBus.initialize();
    distributedMesh = new DistributedAgentMesh(
      logger,
      configService,
      communicationBus
    );
    await distributedMesh.initialize();
    logger.info("\u2713 DistributedAgentMesh initialized");
  }
  let streamingService;
  if (config.streaming?.enabled) {
    const streamPipeline = new StreamPipeline({ name: "agent-streams" });
    streamingService = new AgentStreamingService(
      logger,
      configService,
      streamPipeline
    );
    await streamingService.initialize();
    logger.info(`\u2713 AgentStreamingService initialized (port ${config.streaming.port})`);
  }
  const pluginManager = new PluginManager({});
  const mcpRegistry = new MCPRegistry({ pluginManager });
  const appStore = new MCPAppStore(mcpRegistry, pluginManager, logger);
  await appStore.initialize();
  logger.info("\u2713 MCPAppStore initialized");
  const mockAgentRegistry = {
    findByCapabilities: (caps) => []
  };
  const hybridRouter = new HybridRouter(
    semanticRouter,
    mockAgentRegistry,
    logger,
    configService
  );
  container.registerInstance(DI_TOKENS.HybridRouter, hybridRouter);
  logger.info("\u2713 HybridRouter initialized");
  console.log("");
  console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  console.log("\u2551              DIAMOND STATE INITIALIZED \u2705                     \u2551");
  console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
  return {
    logger,
    config: configService,
    alertManager,
    telemetry,
    siteReliability,
    semanticRouter,
    hybridRouter,
    embeddingModel,
    isolatedVMSandbox,
    sandboxRouter: new SandboxRouter(isolatedVMSandbox, configService, logger),
    distributedMesh,
    streamingService,
    appStore
  };
}
function getDiamondStats(state) {
  return {
    semanticRouter: state.semanticRouter.getStats(),
    telemetry: state.telemetry.getServiceMetrics(),
    alerts: state.alertManager.getStats(),
    selfHealing: state.siteReliability?.getStats(),
    streaming: state.streamingService?.getStats(),
    mesh: state.distributedMesh?.getStats(),
    appStore: state.appStore?.getStats()
  };
}
export * from './di/tokens.js';
export * from './di/container.js';
export * from './interfaces/index.js';
export * from './services/index.js';
export * from './ai/embedding-model.js';
export * from './routing/semantic-router.js';
export * from './routing/hybrid-router.js';
export * from './routing/agent-profiles.js';
export * from './sandbox/isolated-vm-sandbox.js';
export * from './sandbox/sandbox-router.js';
export * from './sandbox/virtual-fs.js';
export * from './monitoring/alert-manager.js';
export * from './telemetry/telemetry-service.js';
export * from './reliability/site-reliability-agent.js';
export * from './reliability/healing-strategies.js';
export * from './mesh/distributed-mesh.js';
export * from './streaming/agent-stream.js';
export * from './mcp/app-store.js';
export {
  getDiamondStats,
  initializeDiamondState
};
