/**
 * Smart Model Selector for Ultra-Dex
 * Automatically chooses the best model based on task type
 * 
 * Usage:
 *   import { selectModel } from './src/services/ai-providers/model-selector.js';
 *   const model = selectModel('code-review');
 */

import { NEMOTRON_MODELS } from './nemotron.js';

/**
 * Task type to model mapping (40+ models available)
 */
const TASK_MODEL_MAP = {
  // Complex reasoning tasks - Primary
  'reasoning': 'primary',
  'planning': 'primary',
  'agentic': 'primary',
  'tool-calling': 'primary',
  'complex': 'primary',
  'orchestration': 'primary',
  
  // Quick/simple tasks - Fast
  'chat': 'nemotronNano',
  'simple': 'nemotronNano',
  'quick': 'nemotronNano',
  'conversation': 'nemotronNano',
  'fast': 'nemotronNano',
  
  // Meta Llama models
  'llama': 'llama3_1_70b',
  'llama-70b': 'llama3_1_70b',
  'llama-8b': 'llama3_1_8b',
  'llama-405b': 'llama3_1_405b',
  'general': 'llama3_1_70b',
  'multilingual': 'llama3_1_70b',
  
  // Mistral models
  'mistral': 'mistralLarge',
  'mistral-large': 'mistralLarge',
  'mistral-nemo': 'mistralNemo',
  'mistral-small': 'mistralSmall',
  
  // Microsoft Phi models
  'phi': 'phi3_mini',
  'phi-3': 'phi3_mini',
  'phi-mini': 'phi3_mini',
  'phi-medium': 'phi3_medium',
  'phi-small': 'phi3_small',
  
  // Google Gemma models
  'gemma': 'gemma2_9b',
  'gemma-9b': 'gemma2_9b',
  'gemma-27b': 'gemma2_27b',
  'efficient': 'gemma2_9b',
  
  // Qwen models - Coding
  'code': 'qwen2_5_coder_32b',
  'coding': 'qwen2_5_coder_32b',
  'code-generation': 'qwen2_5_coder_32b',
  'code-review': 'qwen2_5_coder_32b',
  'debugging': 'qwen2_5_coder_32b',
  'refactor': 'qwen2_5_coder_32b',
  'qwen': 'qwen2_5_coder_32b',
  'qwen-coder': 'qwen2_5_coder_32b',
  'qwen-80b': 'qwen3_next_80b',
  'qwen-397b': 'qwen3_5_397b',
  
  // DeepSeek models
  'deepseek': 'deepseek_coder',
  'deepseek-coder': 'deepseek_coder',
  'deepseek-v3': 'deepseek_v3_2',
  'deepseek-v3.2': 'deepseek_v3_2',
  'deepseek-terminus': 'deepseek_v3_1_terminus',
  'code-completion': 'deepseek_coder',
  'completion': 'deepseek_coder',
  
  // Moonshot (Kimi) models
  'kimi': 'kimi_k2',
  'kimi-k2': 'kimi_k2',
  'kimi-k2-0905': 'kimi_k2_0905',
  'kimi-k2.5': 'kimi_k2_5',
  'multimodal': 'kimi_k2_5',
  'video': 'kimi_k2_5',
  
  // Z.ai (GLM) models
  'glm': 'glm_5',
  'glm-5': 'glm_5',
  'glm-4.7': 'glm_4_7',
  'long-horizon': 'glm_5',
  
  // StepFun models
  'stepfun': 'step3_5_flash',
  'step-3.5': 'step3_5_flash',
  'flash': 'step3_5_flash',
  
  // MiniMax models
  'minimax': 'minimax_m2_5',
  'minimax-m2.5': 'minimax_m2_5',
  'office': 'minimax_m2_5',
  
  // OpenAI OSS models
  'gpt-oss': 'gpt_oss_120b',
  'gpt-oss-120b': 'gpt_oss_120b',
  'gpt-oss-20b': 'gpt_oss_20b',
  'openai-oss': 'gpt_oss_120b',
  
  // Specialized tasks
  'large-codebase': 'phi3_mini',
  'codebase-analysis': 'phi3_mini',
  'math': 'llama3_3_70b',
  'science': 'phi3_medium',
  'enterprise': 'llama3_1_405b',
  'highest-quality': 'llama3_1_405b',
  
  // Vision tasks
  'image': 'nemotron_vl_8b',
  'vision': 'nemotron_vl_8b',
  'screenshot': 'nemotron_vl_8b',
  'ui-analysis': 'nemotron_vl_8b',
  'document': 'nemotron_vl_8b',
  'doc-intelligence': 'nemotron_vl_8b',
  
  // Search/embedding
  'search': 'nv_embedqa_e5_v5',
  'embedding': 'nv_embedqa_e5_v5',
  'similarity': 'nv_embedqa_e5_v5',
  'rag': 'nv_embedqa_e5_v5',
  'retrieval': 'nv_embedqa_e5_v5',
  'semantic': 'nv_embedqa_e5_v5',
  
  // Backup/fallback
  'backup': 'llama3_1_70b',
  'fallback': 'llama3_1_70b',
};

/**
 * Select the best model for a given task
 * @param {string} taskType - Type of task (e.g., 'code', 'chat', 'reasoning')
 * @returns {Object} Model configuration
 */
