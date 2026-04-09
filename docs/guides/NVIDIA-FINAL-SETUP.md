# 🚀 Ultra-Dex NVIDIA Integration - Complete Setup

## ✅ What You Have Now

### **40+ AI Models** from 12+ Publishers

- All accessible with **ONE API KEY** (or multiple keys!)
- Automatic model selection
- Smart rotation and load balancing

---

## 📁 Complete File List

### Core Integration

| File                                              | Purpose                    |
| ------------------------------------------------- | -------------------------- |
| `src/services/ai-providers/nemotron.js`           | Main provider (40+ models) |
| `src/services/ai-providers/model-selector.js`     | Smart model selection      |
| `src/services/ai-providers/nvidia-key-manager.js` | Multi-key rotation         |

### Configuration

| File           | Purpose                            |
| -------------- | ---------------------------------- |
| `.env.local`   | Your API keys (already configured) |
| `.env.example` | Template with multi-key support    |

### Documentation

| File                            | Description              |
| ------------------------------- | ------------------------ |
| `MULTIPLE-API-KEYS-GUIDE.md`    | **How to add more keys** |
| `NVIDIA-COMPLETE-CATALOG.md`    | All 40+ models reference |
| `NVIDIA-INTEGRATION-SUMMARY.md` | Integration summary      |
| `NVIDIA-MODELS-GUIDE.md`        | Priority guide           |
| `NEMOTRON-SETUP.md`             | Setup instructions       |
| `NEMOTRON-QUICKSTART.md`        | Quick start              |

### Examples & Tests

| File                     | Description             |
| ------------------------ | ----------------------- |
| `test-nvidia-api.js`     | Simple API test         |
| `test-nvidia-aisdk.js`   | AI SDK test             |
| `test-multi-key.js`      | Multi-key rotation test |
| `nemotron-cli.js`        | CLI tool                |
| `nemotron-example.js`    | API examples            |
| `multi-model-example.js` | Multi-model test        |

---

## 🔑 Your Current Setup

### API Key Configured

```
✅ Primary: nvapi-ZeBh...
```

### To Add MORE Keys:

1. **Get additional free keys** at https://build.nvidia.com/
2. **Add to `.env.local`**:

```bash
NVIDIA_API_KEY=nvapi-primary-key...
NVIDIA_API_KEY_1=nvapi-secondary-key-1...
NVIDIA_API_KEY_2=nvapi-secondary-key-2...
NVIDIA_API_KEY_3=nvapi-secondary-key-3...
```

3. **Test multi-key rotation**:

```bash
npm run nemotron:multikey
```

---

## 🚀 Quick Start Commands

```bash
# Test single API call
node test-nvidia-api.js

# Run examples
npm run nemotron:example

# Test multiple models
npm run nemotron:models

# Test multi-key rotation (if you added multiple keys)
npm run nemotron:multikey

# Use CLI
npm run nemotron "Write a function"
```

---

## 💻 Usage Examples

### Basic (Single Key)

```javascript
import { createNemotronClient } from './src/services/ai-providers/nemotron.js';

const client = createNemotronClient(process.env.NVIDIA_API_KEY);

const response = await client.chat.completions.create({
  model: 'nvidia/nemotron-3-super-120b-a12b',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 1000,
  temperature: 1.0,
  top_p: 0.95,
  extra_body: {
    chat_template_kwargs: { enable_thinking: true },
  },
});

console.log(response.choices[0].message.content);
```

### Advanced (Multi-Key with Rotation)

```javascript
import { initNVIDIAKeys, createRotatingClient } from './src/services/ai-providers/nemotron.js';

// Initialize all keys from env
initNVIDIAKeys();

// Auto-rotates between keys
const { client, keyName } = createRotatingClient('nvidia/nemotron-3-super-120b-a12b');

console.log(`Using: ${keyName}`);

const response = await client.chat.completions.create({
  model: 'nvidia/nemotron-3-super-120b-a12b',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 1000,
});
```

### Smart Model Selection

