import { container } from '../di/container.js';
import { DI_TOKENS } from '../di/tokens.js';
class LegacyBridge {
  static instance;
  initialized = false;
  legacyCache = /* @__PURE__ */ new Map();
  constructor() {}
  static getInstance() {
    if (!LegacyBridge.instance) {
      LegacyBridge.instance = new LegacyBridge();
    }
    return LegacyBridge.instance;
  }
  async initialize() {
    if (this.initialized) return;
    console.log('[LegacyBridge] Initializing...');
    this.registerLegacyAdapters();
    this.initialized = true;
  }
  getService(name) {
    const tokenMap = {
      memory: DI_TOKENS.MemoryManager,
      logger: DI_TOKENS.Logger,
      config: DI_TOKENS.ConfigService,
      telemetry: DI_TOKENS.TelemetryService,
    };
    const token = tokenMap[name];
    if (!token) throw new Error(`[LegacyBridge] Unknown service: ${name}`);
    return container.resolve(token);
  }
  getLegacyMemoryManager() {
    return {
      getInstance: () => {
        const instance = container.resolve(DI_TOKENS.MemoryManager);
        if (!instance['initialized']) {
          instance.initialize().catch(console.error);
        }
        return instance;
      },
    };
  }
  registerLegacyAdapters() {
    container.registerInstance(Symbol('LegacyMemoryManager'), this.getLegacyMemoryManager());
  }
  isDiamondState() {
    return this.initialized && container.isRegistered(DI_TOKENS.MemoryManager);
  }
}
const legacyBridge = LegacyBridge.getInstance();
function getDiamondState() {
  return LegacyBridge.getInstance();
}
const CompatibilityLayer = {
  get ppmManager() {
    return legacyBridge.getLegacyMemoryManager();
  },
  get logger() {
    return legacyBridge.getService('logger');
  },
  get config() {
    return legacyBridge.getService('config');
  },
};
var legacy_bridge_default = LegacyBridge;
export {
  CompatibilityLayer,
  LegacyBridge,
  legacy_bridge_default as default,
  getDiamondState,
  legacyBridge,
};
