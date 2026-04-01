/**
 * NVIDIA Nemotron Provider
 * Free tier API integration for Ultra-Dex
 * 
 * Access 220+ models with ONE API key from NVIDIA
 * Get free key at: https://build.nvidia.com/
 */

import OpenAI from 'openai';

/**
 * Complete Model Catalog for Ultra-Dex
 * All models work with ONE NVIDIA API key
 * Source: https://build.nvidia.com/explore/discover
 */
export const NEMOTRON_MODELS = {
  // ============================================================================
  // PRIMARY MODELS (High Priority - Start with these)
  // ============================================================================
  primary: {
    id: 'meta/llama-3.1-8b-instruct',
    name: 'Llama-3.1 8B Instruct',
    publisher: 'Meta',
    contextLength: 131072,
    bestFor: ['fast responses', 'general chat', 'agentic workflows', 'planning'],
    temperature: 0.7,
    topP: 0.95,
    category: 'primary',
  },
  nemotronNano: {
    id: 'nvidia/nemotron-3-nano-30b-a3b',
    name: 'Nemotron-3-Nano 30B',
    publisher: 'NVIDIA',
    contextLength: 1000000,
    bestFor: ['quick responses', 'simple tasks', 'chat', 'fast inference'],
    temperature: 0.7,
    topP: 0.95,
    category: 'primary',
  },
  
  // ============================================================================
  // META LLAMA MODELS
  // ============================================================================
  llama3_1_70b: {
    id: 'meta/llama-3.1-70b-instruct',
    name: 'Llama-3.1 70B Instruct',
    publisher: 'Meta',
    contextLength: 131072,
    bestFor: ['general chat', 'backup', 'multilingual', 'instruction following'],
    temperature: 0.7,
    topP: 0.95,
    category: 'llama',
  },
  llama3_1_8b: {
    id: 'meta/llama-3.1-8b-instruct',
    name: 'Llama-3.1 8B Instruct',
    publisher: 'Meta',
    contextLength: 131072,
    bestFor: ['fast chat', 'lightweight tasks', 'edge deployment'],
    temperature: 0.7,
    topP: 0.95,
    category: 'llama',
  },
  llama3_3_70b: {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama-3.3 70B Instruct',
    publisher: 'Meta',
    contextLength: 131072,
    bestFor: ['advanced reasoning', 'math', 'general knowledge'],
    temperature: 0.7,
    topP: 0.95,
    category: 'llama',
  },
  llama3_1_405b: {
    id: 'meta/llama-3.1-405b-instruct',
    name: 'Llama-3.1 405B Instruct',
    publisher: 'Meta',
    contextLength: 131072,
    bestFor: ['complex tasks', 'highest quality', 'enterprise'],
    temperature: 0.7,
    topP: 0.95,
    category: 'llama',
  },
  
  // ============================================================================
  // MISTRAL AI MODELS
  // ============================================================================
  mistralLarge: {
    id: 'mistralai/mistral-large-3-675b-instruct-2512',
    name: 'Mistral Large 3 675B',
    publisher: 'Mistral AI',
    contextLength: 256000,
    bestFor: ['general purpose', 'multilingual', 'agentic tasks'],
    temperature: 0.7,
    topP: 0.95,
    category: 'mistral',
  },
  mistralNemo: {
    id: 'mistralai/mistral-nemo',
    name: 'Mistral Nemo',
    publisher: 'Mistral AI',
    contextLength: 128000,
    bestFor: ['balanced performance', 'chat', 'coding'],
    temperature: 0.7,
    topP: 0.95,
    category: 'mistral',
  },
  mistralSmall: {
    id: 'mistralai/mistral-small-3.1-24b-instruct-2503',
    name: 'Mistral Small 3.1 24B',
    publisher: 'Mistral AI',
    contextLength: 32000,
    bestFor: ['fast responses', 'simple tasks'],
    temperature: 0.7,
    topP: 0.95,
    category: 'mistral',
  },
  
  // ============================================================================
  // MICROSOFT MODELS
  // ============================================================================
  phi3_mini: {
    id: 'microsoft/phi-3-mini-128k-instruct',
    name: 'Phi-3 Mini 128K',
    publisher: 'Microsoft',
    contextLength: 128000,
    bestFor: ['long code context', 'codebase analysis', 'lightweight'],
    temperature: 0.7,
    topP: 0.95,
    category: 'microsoft',
  },
  phi3_medium: {
    id: 'microsoft/phi-3-medium-128k-instruct',
    name: 'Phi-3 Medium 128K',
    publisher: 'Microsoft',
    contextLength: 128000,
    bestFor: ['reasoning', 'math', 'science'],
    temperature: 0.7,
    topP: 0.95,
    category: 'microsoft',
  },
  phi3_small: {
    id: 'microsoft/phi-3-small-8k-instruct',
    name: 'Phi-3 Small 8K',
    publisher: 'Microsoft',
    contextLength: 8192,
    bestFor: ['fast chat', 'simple QA'],
    temperature: 0.7,
    topP: 0.95,
    category: 'microsoft',
  },
  
  // ============================================================================
  // GOOGLE MODELS
  // ============================================================================
  gemma2_9b: {
    id: 'google/gemma-2-9b-it',
    name: 'Gemma-2 9B IT',
    publisher: 'Google',
    contextLength: 8192,
    bestFor: ['fast inference', 'efficient chat'],
    temperature: 0.7,
    topP: 0.95,
    category: 'google',
  },
  gemma2_27b: {
    id: 'google/gemma-2-27b-it',
    name: 'Gemma-2 27B IT',
    publisher: 'Google',
    contextLength: 8192,
    bestFor: ['balanced performance', 'general tasks'],
    temperature: 0.7,
    topP: 0.95,
    category: 'google',
  },
  
  // ============================================================================
  // QWEN (ALIBABA) MODELS
  // ============================================================================
  qwen2_5_coder_32b: {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Qwen-2.5 Coder 32B',
    publisher: 'Qwen',
    contextLength: 131072,
    bestFor: ['code generation', 'code review', 'debugging'],
    temperature: 0.7,
    topP: 0.95,
    category: 'qwen',
  },
  qwen3_next_80b: {
    id: 'qwen/qwen3-next-80b-a3b-instruct',
    name: 'Qwen3-Next 80B',
    publisher: 'Qwen',
    contextLength: 256000,
    bestFor: ['ultra-long context', 'hybrid attention'],
    temperature: 0.7,
    topP: 0.95,
    category: 'qwen',
  },
  qwen3_5_397b: {
    id: 'qwen/qwen3.5-397b-a17b',
    name: 'Qwen-3.5 397B VLM',
    publisher: 'Qwen',
    contextLength: 256000,
    bestFor: ['vision + language', 'RAG', 'agentic'],
    temperature: 0.7,
    topP: 0.95,
    category: 'qwen',
  },
  qwen2_72b: {
    id: 'qwen/qwen-2-72b-instruct',
    name: 'Qwen-2 72B Instruct',
    publisher: 'Qwen',
    contextLength: 131072,
    bestFor: ['multilingual', 'general tasks'],
    temperature: 0.7,
    topP: 0.95,
    category: 'qwen',
  },
  
  // ============================================================================
  // DEEPSEEK MODELS
  // ============================================================================
  deepseek_coder: {
    id: 'deepseek-ai/deepseek-coder',
    name: 'DeepSeek Coder',
    publisher: 'DeepSeek AI',
    contextLength: 128000,
    bestFor: ['code completion', 'multi-file editing'],
    temperature: 0.7,
    topP: 0.95,
    category: 'deepseek',
  },
  deepseek_v3_2: {
    id: 'deepseek-ai/deepseek-v3.2',
    name: 'DeepSeek V3.2',
    publisher: 'DeepSeek AI',
    contextLength: 128000,
    bestFor: ['complex reasoning', 'math', 'science'],
    temperature: 1.0,
    topP: 0.95,
    category: 'deepseek',
  },
  deepseek_v3_1: {
    id: 'deepseek-ai/deepseek-v3.1',
    name: 'DeepSeek V3.1',
    publisher: 'DeepSeek AI',
    contextLength: 128000,
    bestFor: ['hybrid inference', 'tool use'],
    temperature: 1.0,
    topP: 0.95,
    category: 'deepseek',
  },
  deepseek_v3_1_terminus: {
    id: 'deepseek-ai/deepseek-v3.1-terminus',
    name: 'DeepSeek V3.1 Terminus',
    publisher: 'DeepSeek AI',
    contextLength: 128000,
    bestFor: ['agentic tools', 'function calling'],
    temperature: 1.0,
    topP: 0.95,
    category: 'deepseek',
  },
  
  // ============================================================================
  // MOONSHOT AI (KIMI) MODELS
  // ============================================================================
  kimi_k2: {
    id: 'moonshotai/kimi-k2-instruct',
    name: 'Kimi K2 Instruct',
    publisher: 'Moonshot AI',
    contextLength: 128000,
    bestFor: ['coding', 'reasoning', 'agentic'],
    temperature: 0.7,
    topP: 0.95,
    category: 'moonshot',
  },
  kimi_k2_0905: {
    id: 'moonshotai/kimi-k2-instruct-0905',
    name: 'Kimi K2 0905',
    publisher: 'Moonshot AI',
    contextLength: 256000,
    bestFor: ['long context', 'enhanced reasoning'],
    temperature: 0.7,
    topP: 0.95,
    category: 'moonshot',
  },
  kimi_k2_5: {
    id: 'moonshotai/kimi-k2.5',
    name: 'Kimi K2.5',
    publisher: 'Moonshot AI',
    contextLength: 256000,
    bestFor: ['multimodal', 'video understanding', 'image understanding'],
    temperature: 0.7,
    topP: 0.95,
    category: 'moonshot',
  },
  
  // ============================================================================
  // Z.AI (GLM) MODELS
  // ============================================================================
  glm_5: {
    id: 'z-ai/glm-5',
    name: 'GLM-5',
    publisher: 'Z.ai',
    contextLength: 256000,
    bestFor: ['complex systems', 'long-horizon agentic'],
    temperature: 1.0,
    topP: 0.95,
    category: 'glm',
  },
  glm_4_7: {
    id: 'z-ai/glm-4.7',
    name: 'GLM-4.7',
    publisher: 'Z.ai',
    contextLength: 128000,
    bestFor: ['multilingual coding', 'tool use', 'UI tasks'],
    temperature: 0.7,
    topP: 0.95,
    category: 'glm',
  },
  
  // ============================================================================
  // STEPFUN MODELS
  // ============================================================================
  step3_5_flash: {
    id: 'stepfun-ai/step-3.5-flash',
    name: 'Step-3.5 Flash',
    publisher: 'Stepfun AI',
    contextLength: 256000,
    bestFor: ['agentic', '200B reasoning engine'],
    temperature: 1.0,
    topP: 0.95,
    category: 'stepfun',
  },
  
  // ============================================================================
  // MINIMAX MODELS
  // ============================================================================
  minimax_m2_5: {
    id: 'minimaxai/minimax-m2.5',
    name: 'MiniMax M2.5',
    publisher: 'Minimax AI',
    contextLength: 256000,
    bestFor: ['reasoning', 'coding', 'office tasks'],
    temperature: 0.7,
    topP: 0.95,
    category: 'minimax',
  },
  
  // ============================================================================
  // OPENAI MODELS
  // ============================================================================
  gpt_oss_120b: {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    publisher: 'OpenAI',
    contextLength: 128000,
    bestFor: ['reasoning', 'math', 'text-only'],
    temperature: 1.0,
    topP: 0.95,
    category: 'openai',
  },
  gpt_oss_20b: {
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    publisher: 'OpenAI',
    contextLength: 128000,
    bestFor: ['efficient reasoning', 'math'],
    temperature: 0.7,
    topP: 0.95,
    category: 'openai',
  },
  
  // ============================================================================
  // VISION MODELS (Medium Priority)
  // ============================================================================
  nemotron_vl_8b: {
    id: 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1',
    name: 'Nemotron Nano VL 8B',
    publisher: 'NVIDIA',
    contextLength: 32000,
    bestFor: ['image understanding', 'doc intelligence', 'UI analysis'],
    temperature: 0.7,
    topP: 0.95,
    category: 'vision',
  },
  
  // ============================================================================
  // EMBEDDING MODELS (Medium Priority)
  // ============================================================================
  nv_embedqa_e5_v5: {
    id: 'nvidia/nv-embedqa-e5-v5',
    name: 'NV Embed QA E5 V5',
    publisher: 'NVIDIA',
    contextLength: 512,
    bestFor: ['semantic search', 'RAG', 'similarity'],
    type: 'embedding',
    category: 'embedding',
  },
  nv_embedqa_e5_v4: {
    id: 'nvidia/nv-embedqa-e5-v4',
    name: 'NV Embed QA E5 V4',
    publisher: 'NVIDIA',
    contextLength: 512,
    bestFor: ['question-answering', 'retrieval'],
    type: 'embedding',
    category: 'embedding',
  },
  
  // ============================================================================
  // SPECIALIZED MODELS
  // ============================================================================
  nemotron_ultra_253b: {
    id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
    name: 'Nemotron Ultra 253B',
    publisher: 'NVIDIA',
    contextLength: 131072,
    bestFor: ['scientific reasoning', 'complex math', 'tool calling'],
    temperature: 1.0,
    topP: 0.95,
    category: 'specialized',
  },
};

