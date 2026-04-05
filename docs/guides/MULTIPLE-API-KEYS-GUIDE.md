# Multiple API Keys Guide - Ultra-Dex

## 🔑 Why Use Multiple API Keys?

1. **Avoid Rate Limits** - Rotate keys to bypass per-key limits
2. **Higher Throughput** - Parallel requests with different keys
3. **Failover** - Automatic fallback if one key fails
4. **Load Balancing** - Distribute requests across keys
5. **Free Tier Maximization** - Use multiple free tier accounts

---

## 📝 How to Add Multiple Keys

### Method 1: Environment Variables (Recommended)

Add to your `.env.local` file:

```bash
# Primary key (highest priority)
NVIDIA_API_KEY=nvapi-primary-key-here...

# Secondary keys (lower priority)
NVIDIA_API_KEY_1=nvapi-secondary-key-1...
NVIDIA_API_KEY_2=nvapi-secondary-key-2...
NVIDIA_API_KEY_3=nvapi-secondary-key-3...
NVIDIA_API_KEY_4=nvapi-secondary-key-4...
```

**Notes:**
- Keys are used in order: `NVIDIA_API_KEY` → `NVIDIA_API_KEY_1` → `NVIDIA_API_KEY_2` → ...
- You can add as many as you want (tested up to 10+)
- Each key gets automatic rotation and failure tracking

---

### Method 2: Programmatic Addition

```javascript
import { keyManager } from './src/services/ai-providers/nvidia-key-manager.js';

// Add keys manually
keyManager.addKey('nvapi-key-1...', {
  name: 'Production-Key-1',
  priority: 10,  // Higher = used first
  rateLimit: 100, // Max 100 requests/minute
});

keyManager.addKey('nvapi-key-2...', {
  name: 'Production-Key-2',
  priority: 5,  // Lower priority
  rateLimit: 50,
});

keyManager.addKey('nvapi-key-3...', {
  name: 'Backup-Key',
  priority: 1,  // Lowest priority (backup only)
});
```

---

### Method 3: Model-Specific Keys

```javascript
import { keyManager } from './src/services/ai-providers/nvidia-key-manager.js';

// Key for high-end models only
keyManager.addKey('nvapi-premium-key...', {
  name: 'Premium-Key',
  priority: 10,
  models: [
    'nvidia/nemotron-3-super-120b-a12b',
    'meta/llama-3.1-405b-instruct',
  ],
});

// Key for coding models only
keyManager.addKey('nvapi-coding-key...', {
  name: 'Coding-Key',
  priority: 10,
  models: [
    'qwen/qwen-2.5-coder-32b-instruct',
    'deepseek-ai/deepseek-coder',
  ],
});

// General purpose key (all models)
keyManager.addKey('nvapi-general-key...', {
  name: 'General-Key',
  priority: 5,
  models: null, // null = all models
});
```

---

## 🚀 Usage Examples

### Auto-Initialize (Recommended)

```javascript
import { initNVIDIAKeys, createRotatingClient } from './src/services/ai-providers/nemotron.js';

// Initialize at app startup (loads from env)
initNVIDIAKeys();

// Create client with automatic key rotation
const { client, keyName, keyIndex } = createRotatingClient('nvidia/nemotron-3-super-120b-a12b');

console.log(`Using key: ${keyName} (index: ${keyIndex})`);

// Make requests (key rotation is automatic)
const response = await client.chat.completions.create({
  model: 'nvidia/nemotron-3-super-120b-a12b',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

### Manual Key Selection

```javascript
import { keyManager } from './src/services/ai-providers/nvidia-key-manager.js';

// Get current key info
const currentKey = keyManager.getCurrentKey();
console.log(`Current key: ${currentKey.name}`);

// Rotate to next key
const nextKey = keyManager.rotateKey();
console.log(`Rotated to: ${nextKey.name}`);

// Create client with specific key
const client = keyManager.createClient();
```

### Track Usage

```javascript
import { keyManager } from './src/services/ai-providers/nvidia-key-manager.js';

// Get usage statistics
const stats = keyManager.getUsageStats();
console.log('Key Usage:', stats);

// Example output:
// [
//   { index: 0, name: 'Primary', usage: 45, failures: 0, rateLimit: 100 },
//   { index: 1, name: 'Secondary-1', usage: 23, failures: 1, rateLimit: 100 },
//   { index: 2, name: 'Secondary-2', usage: 12, failures: 0, rateLimit: 100 },
// ]

// List all keys (masked)
const keys = keyManager.listKeys();
console.log('Keys:', keys);

// Reset counters (e.g., every hour)
keyManager.resetUsage();
keyManager.resetFailures();
```

---

## 🔄 Automatic Features

### Key Rotation
- ✅ Automatically rotates to next key on failure
- ✅ Skips keys that exceeded rate limit
- ✅ Skips keys with 5+ consecutive failures
- ✅ Prioritizes high-priority keys

### Failure Handling
```javascript
import { createRotatingClient } from './src/services/ai-providers/nemotron.js';
import { keyManager } from './src/services/ai-providers/nvidia-key-manager.js';

async function robustChat(messages) {
  const { client } = createRotatingClient('nvidia/nemotron-3-super-120b-a12b');
  
  try {
    const response = await client.chat.completions.create({
      model: 'nvidia/nemotron-3-super-120b-a12b',
      messages,
    });
    
    // Record success
    const currentKey = keyManager.getCurrentKey();
    keyManager.recordSuccess(currentKey.key);
    
    return response;
  } catch (error) {
    // Record failure (auto-rotates to next key)
    const currentKey = keyManager.getCurrentKey();
    keyManager.recordFailure(currentKey.key);
    
    // Retry with new key
    const { client: newClient } = createRotatingClient('nvidia/nemotron-3-super-120b-a12b');
    return await newClient.chat.completions.create({
      model: 'nvidia/nemotron-3-super-120b-a12b',
      messages,
    });
  }
}
```

---

## 📊 Monitoring Dashboard

```javascript
import { keyManager } from './src/services/ai-providers/nvidia-key-manager.js';