export function selectModel(taskType) {
  const modelKey = TASK_MODEL_MAP[taskType.toLowerCase()] || 'primary';
  return NEMOTRON_MODELS[modelKey];
}

/**
 * Get model by key directly
 * @param {string} key - Model key (e.g., 'primary', 'code', 'fast')
 * @returns {Object} Model configuration
 */
export function getModelByKey(key) {
  return NEMOTRON_MODELS[key] || NEMOTRON_MODELS.primary;
}

/**
 * Get all available models
 * @returns {Object} All model configurations
 */
export function getAllModels() {
  return NEMOTRON_MODELS;
}

/**
 * Get models by category
 * @param {string} category - Category name
 * @returns {Object} Filtered models
 */
export function getModelsByCategory(category) {
  const categories = {
    primary: ['primary', 'nemotronNano'],
    llama: ['llama3_1_70b', 'llama3_1_8b', 'llama3_3_70b', 'llama3_1_405b'],
    mistral: ['mistralLarge', 'mistralNemo', 'mistralSmall'],
    microsoft: ['phi3_mini', 'phi3_medium', 'phi3_small'],
    google: ['gemma2_9b', 'gemma2_27b'],
    qwen: ['qwen2_5_coder_32b', 'qwen3_next_80b', 'qwen3_5_397b', 'qwen2_72b'],
    deepseek: ['deepseek_coder', 'deepseek_v3_2', 'deepseek_v3_1', 'deepseek_v3_1_terminus'],
    moonshot: ['kimi_k2', 'kimi_k2_0905', 'kimi_k2_5'],
    glm: ['glm_5', 'glm_4_7'],
    stepfun: ['step3_5_flash'],
    minimax: ['minimax_m2_5'],
    openai: ['gpt_oss_120b', 'gpt_oss_20b'],
    vision: ['nemotron_vl_8b'],
    embedding: ['nv_embedqa_e5_v5', 'nv_embedqa_e5_v4'],
    specialized: ['nemotron_ultra_253b'],
  };
  
  const keys = categories[category] || ['primary'];
  const result = {};
  keys.forEach(key => {
    if (NEMOTRON_MODELS[key]) {
      result[key] = NEMOTRON_MODELS[key];
    }
  });
  return result;
}

/**
 * Get all models by publisher
 * @param {string} publisher - Publisher name
 * @returns {Object} Filtered models
 */
export function getModelsByPublisher(publisher) {
  const result = {};
  const lowerPublisher = publisher.toLowerCase();
  
  Object.entries(NEMOTRON_MODELS).forEach(([key, model]) => {
    if (model.publisher && model.publisher.toLowerCase().includes(lowerPublisher)) {
      result[key] = model;
    }
  });
  
  return result;
}

/**
 * Get models by context length requirement
 * @param {number} minContext - Minimum context length needed
 * @returns {Object} Models that meet requirement
 */
export function getModelsByContext(minContext) {
  const result = {};
  
  Object.entries(NEMOTRON_MODELS).forEach(([key, model]) => {
    if (model.contextLength && model.contextLength >= minContext) {
      result[key] = model;
    }
  });
  
  return result;
}

/**
 * Get models by capability
 * @param {string} capability - Capability name (e.g., 'coding', 'vision', 'math')
 * @returns {Object} Models with that capability
 */
export function getModelsByCapability(capability) {
  const result = {};
  const lowerCap = capability.toLowerCase();
  
  Object.entries(NEMOTRON_MODELS).forEach(([key, model]) => {
    if (model.bestFor && model.bestFor.some(bf => bf.toLowerCase().includes(lowerCap))) {
      result[key] = model;
    }
  });
  
  return result;
}

/**
 * Auto-detect task type from prompt
 * @param {string} prompt - User prompt
 * @returns {string} Detected task type
 */
export function detectTaskType(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Code detection
  if (lowerPrompt.includes('code') || 
      lowerPrompt.includes('function') || 
      lowerPrompt.includes('class') ||
      lowerPrompt.includes('api') ||
      lowerPrompt.includes('endpoint') ||
      lowerPrompt.includes('javascript') ||
      lowerPrompt.includes('python') ||
      lowerPrompt.includes('react') ||
      lowerPrompt.includes('node')) {
    return 'code';
  }
  
  // Image/vision detection
  if (lowerPrompt.includes('image') || 
      lowerPrompt.includes('screenshot') ||
      lowerPrompt.includes('picture') ||
      lowerPrompt.includes('visual') ||
      lowerPrompt.includes('diagram')) {
    return 'vision';
  }
  
  // Search/embedding detection
  if (lowerPrompt.includes('search') || 
      lowerPrompt.includes('similar') ||
      lowerPrompt.includes('find documents')) {
    return 'embedding';
  }
  
  // Quick/simple detection
  if (lowerPrompt.includes('quick') || 
      lowerPrompt.includes('simple') ||
      lowerPrompt.includes('brief') ||
      lowerPrompt.includes('short') ||
      lowerPrompt.includes('hello') ||
      lowerPrompt.includes('what is')) {
    return 'fast';
  }
  
  // Default to primary for complex tasks
  return 'primary';
}

/**
 * Smart model selection based on prompt
 * @param {string} prompt - User prompt
 * @returns {Object} Selected model configuration
 */
export function smartSelect(prompt) {
  const taskType = detectTaskType(prompt);
  return selectModel(taskType);
}

// Export all for convenience
export { NEMOTRON_MODELS };
