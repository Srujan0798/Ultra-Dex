# NVIDIA Models for Ultra-Dex - Complete Guide

## 📊 Model Priority & Categories

### **High Priority (Start with these)**

#### 1. Primary Models - Main AI Brain
```javascript
// Complex reasoning, agentic workflows, planning
nvidia/nemotron-3-super-120b-a12b  // 120B params, 1M context

// Fast responses, simple tasks
nvidia/nemotron-3-nano-30b-a3b     // 30B params, 1M context
```

#### 2. Coding Models - Specialized for Development
```javascript
// Code generation, review, debugging
qwen/qwen-2.5-coder-32b-instruct   // 32B params

// Code completion, multi-file editing
deepseek-ai/deepseek-coder         // Specialized coder

// Long code context (128K)
microsoft/phi-3-mini-128k-instruct // 128K context
```

---

### **Medium Priority (Add as needed)**

#### 3. Vision Models - Image Understanding
```javascript
// Image + text understanding
nvidia/llama-3.1-nemotron-nano-vl-8b-v1  // 8B params

// Advanced vision + RAG
qwen/qwen3.5-397b-a17b                   // 400B MoE
```

#### 4. Embedding Models - Search & RAG
```javascript
// Semantic search, similarity
nvidia/nv-embedqa-e5-v5  // Question-answering retrieval
```

---

### **Low Priority (Backup/Fallback)**

#### 5. Alternative High-Performance Models
```javascript
// General purpose backup
meta/llama-3.1-70b-instruct        // 70B params

// Complex reasoning backup
deepseek-ai/deepseek-v3.2          // 685B params

// Multilingual backup
mistralai/mistral-large-3-675b-instruct-2512  // 675B MoE
```

---

## 🔧 Usage Examples

### **Basic Usage - Single Model**

```javascript
import { createNemotronClient } from './src/services/ai-providers/nemotron.js';

const client = createNemotronClient(process.env.NVIDIA_API_KEY);

// Use Nemotron-3-Super (primary)
const response = await client.chat.completions.create({
  model: 'nvidia/nemotron-3-super-120b-a12b',
  messages: [{ role: 'user', content: 'Build a REST API' }],
  max_tokens: 16000,
  temperature: 1.0,
  top_p: 0.95,
  extra_body: {
    chat_template_kwargs: { enable_thinking: true }
  }
});
```

---

### **Smart Model Selection**

```javascript
import { smartSelect, selectModel } from './src/services/ai-providers/model-selector.js';
import { createNemotronClient } from './src/services/ai-providers/nemotron.js';

const client = createNemotronClient(process.env.NVIDIA_API_KEY);

// Auto-select model based on prompt
const model = smartSelect('Write a Python function to sort an array');

const response = await client.chat.completions.create({
  model: model.id,  // Auto-selected: 'qwen/qwen-2.5-coder-32b-instruct'
  messages: [{ role: 'user', content: 'Write a Python function to sort an array' }],
  max_tokens: 4096,
  temperature: model.temperature,
  top_p: model.topP,
});
```

---

### **Task-Based Model Selection**

```javascript
import { selectModel } from './src/services/ai-providers/model-selector.js';

// Complex reasoning
const reasoningModel = selectModel('reasoning');
// → Nemotron-3-Super 120B

// Code review
const codeModel = selectModel('code-review');
// → Qwen Coder 32B

// Quick chat
const chatModel = selectModel('chat');
// → Nemotron-3-Nano 30B

// Image analysis
const visionModel = selectModel('image');
// → Nemotron Nano VL 8B
```

---

### **Multi-Model Strategy for Ultra-Dex**

```javascript
import { NEMOTRON_MODELS } from './src/services/ai-providers/nemotron.js';

// Configure different models for different tasks
const config = {
  // Main orchestration
  orchestrator: NEMOTRON_MODELS.primary,
  
  // Code generation
  coder: NEMOTRON_MODELS.code,
  
  // Quick responses
  fast: NEMOTRON_MODELS.fast,
  
  // Fallback
  backup: NEMOTRON_MODELS.backup,
};

// Use in your agents
async function runAgent(task) {
  const model = task.type === 'code' ? config.coder : config.orchestrator;
  
  const response = await client.chat.completions.create({
    model: model.id,
    messages: task.messages,
    temperature: model.temperature,
    top_p: model.topP,
  });
  
  return response;
}
```

