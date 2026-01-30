/**
 * LangChain Adapter for Ultra-Dex
 * Allows Ultra-Dex to use LangChain chains and agents
 *
 * Usage:
 *   import { LangChainAdapter } from './langchain.js';
 *   const adapter = new LangChainAdapter({ model: 'gpt-4' });
 *   const result = await adapter.runChain('summarize', { text: '...' });
 */

import { BaseProvider } from './base.js';

/**
 * LangChain integration adapter
 * Bridges Ultra-Dex agents with LangChain ecosystem
 */
export class LangChainAdapter extends BaseProvider {
  constructor(options = {}) {
    super(options.apiKey || process.env.OPENAI_API_KEY, options);
    this.langchain = null;
    this.chains = new Map();
    this.agents = new Map();
    this.memory = options.memory || null;
    this.verbose = options.verbose || false;
  }

  getName() {
    return 'LangChain';
  }

  getDefaultModel() {
    return 'gpt-4';
  }

  getAvailableModels() {
    return [
      { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 16384 },
      { id: 'claude-3-opus', name: 'Claude 3 Opus', maxTokens: 200000 },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', maxTokens: 200000 },
    ];
  }

  estimateCost(inputTokens, outputTokens) {
    // Approximate costs for GPT-4
    const inputCost = (inputTokens / 1000) * 0.03;
    const outputCost = (outputTokens / 1000) * 0.06;
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
    };
  }

  /**
   * Initialize LangChain dynamically (lazy load)
   */
  async initialize() {
    if (this.langchain) return;

    try {
      // Dynamic import for optional dependency
      const langchainCore = await import('@langchain/core');
      const langchainOpenAI = await import('@langchain/openai');

      this.langchain = {
        ChatOpenAI: langchainOpenAI.ChatOpenAI,
        HumanMessage: langchainCore.HumanMessage,
        SystemMessage: langchainCore.SystemMessage,
        AIMessage: langchainCore.AIMessage,
      };

      this.llm = new this.langchain.ChatOpenAI({
        modelName: this.model,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        openAIApiKey: this.apiKey,
        streaming: true,
      });
    } catch (error) {
      throw new Error(
        'LangChain not installed. Run: npm install @langchain/core @langchain/openai'
      );
    }
  }

  /**
   * Register a custom chain
   * @param {string} name - Chain identifier
   * @param {Function} chainBuilder - Function that builds the chain
   */
  registerChain(name, chainBuilder) {
    this.chains.set(name, chainBuilder);
  }

  /**
   * Register a custom agent
   * @param {string} name - Agent identifier
   * @param {Object} agentConfig - Agent configuration
   */
  registerAgent(name, agentConfig) {
    this.agents.set(name, agentConfig);
  }

  /**
   * Run a registered chain
   * @param {string} chainName - Name of the chain to run
   * @param {Object} input - Input for the chain
   * @returns {Promise<Object>} Chain result
   */
  async runChain(chainName, input) {
    await this.initialize();

    const chainBuilder = this.chains.get(chainName);
    if (!chainBuilder) {
      throw new Error(`Chain "${chainName}" not registered`);
    }

    const chain = await chainBuilder(this.llm, this.memory);
    return await chain.invoke(input);
  }

  /**
   * Run a registered agent
   * @param {string} agentName - Name of the agent to run
   * @param {string} task - Task for the agent
   * @returns {Promise<Object>} Agent result
   */
  async runAgent(agentName, task) {
    await this.initialize();

    const agentConfig = this.agents.get(agentName);
    if (!agentConfig) {
      throw new Error(`Agent "${agentName}" not registered`);
    }

    // Use LangChain agent executor pattern
    const result = await agentConfig.executor.invoke({
      input: task,
    });

    return result;
  }

  /**
   * Generate completion using LangChain
   */
  async generate(systemPrompt, userPrompt, _options = {}) {
    await this.initialize();

    const messages = [
      new this.langchain.SystemMessage(systemPrompt),
      new this.langchain.HumanMessage(userPrompt),
    ];

    const response = await this.llm.invoke(messages);

    return {
      content: response.content,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
      model: this.model,
    };
  }

  /**
   * Generate with streaming
   */
  async generateStream(systemPrompt, userPrompt, onChunk, _options = {}) {
    await this.initialize();

    const messages = [
      new this.langchain.SystemMessage(systemPrompt),
      new this.langchain.HumanMessage(userPrompt),
    ];

    let fullContent = '';

    const stream = await this.llm.stream(messages);

    for await (const chunk of stream) {
      const text = chunk.content || '';
      fullContent += text;
      if (onChunk) onChunk(text);
    }

    return {
      content: fullContent,
      usage: {
        inputTokens: 0, // LangChain streaming doesn't provide token counts
        outputTokens: 0,
      },
      model: this.model,
    };
  }

  async validateApiKey() {
    try {
      await this.initialize();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a RAG (Retrieval Augmented Generation) chain
   * @param {Object} vectorStore - Vector store instance
   * @param {string} prompt - Custom prompt template
   */
  async createRAGChain(vectorStore, prompt) {
    await this.initialize();

    // This would use LangChain's createRetrievalChain
    // For now, return a placeholder that can be extended
    return {
      invoke: async (query) => {
        const docs = await vectorStore.similaritySearch(query, 4);
        const context = docs.map(d => d.pageContent).join('\n\n');

        return await this.generate(
          prompt || 'Answer based on the context provided.',
          `Context:\n${context}\n\nQuestion: ${query}`
        );
      },
    };
  }

  /**
   * Sync Ultra-Dex state to LangChain memory
   * @param {Object} ultraDexState - State from .ultra/state.json
   */
  async syncFromUltraDex(ultraDexState) {
    if (!this.memory) return;

    // Convert Ultra-Dex state to LangChain memory format
    const context = `
Project: ${ultraDexState.project?.name || 'Unknown'}
Current Phase: ${ultraDexState.phases?.find(p => p.status === 'in_progress')?.name || 'None'}
Active Agents: ${ultraDexState.agents?.active?.join(', ') || 'None'}
    `.trim();

    await this.memory.saveContext(
      { input: 'Project context loaded' },
      { output: context }
    );
  }

  /**
   * Export conversation to Ultra-Dex history format
   * @returns {Array} History entries for Ultra-Dex
   */
  async exportToUltraDex() {
    if (!this.memory) return [];

    const messages = await this.memory.loadMemoryVariables({});

    return messages.history?.map((msg, i) => ({
      id: `lc-${i}`,
      role: msg._getType?.() === 'human' ? 'user' : 'assistant',
      content: msg.content,
      timestamp: new Date().toISOString(),
      provider: 'langchain',
    })) || [];
  }
}

/**
 * Pre-built chain templates
 */
export const ChainTemplates = {
  /**
   * Summarization chain
   */
  summarize: (llm) => ({
    invoke: async ({ text, maxLength = 500 }) => {
      const response = await llm.invoke([
        { role: 'system', content: `Summarize the following text in under ${maxLength} characters.` },
        { role: 'user', content: text },
      ]);
      return { summary: response.content };
    },
  }),

  /**
   * Code review chain
   */
  codeReview: (llm) => ({
    invoke: async ({ code, language = 'javascript' }) => {
      const response = await llm.invoke([
        { role: 'system', content: `You are a code reviewer. Review the following ${language} code for bugs, security issues, and improvements.` },
        { role: 'user', content: code },
      ]);
      return { review: response.content };
    },
  }),

  /**
   * Task breakdown chain
   */
  taskBreakdown: (llm) => ({
    invoke: async ({ feature }) => {
      const response = await llm.invoke([
        { role: 'system', content: 'Break down the following feature into atomic, actionable tasks. Output as a numbered list.' },
        { role: 'user', content: feature },
      ]);
      return { tasks: response.content };
    },
  }),
};

export default LangChainAdapter;