// Default config for backward compatibility
const NEMOTRON_CONFIG = {
  modelId: NEMOTRON_MODELS.primary.id,
  displayName: NEMOTRON_MODELS.primary.name,
  maxContextLength: NEMOTRON_MODELS.primary.contextLength,
  maxOutputTokens: 32768,
  defaultTemperature: NEMOTRON_MODELS.primary.temperature,
  defaultTopP: NEMOTRON_MODELS.primary.topP,
  capabilities: {
    reasoning: true,
    toolCalling: true,
    longContext: true,
    codeGeneration: true,
    agenticWorkflows: true,
  },
};

// Import key manager for multi-key support
import { keyManager, initializeKeyManager } from './nvidia-key-manager.js';

/**
 * Initialize NVIDIA key manager (supports multiple keys)
 * Call this once at app startup
 * Automatically loads from env: NVIDIA_API_KEY, NVIDIA_API_KEY_1, etc.
 */
export function initNVIDIAKeys() {
  return initializeKeyManager();
}

/**
 * Creates a Nemotron client using NVIDIA's free API
 * @param {string} apiKey - NVIDIA API key (get free at https://build.nvidia.com/)
 * @param {string} modelId - Optional model ID for key selection
 * @returns {OpenAI} Configured OpenAI-compatible client
 */
