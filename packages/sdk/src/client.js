import { Agent } from './agent.js';
import { BaseProvider, assertProviderContract } from './provider.js';
import { PluginLoader } from './plugin.js';
import { SmartRouter } from './router.js';
import { MiddlewarePipeline } from './middleware.js';

export class UltraDex {
  constructor(config = {}) {
    if (config.baseUrl && typeof config.baseUrl !== 'string') {
      throw new Error('UltraDex SDK: config.baseUrl must be a string URL');
    }
    if (config.defaultProvider && typeof config.defaultProvider !== 'string') {
      throw new Error('UltraDex SDK: config.defaultProvider must be a string');
    }

    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      defaultProvider: config.defaultProvider,
      timeoutMs: config.timeoutMs ?? 45000,
    };
    this.providers = new Map();
    this.agents = new Map();
    this.plugins = new PluginLoader();
    this.router = null;
    this.middleware = new MiddlewarePipeline();
  }

  // -----------------------------------------------------------------------
  // Smart Router
  // -----------------------------------------------------------------------

  enableRouter(routerConfig = {}) {
    this.router = new SmartRouter(routerConfig);
    // Register any existing providers with the router
    for (const [name, provider] of this.providers) {
      this.router.addProvider(name, provider);
    }
    return this;
  }

  getRouter() {
    return this.router;
  }

  getRouterStats() {
    return this.router ? this.router.getAllStats() : {};
  }

  // -----------------------------------------------------------------------
  // Middleware
  // -----------------------------------------------------------------------

  useMiddleware(name, fn) {
    this.middleware.use(name, fn);
    return this;
  }

  // -----------------------------------------------------------------------
  // Providers
  // -----------------------------------------------------------------------

  registerProvider(name, provider) {
    if (!name || typeof name !== 'string') {
      throw new Error('UltraDex SDK: provider name must be a non-empty string');
    }
    assertProviderContract(name, provider);
    this.providers.set(name, provider);

    // Also register with router if enabled
    if (this.router) {
      this.router.addProvider(name, provider);
    }
    return this;
  }

  getProvider(name) {
    return this.providers.get(name);
  }

  listProviders() {
    return Array.from(this.providers.keys());
  }

  registerAgent(agent) {
    if (!(agent instanceof Agent)) {
      throw new Error('UltraDex SDK: registerAgent expects an Agent instance');
    }
    this.agents.set(agent.id, agent);
    return this;
  }

  getAgent(id) {
    return this.agents.get(id);
  }

  listAgents() {
    return Array.from(this.agents.values()).map((agent) => agent.describe());
  }

  use(plugin) {
    this.plugins.load(plugin);
    return this;
  }

  async chat(messages, opts = {}) {
    if (this.router && !opts.provider) {
      const routed = await this.router.route('chat', [messages, opts]);
      return routed.result;
    }
    const provider = this.#resolveProvider(opts.provider);
    return provider.chat(messages, opts);
  }

  async *stream(messages, opts = {}) {
    // Streaming always goes direct (router handles non-streaming)
    const provider = this.#resolveProvider(
      opts.provider || (this.router ? this.router.selectProvider() : undefined)
    );
    yield* provider.stream(messages, opts);
  }

  async embed(text, opts = {}) {
    if (this.router && !opts.provider) {
      const routed = await this.router.route('embed', [text, opts]);
      return routed.result;
    }
    const provider = this.#resolveProvider(opts.provider);
    return provider.embed(text, opts);
  }

  async runAgent(agentId, task, context = {}) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`UltraDex SDK: unknown agent "${agentId}"`);
    }
    const result = await agent.run(task, context);
    return {
      agentId,
      status: 'completed',
      result,
      timestamp: new Date().toISOString(),
    };
  }

  #resolveProvider(providerOverride) {
    const name = providerOverride || this.config.defaultProvider;
    if (!name) {
      throw new Error(
        'UltraDex SDK: no provider selected. Set config.defaultProvider or pass opts.provider'
      );
    }

    const provider = this.getProvider(name);
    if (!provider) {
      throw new Error(`UltraDex SDK: provider "${name}" is not registered`);
    }

    if (!(provider instanceof BaseProvider)) {
      assertProviderContract(name, provider);
    }

    return provider;
  }
}

export default UltraDex;
