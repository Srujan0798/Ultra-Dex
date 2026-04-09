# NVIDIA Model Catalog - Complete Guide for Ultra-Dex

## 📊 Full Model Catalog (40+ Models)

**One API Key = Access to ALL Models!**  
Get your free key: https://build.nvidia.com/

---

## 🏆 Primary Models (Recommended Starting Point)

| Model                     | Context   | Best For                                           | Temperature |
| ------------------------- | --------- | -------------------------------------------------- | ----------- |
| **Nemotron-3-Super 120B** | 1M tokens | Agentic workflows, complex reasoning, tool calling | 1.0         |
| **Nemotron-3-Nano 30B**   | 1M tokens | Quick responses, simple tasks, fast inference      | 0.7         |

---

## 🦙 Meta Llama Models

| Model                       | Context | Best For                                      | Temperature |
| --------------------------- | ------- | --------------------------------------------- | ----------- |
| **Llama-3.1 8B Instruct**   | 128K    | Fast chat, lightweight tasks, edge deployment | 0.7         |
| **Llama-3.1 70B Instruct**  | 128K    | General chat, backup, multilingual            | 0.7         |
| **Llama-3.3 70B Instruct**  | 128K    | Advanced reasoning, math, general knowledge   | 0.7         |
| **Llama-3.1 405B Instruct** | 128K    | Complex tasks, highest quality, enterprise    | 0.7         |

---

## 🌪️ Mistral AI Models

| Model                     | Context | Best For                               | Temperature |
| ------------------------- | ------- | -------------------------------------- | ----------- |
| **Mistral Small 3.1 24B** | 32K     | Fast responses, simple tasks           | 0.7         |
| **Mistral Nemo**          | 128K    | Balanced performance, chat, coding     | 0.7         |
| **Mistral Large 3 675B**  | 256K    | General purpose, multilingual, agentic | 0.7         |

---

## 💚 Microsoft Phi Models

| Model                 | Context | Best For                             | Temperature |
| --------------------- | ------- | ------------------------------------ | ----------- |
| **Phi-3 Small 8K**    | 8K      | Fast chat, simple QA                 | 0.7         |
| **Phi-3 Mini 128K**   | 128K    | Long code context, codebase analysis | 0.7         |
| **Phi-3 Medium 128K** | 128K    | Reasoning, math, science             | 0.7         |

---

## 🔍 Google Gemma Models

| Model              | Context | Best For                            | Temperature |
| ------------------ | ------- | ----------------------------------- | ----------- |
| **Gemma-2 9B IT**  | 8K      | Fast inference, efficient chat      | 0.7         |
| **Gemma-2 27B IT** | 8K      | Balanced performance, general tasks | 0.7         |

---

## 🤖 Qwen (Alibaba) Models

| Model                   | Context | Best For                             | Temperature |
| ----------------------- | ------- | ------------------------------------ | ----------- |
| **Qwen-2 72B Instruct** | 128K    | Multilingual, general tasks          | 0.7         |
| **Qwen-2.5 Coder 32B**  | 128K    | Code generation, review, debugging   | 0.7         |
| **Qwen3-Next 80B**      | 256K    | Ultra-long context, hybrid attention | 0.7         |
| **Qwen-3.5 397B VLM**   | 256K    | Vision + language, RAG, agentic      | 0.7         |

---

## 🐋 DeepSeek AI Models

| Model                      | Context | Best For                            | Temperature |
| -------------------------- | ------- | ----------------------------------- | ----------- |
| **DeepSeek Coder**         | 128K    | Code completion, multi-file editing | 0.7         |
| **DeepSeek V3.1**          | 128K    | Hybrid inference, tool use          | 1.0         |
| **DeepSeek V3.1 Terminus** | 128K    | Agentic tools, function calling     | 1.0         |
| **DeepSeek V3.2**          | 128K    | Complex reasoning, math, science    | 1.0         |

---

## 🌙 Moonshot AI (Kimi) Models

| Model                | Context | Best For                         | Temperature |
| -------------------- | ------- | -------------------------------- | ----------- |
| **Kimi K2 Instruct** | 128K    | Coding, reasoning, agentic       | 0.7         |
| **Kimi K2 0905**     | 256K    | Long context, enhanced reasoning | 0.7         |
| **Kimi K2.5**        | 256K    | Multimodal, video understanding  | 0.7         |

---

## 🧠 Z.ai (GLM) Models

| Model       | Context | Best For                              | Temperature |
| ----------- | ------- | ------------------------------------- | ----------- |
| **GLM-4.7** | 128K    | Multilingual coding, tool use, UI     | 0.7         |
| **GLM-5**   | 256K    | Complex systems, long-horizon agentic | 1.0         |

---

## ⚡ StepFun Models

| Model              | Context | Best For                       | Temperature |
| ------------------ | ------- | ------------------------------ | ----------- |
| **Step-3.5 Flash** | 256K    | Agentic, 200B reasoning engine | 1.0         |

---

## 🎯 MiniMax Models

| Model            | Context | Best For                        | Temperature |
| ---------------- | ------- | ------------------------------- | ----------- |
| **MiniMax M2.5** | 256K    | Reasoning, coding, office tasks | 0.7         |

---

## 🤗 OpenAI OSS Models

| Model            | Context | Best For                   | Temperature |
| ---------------- | ------- | -------------------------- | ----------- |
| **GPT-OSS 20B**  | 128K    | Efficient reasoning, math  | 0.7         |
| **GPT-OSS 120B** | 128K    | Reasoning, math, text-only | 1.0         |

