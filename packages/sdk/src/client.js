import { Agent } from './agent.js';
import { BaseProvider, assertProviderContract } from './provider.js';
import { PluginLoader } from './plugin.js';
import { SmartRouter } from './router.js';
import { MiddlewarePipeline } from './middleware.js';
import { Orchestrator } from '../../../src/core/orchestration/orchestrator.js';
import { ExecutionEngine } from '../../../src/core/orchestration/execution-engine.js';
import { ObservabilitySystem } from '../../../src/core/system/observability.js';
import { DistributedCoordinator } from '../../../src/core/orchestration/distributed-coordinator.js';

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
      distributedPeers: config.distributedPeers || [],
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

    // Initialize distributed coordinator if peers configured
    this.distributedCoordinator = null;
    if (this.config.distributedPeers.length > 0) {
      this.distributedCoordinator = new DistributedCoordinator({
        discoveryUrls: this.config.distributedPeers,
        instanceId: config.instanceId || `ultradex_${Date.now()}`,
        orchestrator: this.orchestrator,
        executionEngine: this.executionEngine,
      });
    }
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

  // -----------------------------------------------------------------------
  // Distributed Coordination
  // -----------------------------------------------------------------------

  addDistributedPeer(peerUrl) {
    if (!this.config.distributedPeers.includes(peerUrl)) {
      this.config.distributedPeers.push(peerUrl);
    }
    if (this.distributedCoordinator) {
      // Note: Coordinator manages peers via discovery; this updates config for future use
    }
    return this;
  }

  removeDistributedPeer(peerUrl) {
    const index = this.config.distributedPeers.indexOf(peerUrl);
    if (index > -1) {
      this.config.distributedPeers.splice(index, 1);
    }
    if (this.distributedCoordinator) {
      // Remove from coordinator's peers if possible
      for (const [id, peer] of this.distributedCoordinator.peers) {
        if (peer.url === peerUrl) {
          this.distributedCoordinator.peers.delete(id);
          break;
        }
      }
    }
    return this;
  }

  listDistributedPeers() {
    if (this.distributedCoordinator) {
      return Array.from(this.distributedCoordinator.peers.values()).map((peer) => ({
        id: peer.id,
        url: peer.url,
        status: peer.status,
        lastSeen: peer.lastSeen,
      }));
    }
    return this.config.distributedPeers.map((url) => ({ url, configured: true }));
  }

  async execute(task, options = {}) {
    const { provider, agents, trace: enableTrace = false, mode = 'simple' } = options;

    if (mode === 'distributed') {
      // Initialize distributed coordinator if not already
      if (!this.distributedCoordinator) {
        this.distributedCoordinator = new DistributedCoordinator({
          discoveryUrls: this.config.distributedPeers,
          instanceId: this.config.instanceId || `ultradex_${Date.now()}`,
          orchestrator: this.orchestrator,
          executionEngine: this.executionEngine,
        });
        await this.distributedCoordinator.initialize();
      }

      // Use distributed coordinator for task execution
      const distributedResult = await this.distributedCoordinator.submitTask(task, options);

      // Handle tracing
      if (enableTrace) {
        this.observability.log('distributed_execution_completed', {
          taskId: distributedResult.taskId,
          results: distributedResult.result,
        });
      }

      return {
        run_id: distributedResult.taskId,
        results: distributedResult.result,
        duration: 0, // TODO: get from coordinator
        trace: enableTrace ? distributedResult.trace : undefined,
        distributed: true,
      };
    }

    // Local mode: Orchestrate the task using v2.0 Orchestrator
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

    return {
      ...result,
      trace: enableTrace ? traceData : undefined,
      distributed: false,
    };
  }

  /**
   * Execute task with streaming support for real-time progress updates
   * @param {string} task - The task to execute
   * @param {Object} options - Execution options
   * @param {Function} options.onProgress - Callback for progress updates
   * @param {boolean} options.trace - Enable tracing
   * @param {string} options.mode - Execution mode ('simple', 'detailed', 'iterative', 'distributed')
   * @returns {AsyncGenerator} Streaming results with progress updates
   */
  async *executeStream(task, options = {}) {
    const { onProgress, trace: enableTrace = false, mode = 'simple', provider, agents } = options;

    try {
      if (mode === 'distributed') {
        // Initialize distributed coordinator if not already
        if (!this.distributedCoordinator) {
          this.distributedCoordinator = new DistributedCoordinator({
            discoveryUrls: this.config.distributedPeers,
            instanceId: this.config.instanceId || `ultradex_${Date.now()}`,
            orchestrator: this.orchestrator,
            executionEngine: this.executionEngine,
          });
          await this.distributedCoordinator.initialize();
        }

        // For distributed streaming, we need to handle peer communication
        // This is a simplified implementation - in production, this would need WebSocket streaming
        const taskId = `distributed_stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Yield initial progress
        const initialProgress = {
          type: 'start',
          taskId,
          status: 'initializing',
          distributed: true,
          peers: this.distributedCoordinator.peers.size,
        };
        if (onProgress) onProgress(initialProgress);
        yield initialProgress;

        // For now, delegate to peer and simulate streaming
        // In a full implementation, this would use WebSocket streaming between peers
        if (this.distributedCoordinator.peers.size > 0) {
          const targetPeer = this.distributedCoordinator.selectPeerForTask(task);
          if (targetPeer) {
            // Simulate streaming by yielding progress updates
            yield {
              type: 'peer_selected',
              taskId,
              peerId: targetPeer.id,
              status: 'delegating',
            };

            // Execute locally for now - full distributed streaming would require WebSocket upgrades
            const streamGenerator = this.distributedCoordinator.executeTaskLocallyStream(task, {
              ...options,
              onProgress,
            });

            for await (const progress of streamGenerator) {
              yield {
                ...progress,
                distributed: true,
                peerId: targetPeer.id,
              };
            }
          } else {
            throw new Error('No available peers for distributed streaming');
          }
        } else {
          // Fall back to local streaming if no peers
          yield {
            type: 'fallback_to_local',
            taskId,
            status: 'executing_locally',
          };

          const streamGenerator = this.executeStreamLocal(task, { ...options, mode: 'simple' });
          for await (const progress of streamGenerator) {
            yield {
              ...progress,
              distributed: false,
            };
          }
        }

        // Handle tracing for distributed execution
        if (enableTrace) {
          this.observability.log('distributed_stream_execution_completed', {
            taskId,
            mode: 'streaming',
          });
        }

        return;
      }

      // Local streaming mode
      yield* this.executeStreamLocal(task, options);
    } catch (error) {
      // Yield error progress
      const errorProgress = {
        type: 'error',
        status: 'failed',
        error: error.message,
        trace: enableTrace ? {} : undefined,
      };
      if (onProgress) onProgress(errorProgress);
      yield errorProgress;

      throw error;
    }
  }

  /**
   * Execute task locally with streaming
   */
  async *executeStreamLocal(task, options = {}) {
    const { onProgress, trace: enableTrace = false, provider, agents, mode = 'simple' } = options;

    // Orchestrate the task using v2.0 Orchestrator
    const executionTask = await this.orchestrator.orchestrate(task, mode, { provider, agents });

    // Execute the task using ExecutionEngine with streaming
    const streamGenerator = this.executionEngine.executeStream(executionTask, { onProgress });

    for await (const progress of streamGenerator) {
      // Add observability logging if tracing enabled
      if (enableTrace && progress.type === 'complete') {
        this.observability.log('stream_execution_completed', {
          taskId: progress.run_id,
          results: progress.results,
          duration: progress.duration,
        });
      }

      yield {
        ...progress,
        trace: enableTrace ? progress.trace : undefined,
        distributed: false,
      };
    }
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