---

## 📋 Complete Model List

| Category | Model | Context | Best For |
|----------|-------|---------|----------|
| **Primary** | `nvidia/nemotron-3-super-120b-a12b` | 1M | Agentic, reasoning, tool calling |
| **Primary** | `nvidia/nemotron-3-nano-30b-a3b` | 1M | Fast responses, simple tasks |
| **Code** | `qwen/qwen-2.5-coder-32b-instruct` | 128K | Code generation, review |
| **Code** | `deepseek-ai/deepseek-coder` | 128K | Code completion |
| **Code** | `microsoft/phi-3-mini-128k-instruct` | 128K | Large codebase analysis |
| **Vision** | `nvidia/llama-3.1-nemotron-nano-vl-8b-v1` | 32K | Image understanding |
| **Vision** | `qwen/qwen3.5-397b-a17b` | 256K | Advanced vision + RAG |
| **Embedding** | `nvidia/nv-embedqa-e5-v5` | 512 | Semantic search |
| **Backup** | `meta/llama-3.1-70b-instruct` | 128K | General chat, backup |
| **Backup** | `deepseek-ai/deepseek-v3.2` | 128K | Complex reasoning backup |
| **Backup** | `mistralai/mistral-large-3-675b-instruct` | 256K | Multilingual backup |

---

## 🎯 Recommended Setup for Ultra-Dex

### **Phase 1: Start (Free Tier)**
```javascript
const STARTER_MODELS = {
  primary: 'nvidia/nemotron-3-super-120b-a12b',
  fast: 'nvidia/nemotron-3-nano-30b-a3b',
  code: 'qwen/qwen-2.5-coder-32b-instruct',
};
```

### **Phase 2: Expand (As Needed)**
```javascript
const EXPANDED_MODELS = {
  ...STARTER_MODELS,
  vision: 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1',
  embedding: 'nvidia/nv-embedqa-e5-v5',
  backup: 'meta/llama-3.1-70b-instruct',
};
```

### **Phase 3: Full Production**
```javascript
const PRODUCTION_MODELS = {
  ...EXPANDED_MODELS,
  codeDeepSeek: 'deepseek-ai/deepseek-coder',
  codePhi: 'microsoft/phi-3-mini-128k-instruct',
  backupDeepSeek: 'deepseek-ai/deepseek-v3.2',
};
```

---

## 💡 Best Practices

### **1. Cost Optimization**
- Use `nemotron-3-nano-30b` for simple queries (cheaper)
- Use `nemotron-3-super-120b` for complex reasoning only
- Cache responses for repeated queries

### **2. Performance**
- Enable `enable_thinking: true` for complex tasks
- Use `enable_thinking: false` for simple Q&A
- Set `low_effort: true` for quick drafts

### **3. Fallback Strategy**
```javascript
async function robustChat(messages) {
  try {
    // Try primary model first
    return await client.chat.completions.create({
      model: NEMOTRON_MODELS.primary.id,
      messages,
    });
  } catch (error) {
    // Fallback to backup
    return await client.chat.completions.create({
      model: NEMOTRON_MODELS.backup.id,
      messages,
    });
  }
}
```

### **4. Rate Limit Handling**
```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        await sleep(1000 * Math.pow(2, i)); // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}
```

---

## 🔗 Resources

- **Get API Key**: https://build.nvidia.com/
- **Full Model Catalog**: https://build.nvidia.com/explore/discover
- **Pricing**: Check individual model pages
- **Documentation**: https://docs.nvidia.com/nim/

---

## ✅ Quick Start Checklist

- [ ] Get NVIDIA API key (free)
- [ ] Install: `npm install openai`
- [ ] Create `.env.local` with `NVIDIA_API_KEY`
- [ ] Test primary model: `npm run nemotron:example`
- [ ] Test multi-model: `npm run nemotron:models`
- [ ] Integrate model selector into your workflow
- [ ] Configure fallback strategies
- [ ] Monitor usage and optimize costs

---

**One API Key = Access to ALL 220+ Models! 🚀**