```javascript
import { selectModel } from './src/services/ai-providers/model-selector.js';
import { createNemotronClient } from './src/services/ai-providers/nemotron.js';

// Auto-select best model for task
const model = selectModel('code'); // → Qwen-2.5 Coder 32B
const model = selectModel('math'); // → Llama-3.3 70B
const model = selectModel('vision'); // → Nemotron Nano VL 8B

const client = createNemotronClient(process.env.NVIDIA_API_KEY, model.id);

const response = await client.chat.completions.create({
  model: model.id,
  messages: [{ role: 'user', content: 'Write a function' }],
  temperature: model.temperature,
  top_p: model.topP,
});
```

---

## 📊 Model Categories

### Primary (Start Here)

- **Nemotron-3-Super 120B** - 1M context, best for agentic
- **Nemotron-3-Nano 30B** - 1M context, fast responses

### Coding

- **Qwen-2.5 Coder 32B** - Best for code generation
- **DeepSeek Coder** - Code completion
- **Phi-3 Mini 128K** - Large codebase analysis

### Reasoning

- **Llama-3.1 405B** - Highest quality
- **DeepSeek V3.2** - Math & science
- **GLM-5** - Complex systems

### Vision

- **Nemotron Nano VL 8B** - Image understanding
- **Qwen-3.5 397B VLM** - Advanced vision + language

### Embedding

- **NV Embed QA E5 V5** - Semantic search, RAG

---

## 🎯 Recommended Setup

### For Development (Free Tier)

```bash
# Get 3-5 free keys from different accounts
NVIDIA_API_KEY=nvapi-key-1...
NVIDIA_API_KEY_1=nvapi-key-2...
NVIDIA_API_KEY_2=nvapi-key-3...
```

### For Production

```bash
# Mix of free and paid tiers
NVIDIA_API_KEY=nvapi-paid-high-limit...     # Primary paid
NVIDIA_API_KEY_1=nvapi-paid-backup...        # Backup paid
NVIDIA_API_KEY_2=nvapi-free-1...             # Free tier backup
NVIDIA_API_KEY_3=nvapi-free-2...             # Free tier backup
```

---

## 📈 Monitoring & Management

### Check Key Usage

```javascript
import { keyManager } from './src/services/ai-providers/nvidia-key-manager.js';

const stats = keyManager.getUsageStats();
console.log(stats);
// [
//   { name: 'Primary', usage: 45, failures: 0, rateLimit: 100 },
//   { name: 'Secondary-1', usage: 23, failures: 1, rateLimit: 100 },
// ]
```

### Reset Counters (Hourly)

```javascript
setInterval(() => {
  keyManager.resetUsage();
  console.log('🔄 Usage reset');
}, 3600000);
```

---

## 🔒 Security Best Practices

1. ✅ Never commit `.env.local` to git
2. ✅ Use environment variables in production
3. ✅ Rotate keys every 30-90 days
4. ✅ Monitor for unusual usage
5. ✅ Use separate keys for dev/staging/production

---

## 🆘 Troubleshooting

### "No API keys found"

```bash
# Check .env.local exists
cat .env.local

# Should show:
# NVIDIA_API_KEY=nvapi-...
```

### Rate limit errors

- Add more keys (see `MULTIPLE-API-KEYS-GUIDE.md`)
- Enable automatic rotation
- Wait and retry (free tier limits reset)

### Model not found

- Check model ID in `NVIDIA-COMPLETE-CATALOG.md`
- Ensure key has access to that model

---

## 📚 Documentation Quick Links

| Document                     | When to Use        |
| ---------------------------- | ------------------ |
| `NEMOTRON-QUICKSTART.md`     | First time setup   |
| `MULTIPLE-API-KEYS-GUIDE.md` | Adding more keys   |
| `NVIDIA-COMPLETE-CATALOG.md` | Browse all models  |
| `NVIDIA-MODELS-GUIDE.md`     | Which model to use |
| This file                    | Overall reference  |

---

## 🎉 You're All Set!

### Current Status:

- ✅ 40+ models configured
- ✅ Multi-key rotation ready
- ✅ Smart model selection enabled
- ✅ API key configured
- ✅ Documentation complete

### Next Steps:

1. **Test it**: `node test-nvidia-api.js`
2. **Add more keys** (optional): See `MULTIPLE-API-KEYS-GUIDE.md`
3. **Start building**: Use in your Ultra-Dex workflows!

---

**Get more free keys**: https://build.nvidia.com/  
**Total models available**: 40+  
**Publishers**: 12+  
**One API key = Access to everything!** 🚀