export function createNemotronClient(apiKey, modelId = null) {
  if (!apiKey) {
    // Use key manager if no key provided
    const km = keyManager();
    if (km.getKeyCount() > 0) {
      return km.createClient(modelId);
    }
    throw new Error(
      'NVIDIA API key required. Get one free at https://build.nvidia.com/'
    );
  }

  return new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: apiKey,
  });
}

/**
 * Creates a client with automatic key rotation
 * @param {string} modelId - Model ID to use
 * @returns {Object} Client and key info
 */
export function createRotatingClient(modelId) {
  const km = keyManager();
  const client = km.createClient(modelId);
  const keyInfo = km.getCurrentKey(modelId);

  return {
    client,
    keyName: keyInfo.name,
    keyIndex: km.keys.indexOf(keyInfo),
  };
}

/**
 * Creates a chat completion using Nemotron
 * @param {Object} options
 * @param {OpenAI} options.client - Nemotron client
 * @param {Array} options.messages - Chat messages array
 * @param {boolean} [options.enableThinking=true] - Enable reasoning traces
 * @param {boolean} [options.lowEffort=false] - Use low-effort reasoning mode
 * @param {number} [options.maxTokens=4096] - Max output tokens
 * @param {number} [options.temperature=1.0] - Temperature
 * @param {number} [options.topP=0.95] - Top P
 * @returns {Promise<string>} Model response
 */
