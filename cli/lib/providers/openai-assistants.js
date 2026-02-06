// Copyright (c) 2026 Ultra-Dex

/**
 * OpenAI Assistants API Integration for Ultra-Dex
 * Enables persistent threads and assistant management
 *
 * Usage:
 *   import { OpenAIAssistantsProvider } from './openai-assistants.js';
 *   const provider = new OpenAIAssistantsProvider();
 *   const thread = await provider.createThread();
 *   await provider.addMessage(thread.id, 'Help me build a REST API');
 *   const response = await provider.runAssistant(thread.id, assistantId);
 */

import { BaseProvider } from './base.js';

/**
 * OpenAI Assistants API provider
 * Supports persistent threads, file uploads, and code interpreter
 */
export class OpenAIAssistantsProvider extends BaseProvider {
  constructor(options = {}) {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    super(apiKey, options);
    this.baseUrl = 'https://api.openai.com/v1';
    this.assistantId = options.assistantId || null;
    this.threadId = options.threadId || null;
    this.tools = options.tools || ['code_interpreter'];
  }

  getName() {
    return 'OpenAI Assistants';
  }

  getDefaultModel() {
    return 'gpt-4-turbo';
  }

  getAvailableModels() {
    return [
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000 },
      { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 128000 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 16384 },
    ];
  }

  estimateCost(inputTokens, outputTokens) {
    const inputCost = (inputTokens / 1000) * 0.01;
    const outputCost = (outputTokens / 1000) * 0.03;
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
    };
  }

  /**
   * Make API request to OpenAI
   */
  async _request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    return data;
  }

  // ============================================
  // ASSISTANT MANAGEMENT
  // ============================================

  /**
   * Create a new assistant
   * @param {Object} config - Assistant configuration
   * @returns {Promise<Object>} Created assistant
   */
  async createAssistant(config = {}) {
    const assistant = await this._request('/assistants', 'POST', {
      model: config.model || this.model,
      name: config.name || 'Ultra-Dex Agent',
      instructions: config.instructions || 'You are a helpful coding assistant.',
      tools: config.tools || this.tools.map((t) => ({ type: t })),
      metadata: {
        source: 'ultra-dex',
        version: (await import('../utils/version.js')).getVersion(),
        ...config.metadata,
      },
    });

    this.assistantId = assistant.id;
    return assistant;
  }

  /**
   * List all assistants
   */
  async listAssistants(limit = 20) {
    return await this._request(`/assistants?limit=${limit}`);
  }

  /**
   * Get an assistant by ID
   */
  async getAssistant(assistantId) {
    return await this._request(`/assistants/${assistantId}`);
  }

  /**
   * Update an assistant
   */
  async updateAssistant(assistantId, updates) {
    return await this._request(`/assistants/${assistantId}`, 'POST', updates);
  }

  /**
   * Delete an assistant
   */
  async deleteAssistant(assistantId) {
    return await this._request(`/assistants/${assistantId}`, 'DELETE');
  }

  // ============================================
  // THREAD MANAGEMENT
  // ============================================

  /**
   * Create a new conversation thread
   * @param {Object} metadata - Optional metadata
   * @returns {Promise<Object>} Created thread
   */
  async createThread(metadata = {}) {
    const thread = await this._request('/threads', 'POST', {
      metadata: {
        source: 'ultra-dex',
        ...metadata,
      },
    });

    this.threadId = thread.id;
    return thread;
  }

  /**
   * Get thread by ID
   */
  async getThread(threadId) {
    return await this._request(`/threads/${threadId}`);
  }

  /**
   * Delete a thread
   */
  async deleteThread(threadId) {
    return await this._request(`/threads/${threadId}`, 'DELETE');
  }

  // ============================================
  // MESSAGE MANAGEMENT
  // ============================================

  /**
   * Add a message to a thread
   * @param {string} threadId - Thread ID
   * @param {string} content - Message content
   * @param {string} role - 'user' or 'assistant'
   */
  async addMessage(threadId, content, role = 'user') {
    return await this._request(`/threads/${threadId}/messages`, 'POST', {
      role,
      content,
    });
  }

  /**
   * List messages in a thread
   */
  async listMessages(threadId, limit = 20) {
    return await this._request(`/threads/${threadId}/messages?limit=${limit}`);
  }

  // ============================================
  // RUN MANAGEMENT
  // ============================================

  /**
   * Run the assistant on a thread
   * @param {string} threadId - Thread ID
   * @param {string} assistantId - Assistant ID
   * @param {Object} options - Run options
   */
  async runAssistant(threadId, assistantId, options = {}) {
    return await this._request(`/threads/${threadId}/runs`, 'POST', {
      assistant_id: assistantId,
      instructions: options.instructions,
      additional_instructions: options.additionalInstructions,
      tools: options.tools,
    });
  }

  /**
   * Get run status
   */
  async getRunStatus(threadId, runId) {
    return await this._request(`/threads/${threadId}/runs/${runId}`);
  }

  /**
   * Wait for run to complete
   * @param {string} threadId - Thread ID
   * @param {string} runId - Run ID
   * @param {number} maxWait - Max wait time in ms
   */
  async waitForRun(threadId, runId, maxWait = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const run = await this.getRunStatus(threadId, runId);

      if (run.status === 'completed') {
        return run;
      }

      if (['failed', 'cancelled', 'expired'].includes(run.status)) {
        throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
      }

      // Wait 1 second before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('Run timed out');
  }

  /**
   * Run assistant and get response (convenience method)
   */
  async chat(message, options = {}) {
    const threadId = options.threadId || this.threadId;
    const assistantId = options.assistantId || this.assistantId;

    if (!threadId) {
      throw new Error('No thread ID. Call createThread() first.');
    }

    if (!assistantId) {
      throw new Error('No assistant ID. Call createAssistant() or set assistantId.');
    }

    // Add user message
    await this.addMessage(threadId, message);

    // Run assistant
    const run = await this.runAssistant(threadId, assistantId, options);

    // Wait for completion
    await this.waitForRun(threadId, run.id);

    // Get the response
    const messages = await this.listMessages(threadId, 1);
    const lastMessage = messages.data?.[0];

    return {
      content: lastMessage?.content?.[0]?.text?.value || '',
      threadId,
      runId: run.id,
      model: this.model,
    };
  }

  // ============================================
  // ULTRA-DEX SYNC
  // ============================================

  /**
   * Sync Ultra-Dex state to OpenAI Assistant thread
   * @param {Object} state - State from .ultra/state.json
   */
  async syncFromUltraDex(state) {
    if (!this.threadId) {
      await this.createThread({ project: state.project?.name });
    }

    const context = `
# Ultra-Dex Project Context

## Project
- Name: ${state.project?.name || 'Unknown'}
- Version: ${state.project?.version || '0.0.0'}
- Mode: ${state.project?.mode || 'Standard'}

## Current Phase
${state.phases?.find((p) => p.status === 'in_progress')?.name || 'None'}

## Active Agents
${state.agents?.active?.join(', ') || 'None'}

## Pending Tasks
${state.phases?.flatMap((p) => p.steps?.filter((s) => s.status === 'pending')?.map((s) => `- ${s.task}`)).join('\n') || 'None'}
    `.trim();

    await this.addMessage(this.threadId, `[System Context Update]\n\n${context}`);

    return { threadId: this.threadId };
  }

  /**
   * Export thread history to Ultra-Dex format
   */
  async exportToUltraDex() {
    if (!this.threadId) return [];

    const messages = await this.listMessages(this.threadId, 100);

    return (
      messages.data?.reverse().map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content?.[0]?.text?.value || '',
        timestamp: new Date(msg.created_at * 1000).toISOString(),
        provider: 'openai-assistants',
      })) || []
    );
  }

  /**
   * Create Ultra-Dex agent as OpenAI Assistant
   * @param {string} agentType - Ultra-Dex agent type (planner, cto, backend, etc.)
   */
  async createUltraDexAgent(agentType) {
    const agentConfigs = {
      planner: {
        name: 'Ultra-Dex Planner (@Planner)',
        instructions: `You are @Planner, the Task Breakdown Specialist for Ultra-Dex.
Your role is to break down features into atomic, actionable tasks.
Always structure output with clear task assignments to other agents.
Output format:
## Task Breakdown
### Task 1: [Name]
- Agent: @Backend | @Frontend | @Database | @Testing
- Description: ...
- Acceptance Criteria: ...`,
      },
      cto: {
        name: 'Ultra-Dex CTO (@CTO)',
        instructions: `You are @CTO, the Technical Architecture Lead for Ultra-Dex.
Your role is to make technology decisions, design system architecture, and set coding standards.
Consider scalability, security, and maintainability in all decisions.`,
      },
      backend: {
        name: 'Ultra-Dex Backend (@Backend)',
        instructions: `You are @Backend, the API & Business Logic Developer for Ultra-Dex.
Your role is to write server-side code, design APIs, and implement business logic.
Use modern patterns and best practices.`,
      },
      frontend: {
        name: 'Ultra-Dex Frontend (@Frontend)',
        instructions: `You are @Frontend, the UI/UX Developer for Ultra-Dex.
Your role is to build React/Next.js components with great UX.
Focus on accessibility, responsiveness, and performance.`,
      },
      testing: {
        name: 'Ultra-Dex Testing (@Testing)',
        instructions: `You are @Testing, the QA Engineer for Ultra-Dex.
Your role is to write comprehensive tests and ensure code quality.
Cover unit tests, integration tests, and edge cases.`,
      },
    };

    const config = agentConfigs[agentType];
    if (!config) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    return await this.createAssistant({
      ...config,
      tools: ['code_interpreter'],
      metadata: { agentType, source: 'ultra-dex' },
    });
  }

  // ============================================
  // BASE PROVIDER INTERFACE
  // ============================================

  async generate(systemPrompt, userPrompt, _options = {}) {
    // For simple generation, use the chat completions API
    const response = await this._request('/chat/completions', 'POST', {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    });

    return {
      content: response.choices?.[0]?.message?.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
      model: response.model,
    };
  }

  async generateStream(systemPrompt, userPrompt, onChunk, _options = {}) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content || '';
          fullContent += text;
          if (onChunk) onChunk(text);
        } catch {
          // Ignore parse errors for incomplete chunks
        }
      }
    }

    return {
      content: fullContent,
      usage: { inputTokens: 0, outputTokens: 0 },
      model: this.model,
    };
  }

  async validateApiKey() {
    try {
      await this._request('/models');
      return true;
    } catch {
      return false;
    }
  }
}

export default OpenAIAssistantsProvider;
