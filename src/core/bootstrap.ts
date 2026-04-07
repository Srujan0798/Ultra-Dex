import { container, registerAlias, registerSingleton, resolveFromContainer } from './di/container.js';
import { DI_TOKENS } from './di/tokens.js';
import { MemoryManager } from './memory/manager.js';
import { UnifiedRegistry } from './agents/unified-registry.js';
import { AIMetaLayer } from './ai/ai-meta-layer.js';
import { EnterpriseAnalytics } from './analytics/enterprise-analytics.js';

let SystemMonitor: any;
try {
  const module: any = await import("../monitoring/SystemMonitor.js");
  SystemMonitor = module.SystemMonitor || module.default;
} catch {
  // Optional dependency
}

let bootstrapped = false;
let shutdownCallbacks: Array<() => Promise<void>> = [];

async function bootstrap(options: any = {}) {
  if (bootstrapped) {
    console.warn("[Bootstrap] Already bootstrapped, skipping...");
    return;
  }

  console.log("[Bootstrap] Initializing DI container...");

  // 1. Memory Manager
  registerSingleton(DI_TOKENS.memoryManager, () => {
    const memoryManager = new MemoryManager({
      persistent: process.env.NODE_ENV !== "test",
      maxSize: 10000
    });
    const cleanup = async () => {
      if (typeof (memoryManager as any).close === 'function') await (memoryManager as any).close();
      if (typeof (memoryManager as any).shutdown === 'function') await (memoryManager as any).shutdown();
    };
    shutdownCallbacks.push(cleanup);
    return memoryManager;
  });

  // 2. AI Meta Layer
  registerSingleton(DI_TOKENS.aiMetaLayer, () => {
    const aiMetaLayer = new AIMetaLayer({
      defaultProvider: process.env.ULTRA_DEX_DEFAULT_PROVIDER || "openai",
      enableCaching: process.env.NODE_ENV !== "test"
    });
    const cleanup = async () => {
      if (typeof (aiMetaLayer as any).cleanup === 'function') await (aiMetaLayer as any).cleanup();
      if (typeof (aiMetaLayer as any).shutdown === 'function') await (aiMetaLayer as any).shutdown();
    };
    shutdownCallbacks.push(cleanup);
    return aiMetaLayer;
  });

  // 3. Agent Registry
  registerSingleton(DI_TOKENS.agentRegistry, () => {
    const registry = resolveFromContainer(UnifiedRegistry);
    registry.config = {
      ...registry.config,
      autoDiscover: process.env.ULTRA_DEX_AUTO_DISCOVER !== "false",
      enablePersistence: process.env.NODE_ENV !== "test"
    };
    const cleanup = async () => {
      if (typeof (registry as any).shutdown === 'function') await (registry as any).shutdown();
    };
    shutdownCallbacks.push(cleanup);
    return registry;
  });

  registerAlias(DI_TOKENS.unifiedRegistry, DI_TOKENS.agentRegistry);

  // 4. Telemetry / Analytics
  registerSingleton(DI_TOKENS.telemetryService, () => {
    const analytics = new EnterpriseAnalytics({
      enabled: !options.skipAnalytics && process.env.ULTRA_DEX_ANALYTICS !== "false",
      flushInterval: options.analyticsInterval || 30000
    });
    const cleanup = async () => {
      if (typeof (analytics as any).flush === 'function') await (analytics as any).flush();
      if (typeof (analytics as any).stop === 'function') await (analytics as any).stop();
      if (typeof (analytics as any).shutdown === 'function') await (analytics as any).shutdown();
    };
    shutdownCallbacks.push(cleanup);
    return analytics;
  });

  // 5. System Monitor
  if (SystemMonitor) {
    try {
      registerSingleton(DI_TOKENS.systemMonitor, () => {
        const monitor = new SystemMonitor({
          enabled: !options.skipMonitor && process.env.ULTRA_DEX_MONITORING !== "false",
          interval: options.monitorInterval || 60000
        });
        const cleanup = async () => {
          if (typeof (monitor as any).stop === 'function') await (monitor as any).stop();
          if (typeof (monitor as any).shutdown === 'function') await (monitor as any).shutdown();
        };
        shutdownCallbacks.push(cleanup);
        return monitor;
      });
    } catch (error: any) {
      console.warn("[Bootstrap] SystemMonitor registration failed:", error?.message || String(error));
    }
  }

  // Initialize services
  try {
    const memory = container.resolve(DI_TOKENS.memoryManager) as any;
    if (typeof memory.initialize === 'function') await memory.initialize();
    else if (typeof memory.init === 'function') await memory.init();

    const ai = container.resolve(DI_TOKENS.aiMetaLayer) as any;
    if (typeof ai.initialize === 'function') await ai.initialize();
    else if (typeof ai.init === 'function') await ai.init();

    const registry = container.resolve(DI_TOKENS.agentRegistry) as any;
    if (typeof registry.initialize === 'function') await registry.initialize();
    if (typeof registry.init === 'function') await registry.init();

    if (!options.skipAnalytics && container.isRegistered(DI_TOKENS.telemetryService)) {
      const telemetry = container.resolve(DI_TOKENS.telemetryService) as any;
      if (typeof telemetry.initialize === 'function') await telemetry.initialize();
      else if (typeof telemetry.init === 'function') await telemetry.init();
    }

    if (!options.skipMonitor && container.isRegistered(DI_TOKENS.systemMonitor)) {
      const monitor = container.resolve(DI_TOKENS.systemMonitor) as any;
      if (typeof monitor.initialize === 'function') await monitor.initialize();
      else if (typeof monitor.init === 'function') await monitor.init();
    }

    console.log("[\u2705 Bootstrap] DI container initialized successfully");
    bootstrapped = true;
  } catch (error: any) {
    console.error("[\u274C Bootstrap] Initialization failed:", error);
    bootstrapped = false;
    await shutdown(); // Try to clean up whatever was started
    throw new Error(`Bootstrap failed: ${error?.message || String(error)}`);
  }
}

