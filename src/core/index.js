// Copyright (c) 2026 Ultra-Dex
// src/index.js

import { aiMetaLayer } from './core/ai/ai-meta-layer.js';
import { agentMetaOrchestrator } from './core/agents/agent-meta-orchestrator.js';
import { contextMetaManager } from './core/memory/context-meta-manager.js';
import { configLoader } from './utils/config-loader.js';
import { logger } from './utils/logging.js';

/**
 * Ultra-Dex Meta-Layer
 * The next-generation AI orchestration platform
 */
class UltraDexMetaLayer {
  constructor(options = {}) {
    this.config = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    
    this.aiMetaLayer = aiMetaLayer;
    this.agentMetaOrchestrator = agentMetaOrchestrator;
    this.contextMetaManager = contextMetaManager;
    this.configLoader = configLoader;
    this.logger = logger;
    
    this.options = {
      autoInitialize: options.autoInitialize !== false,
      ...options
    };
    
    if (this.options.autoInitialize) {
      this.initialize();
    }
  }

  /**
   * Initialize the Ultra-Dex Meta-Layer
   */
  async initialize() {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  async performInitialization() {
    const startTime = Date.now();
    
    try {
      this.logger.info('Initializing Ultra-Dex Meta-Layer...', {
        version: '6.0.0',
        timestamp: new Date().toISOString()
      });

      // Load configuration
      this.config = await this.configLoader.load();
      this.logger.info('Configuration loaded', { 
        mode: this.config.metaLayer.mode,
        providers: Object.keys(this.config.aiProviders).filter(p => this.config.aiProviders[p].enabled)
      });

      // Initialize AI Meta-Layer
      this.logger.info('Initializing AI Meta-Layer...');
      // aiMetaLayer is already initialized via import

      // Initialize Agent Meta-Orchestrator
      this.logger.info('Initializing Agent Meta-Orchestrator...');
      // agentMetaOrchestrator is already initialized via import

      // Initialize Context Meta-Manager
      this.logger.info('Initializing Context Meta-Manager...');
      // contextMetaManager is already initialized via import

      // Register default agents
      await this.registerDefaultAgents();

      // Log initialization metrics
      const initTime = Date.now() - startTime;
      this.logger.info('Ultra-Dex Meta-Layer initialized successfully', {
        initTime: `${initTime}ms`,
        timestamp: new Date().toISOString()
      });

      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize Ultra-Dex Meta-Layer', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Register default agents
   */
  async registerDefaultAgents() {
    const defaultAgents = [
      {
        id: 'orchestrator',
        name: 'Orchestrator Agent',
        description: 'Coordinates complex multi-agent workflows',
        capabilities: ['workflow', 'coordination', 'decision-making'],
        priority: 9,
        maxConcurrency: 1
      },
      {
        id: 'planner',
        name: 'Planner Agent',
        description: 'Creates detailed execution plans',
        capabilities: ['planning', 'analysis', 'design'],
        priority: 8,
        maxConcurrency: 2
      },
      {
        id: 'implementer',
        name: 'Implementer Agent',
        description: 'Implements planned features',
        capabilities: ['coding', 'implementation', 'execution'],
        priority: 8,
        maxConcurrency: 3
      },
      {
        id: 'reviewer',
        name: 'Reviewer Agent',
        description: 'Reviews code and suggests improvements',
        capabilities: ['review', 'quality', 'security'],
        priority: 7,
        maxConcurrency: 2
      },
      {
        id: 'tester',
        name: 'Tester Agent',
        description: 'Creates and runs tests',
        capabilities: ['testing', 'validation', 'qa'],
        priority: 7,
        maxConcurrency: 2
      }
    ];

    for (const agent of defaultAgents) {
      this.agentMetaOrchestrator.registerAgent(agent.id, agent);
    }

    this.logger.info(`Registered ${defaultAgents.length} default agents`);
  }

  /**
   * Process a request through the meta-layer
   */
  async processRequest(request, options = {}) {
    await this.initialize();

    const requestId = options.requestId || this.generateRequestId();
    const startTime = Date.now();

    this.logger.info('Processing request', {
      requestId,
      requestType: typeof request,
      length: typeof request === 'string' ? request.length : JSON.stringify(request).length,
      timestamp: new Date().toISOString()
    });

    try {
      // Determine the appropriate processing path
      if (this.isAgentRequest(request)) {
        const result = await this.agentMetaOrchestrator.executeTask(request, {
          ...options,
          requestId
        });
        
        this.logger.info('Agent request completed', {
          requestId,
          processingTime: Date.now() - startTime
        });
        
        return result;
      } else {
        // Treat as a direct AI request
        const messages = this.formatAsMessages(request);
        const result = await this.aiMetaLayer.call(
          options.model || 'gpt-4o-2024-11-20',
          messages,
          options
        );
        
        this.logger.info('AI request completed', {
          requestId,
          processingTime: Date.now() - startTime,
          tokens: result.usage?.totalTokens
        });
        
        return result;
      }
    } catch (error) {
      this.logger.error('Request processing failed', {
        requestId,
        error: error.message,
        processingTime: Date.now() - startTime
      });
      
      throw error;
    }
  }

  /**
   * Check if request is for agent processing
   */
  isAgentRequest(request) {
    // Simple heuristic: if request contains agent-specific terms
    if (typeof request !== 'string') return false;
    
    const agentTerms = ['agent', 'execute', 'coordinate', 'workflow', 'task', 'delegate'];
    return agentTerms.some(term => request.toLowerCase().includes(term));
  }

  /**
   * Format request as messages for AI
   */
  formatAsMessages(request) {
    if (Array.isArray(request)) {
      return request;
    }
    
    return [
      { role: 'user', content: typeof request === 'string' ? request : JSON.stringify(request) }
    ];
  }

  /**
   * Generate a unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get system status
   */
  getStatus() {
    if (!this.isInitialized) {
      return { status: 'initializing', timestamp: new Date().toISOString() };
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - (this.initializationStartTime || Date.now()),
      components: {
        aiMetaLayer: { status: 'ready', providers: this.aiMetaLayer.getProviderStatus() },
        agentMetaOrchestrator: { 
          status: 'ready', 
          agents: this.agentMetaOrchestrator.getMetrics().orchestrator.totalAgents,
          activeSessions: this.agentMetaOrchestrator.getMetrics().orchestrator.activeSessions
        },
        contextMetaManager: {
          status: 'ready',
          totalMemories: this.contextMetaManager.getStats().totalMemories,
          contextWindows: this.contextMetaManager.getStats().contextWindowsCount
        }
      }
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      aiMetaLayer: this.aiMetaLayer.getMetrics(),
      agentMetaOrchestrator: this.agentMetaOrchestrator.getMetrics(),
      contextMetaManager: this.contextMetaManager.getStats(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Shutdown the meta-layer
   */
  async shutdown() {
    this.logger.info('Shutting down Ultra-Dex Meta-Layer...');
    
    // Perform cleanup operations
    await this.contextMetaManager.cleanupExpiredMemories();
    
    this.isInitialized = false;
    this.initializationPromise = null;
    
    this.logger.info('Ultra-Dex Meta-Layer shut down successfully');
  }
}

// Create and export the main instance
const ultraDex = new UltraDexMetaLayer();

// Export the class and instance
export { UltraDexMetaLayer, ultraDex };
export default ultraDex;

// Also export individual components
export { aiMetaLayer } from './core/ai/ai-meta-layer.js';
export { agentMetaOrchestrator } from './core/agents/agent-meta-orchestrator.js';
export { contextMetaManager } from './core/memory/context-meta-manager.js';
export { configLoader } from './utils/config-loader.js';
export { logger } from './utils/logging.js';