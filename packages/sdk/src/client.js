import { Agent } from './agent.js';
import { BaseProvider, assertProviderContract } from './provider.js';
import { PluginLoader } from './plugin.js';
import { SmartRouter } from './router.js';
import { MiddlewarePipeline } from './middleware.js';
import { Orchestrator } from '../../../src/core/orchestration/orchestrator.js';
import { ExecutionEngine } from '../../../src/core/orchestration/execution-engine.js';
import { ObservabilitySystem } from '../../../src/core/system/observability.js';

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

    // Initialize v2.0 components
    this.orchestrator = new Orchestrator();
    this.executionEngine = new ExecutionEngine();
    this.observability = new ObservabilitySystem();
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

  async execute(task, options = {}) {
    const { provider, agents, trace: enableTrace = false, mode = 'simple' } = options;

    // Orchestrate the task using v2.0 Orchestrator
    const executionTask = await this.orchestrator.orchestrate(task, mode, { provider, agents });

    // Execute the task using ExecutionEngine
    const result = await this.executionEngine.execute(executionTask);

    // Handle tracing with ObservabilitySystem if enabled
    let traceData = result.trace;
    if (enableTrace) {
      this.observability.log('execution_completed', {
        taskId: result.run_id,
        results: result.results,
        duration: result.duration,
      });
      // Additional trace data can be retrieved from observability if needed
    }

    // Support for distributed coordination (placeholder for future implementation)
    if (mode === 'distributed') {
      // Implement distributed coordination logic here
      this.observability.log('distributed_execution', { taskId: result.run_id });
    }

    return {
      ...result,
      trace: enableTrace ? traceData : undefined,
      distributed: mode === 'distributed',
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