function printKeyDashboard() {
  const stats = keyManager.getUsageStats();
  
  console.log('\n=== NVIDIA API Key Dashboard ===\n');
  console.log(`Total Keys: ${stats.length}`);
  console.log(`Total Requests: ${stats.reduce((sum, s) => sum + s.usage, 0)}`);
  console.log(`Total Failures: ${stats.reduce((sum, s) => sum + s.failures, 0)}`);
  console.log('\n');
  
  stats.forEach(stat => {
    const usagePercent = ((stat.usage / stat.rateLimit) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(usagePercent / 5)) + '░'.repeat(20 - Math.floor(usagePercent / 5));
    
    console.log(`${stat.name.padEnd(15)} [${bar}] ${usagePercent}% (${stat.usage}/${stat.rateLimit})`);
    console.log(`  Failures: ${stat.failures} | Priority: ${stat.priority}`);
  });
  
  console.log('\n');
}

// Call periodically
setInterval(printKeyDashboard, 60000); // Every minute
```

---

## 💡 Best Practices

### 1. Key Organization
```bash
# Production keys (high priority)
NVIDIA_API_KEY=nvapi-prod-primary...
NVIDIA_API_KEY_1=nvapi-prod-secondary...

# Development keys (medium priority)
NVIDIA_API_KEY_2=nvapi-dev-key-1...
NVIDIA_API_KEY_3=nvapi-dev-key-2...

# Testing keys (low priority)
NVIDIA_API_KEY_4=nvapi-test-key...
```

### 2. Rate Limit Management
```javascript
// Set appropriate rate limits per key
keyManager.addKey('nvapi-free-key...', {
  name: 'Free-Tier-Key',
  priority: 5,
  rateLimit: 60, // 60 requests/minute (free tier limit)
});

keyManager.addKey('nvapi-paid-key...', {
  name: 'Paid-Tier-Key',
  priority: 10,
  rateLimit: 1000, // 1000 requests/minute (paid tier)
});
```

### 3. Automatic Reset
```javascript
// Reset usage counters every hour
setInterval(() => {
  keyManager.resetUsage();
  console.log('🔄 Hourly usage reset');
}, 3600000);

// Reset failures daily
setInterval(() => {
  keyManager.resetFailures();
  console.log('🔄 Daily failure reset');
}, 86400000);
```

### 4. Health Check
```javascript
async function healthCheck() {
  const stats = keyManager.getUsageStats();
  const healthyKeys = stats.filter(s => s.failures < 5);
  const unhealthyKeys = stats.filter(s => s.failures >= 5);
  
  console.log(`✅ Healthy keys: ${healthyKeys.length}`);
  console.log(`❌ Unhealthy keys: ${unhealthyKeys.length}`);
  
  if (unhealthyKeys.length > 0) {
    console.warn('⚠️  Consider replacing unhealthy keys');
  }
  
  return unhealthyKeys.length === 0;
}
```

---

## 🔒 Security Tips

1. **Never commit keys to git** - Add `.env.local` to `.gitignore`
2. **Use environment variables in production** - Don't hardcode keys
3. **Rotate keys periodically** - Generate new keys every 30-90 days
4. **Monitor usage** - Set up alerts for unusual activity
5. **Limit key scope** - Use model-specific keys when possible

---

## 📋 Quick Reference

| Function | Description |
|----------|-------------|
| `initNVIDIAKeys()` | Initialize from env variables |
| `keyManager.addKey()` | Add a new API key |
| `keyManager.removeKey()` | Remove a key |
| `keyManager.createClient()` | Create client with rotation |
| `keyManager.getCurrentKey()` | Get current key info |
| `keyManager.rotateKey()` | Rotate to next key |
| `keyManager.getUsageStats()` | Get usage statistics |
| `keyManager.listKeys()` | List all keys (masked) |
| `keyManager.resetUsage()` | Reset usage counters |
| `keyManager.resetFailures()` | Reset failure counters |

---

## 🎯 Example: Full Setup

```javascript
// 1. Add to .env.local
// NVIDIA_API_KEY=nvapi-primary...
// NVIDIA_API_KEY_1=nvapi-secondary-1...
// NVIDIA_API_KEY_2=nvapi-secondary-2...

// 2. Initialize in your app
import { initNVIDIAKeys, createRotatingClient } from './src/services/ai-providers/nemotron.js';

initNVIDIAKeys(); // Loads all keys from env

// 3. Use in your API calls
async function generateResponse(prompt) {
  const { client, keyName } = createRotatingClient('nvidia/nemotron-3-super-120b-a12b');
  
  console.log(`Using key: ${keyName}`);
  
  const response = await client.chat.completions.create({
    model: 'nvidia/nemotron-3-super-120b-a12b',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
    temperature: 1.0,
    top_p: 0.95,
    extra_body: {
      chat_template_kwargs: { enable_thinking: true }
    }
  });
  
  return response.choices[0].message.content;
}

// 4. Monitor usage
setInterval(() => {
  const stats = keyManager.getUsageStats();
  console.log('Current usage:', stats);
}, 60000);
```

---

**You can now add unlimited API keys for maximum throughput!** 🚀

Get more free keys at: https://build.nvidia.com/