---

## 👁️ Vision Models

| Model                   | Context | Best For                              | Temperature |
| ----------------------- | ------- | ------------------------------------- | ----------- |
| **Nemotron Nano VL 8B** | 32K     | Image understanding, doc intelligence | 0.7         |

---

## 🔢 Embedding Models

| Model                 | Context | Best For                         | Type      |
| --------------------- | ------- | -------------------------------- | --------- |
| **NV Embed QA E5 V4** | 512     | Question-answering, retrieval    | Embedding |
| **NV Embed QA E5 V5** | 512     | Semantic search, RAG, similarity | Embedding |

---

## 🔬 Specialized Models

| Model                   | Context | Best For                           | Temperature |
| ----------------------- | ------- | ---------------------------------- | ----------- |
| **Nemotron Ultra 253B** | 128K    | Scientific reasoning, complex math | 1.0         |

---

## 📋 Usage Examples

### By Task Type

```javascript
import { selectModel } from './src/services/ai-providers/model-selector.js';

// Coding tasks
const codeModel = selectModel('code');
// → Qwen-2.5 Coder 32B

// Quick chat
const chatModel = selectModel('chat');
// → Nemotron-3-Nano 30B

// Complex reasoning
const reasoningModel = selectModel('reasoning');
// → Nemotron-3-Super 120B

// Math
const mathModel = selectModel('math');
// → Llama-3.3 70B

// Vision
const visionModel = selectModel('vision');
// → Nemotron Nano VL 8B
```

### By Category

```javascript
import { getModelsByCategory } from './src/services/ai-providers/model-selector.js';

// Get all Llama models
const llamaModels = getModelsByCategory('llama');
// Returns: 4 Llama models

// Get all coding models
const qwenModels = getModelsByCategory('qwen');
// Returns: 4 Qwen models
```

### By Publisher

```javascript
import { getModelsByPublisher } from './src/services/ai-providers/model-selector.js';

// Get all Microsoft models
const microsoftModels = getModelsByPublisher('microsoft');
// Returns: Phi-3 Mini, Medium, Small

// Get all DeepSeek models
const deepseekModels = getModelsByPublisher('deepseek');
// Returns: 4 DeepSeek models
```

### By Context Length

```javascript
import { getModelsByContext } from './src/services/ai-providers/model-selector.js';

// Get models with 256K+ context
const longContextModels = getModelsByContext(256000);
// Returns: 11 models with 256K+ context
```

### By Capability

```javascript
import { getModelsByCapability } from './src/services/ai-providers/model-selector.js';

// Get all coding-capable models
const codingModels = getModelsByCapability('coding');
// Returns: 10+ models

// Get all multilingual models
const multilingualModels = getModelsByCapability('multilingual');
// Returns: 8+ models
```

---

## 🎯 Recommended Configurations

### Starter (3 Models)

```javascript
const STARTER = {
  primary: 'nvidia/nemotron-3-super-120b-a12b',
  fast: 'nvidia/nemotron-3-nano-30b-a3b',
  code: 'qwen/qwen-2.5-coder-32b-instruct',
};
```

### Standard (10 Models)

```javascript
const STANDARD = {
  // Primary
  primary: 'nvidia/nemotron-3-super-120b-a12b',
  fast: 'nvidia/nemotron-3-nano-30b-a3b',

  // Llama
  llama70b: 'meta/llama-3.1-70b-instruct',
  llama405b: 'meta/llama-3.1-405b-instruct',

  // Coding
  qwenCoder: 'qwen/qwen-2.5-coder-32b-instruct',
  deepseek: 'deepseek-ai/deepseek-coder',

  // Microsoft
  phi3Mini: 'microsoft/phi-3-mini-128k-instruct',

  // Mistral
  mistralLarge: 'mistralai/mistral-large-3-675b-instruct-2512',

  // Backup
  backup: 'meta/llama-3.1-70b-instruct',
};
```

### Complete (All 40+ Models)

```javascript
import { NEMOTRON_MODELS } from './src/services/ai-providers/nemotron.js';
// All models available!
```

---

## 💡 Quick Reference

### Best for Coding

1. Qwen-2.5 Coder 32B
2. DeepSeek Coder
3. Phi-3 Mini 128K
4. Kimi K2 Instruct

### Best for Reasoning

1. Nemotron-3-Super 120B
2. Llama-3.1 405B
3. DeepSeek V3.2
4. GLM-5

### Best for Long Context

1. Nemotron-3-Super 120B (1M)
2. Nemotron-3-Nano 30B (1M)
3. Mistral Large 3 675B (256K)
4. Qwen-3.5 397B (256K)

### Best for Speed

1. Gemma-2 9B IT
2. Phi-3 Small 8K
3. Llama-3.1 8B
4. Nemotron-3-Nano 30B

### Best for Vision

1. Nemotron Nano VL 8B
2. Qwen-3.5 397B VLM
3. Kimi K2.5

---

## 🔗 Resources

- **Get API Key**: https://build.nvidia.com/
- **Full Catalog**: https://build.nvidia.com/explore/discover
- **Documentation**: https://docs.nvidia.com/nim/
- **Hugging Face**: https://huggingface.co/nvidia

---

**Total Models Available: 40+**  
**Publishers: 12+**  
**One API Key for All!** 🚀