export async function chatWithNemotron({
  client,
  messages,
  enableThinking = true,
  lowEffort = false,
  maxTokens = 4096,
  temperature = 1.0,
  topP = 0.95,
}) {
  const extraBody = {
    chat_template_kwargs: {
      enable_thinking: enableThinking,
      ...(lowEffort && { low_effort: true }),
    },
  };

  const response = await client.chat.completions.create({
    model: NEMOTRON_CONFIG.modelId,
    messages,
    max_tokens: maxTokens,
    temperature,
    top_p: topP,
    extra_body: extraBody,
  });

  return response.choices[0].message.content;
}

/**
 * Direct API call matching NVIDIA's Python example
 * @param {Object} client - OpenAI client
 * @param {string} model - Model ID
 * @param {Array} messages - Chat messages
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Response content
 */
export async function createChatCompletion(client, model, messages, options = {}) {
  const response = await client.chat.completions.create({
    model,
    messages,
    max_tokens: options.maxTokens || 16000,
    temperature: options.temperature || 1.0,
    top_p: options.topP || 0.95,
    extra_body: {
      chat_template_kwargs: {
        enable_thinking: options.enableThinking ?? true,
        ...(options.lowEffort && { low_effort: true }),
      },
    },
  });

  return response.choices[0].message.content;
}

/**
 * Creates a streaming chat completion using Nemotron
 * @param {Object} options
 * @param {OpenAI} options.client - Nemotron client
 * @param {Array} options.messages - Chat messages array
 * @param {boolean} [options.enableThinking=true] - Enable reasoning traces
 * @param {Function} options.onChunk - Callback for each stream chunk
 * @returns {Promise<string>} Full accumulated response
 */
export async function streamWithNemotron({
  client,
  messages,
  enableThinking = true,
  onChunk,
}) {
  const extraBody = {
    chat_template_kwargs: {
      enable_thinking: enableThinking,
    },
  };

  const stream = await client.chat.completions.create({
    model: NEMOTRON_CONFIG.modelId,
    messages,
    max_tokens: NEMOTRON_CONFIG.maxOutputTokens,
    temperature: NEMOTRON_CONFIG.defaultTemperature,
    top_p: NEMOTRON_CONFIG.defaultTopP,
    extra_body: extraBody,
    stream: true,
  });

  let fullResponse = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullResponse += delta;
      onChunk?.(delta);
    }
  }

  return fullResponse;
}

/**
 * Nemotron provider configuration for Ultra-Dex registry
 */
export const nemotronProvider = {
  id: 'nemotron',
  name: NEMOTRON_CONFIG.displayName,
  modelId: NEMOTRON_CONFIG.modelId,
  createClient: createNemotronClient,
  chat: chatWithNemotron,
  stream: streamWithNemotron,
  config: NEMOTRON_CONFIG,
  getEnvKey: () => 'NVIDIA_API_KEY',
};

export default nemotronProvider;