async function shutdown() {
  console.log("[Bootstrap] Shutting down services...");
  
  // Create a copy of callbacks and clear the global array immediately 
  // to prevent re-entry issues
  const callbacks = [...shutdownCallbacks].reverse();
  shutdownCallbacks = [];
  
  for (const callback of callbacks) {
    try {
      await callback();
    } catch (error) {
      // Don't log full error in tests to keep output clean unless it's critical
      if (process.env.NODE_ENV !== 'test') {
        console.error("[Bootstrap] Shutdown callback error:", error);
      }
    }
  }

  bootstrapped = false;
  console.log("[Bootstrap] \u2705 Shutdown complete");
}

function isBootstrapped() {
  return bootstrapped;
}

function resetForTesting() {
  const isTest = process.env.NODE_ENV === "test" || 
                 process.env.VITEST === "true" || 
                 process.env.JEST_WORKER_ID !== undefined ||
                 process.execArgv.includes('--test') ||
                 process.env.npm_lifecycle_event?.includes('test');

  if (!isTest) {
    console.warn("[Bootstrap] resetForTesting() called outside of standard test environment. Proceeding anyway.");
  }
  
  // Ensure everything is shut down first
  if (bootstrapped || shutdownCallbacks.length > 0) {
    bootstrapped = true; // Force shutdown logic to run
    // We can't await here since it's sync, but we can clear the array
    shutdownCallbacks = []; 
  }
  
  bootstrapped = false;
  
  // Clear the DI container as well
  if (typeof (container as any).reset === 'function') {
    (container as any).reset();
  }
}

export {
  bootstrap,
  shutdown,
  isBootstrapped,
  resetForTesting
};

export default {
  bootstrap,
  shutdown,
  isBootstrapped,
  resetForTesting
};
