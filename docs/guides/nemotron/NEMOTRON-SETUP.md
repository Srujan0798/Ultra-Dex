# NVIDIA Nemotron Integration for Ultra-Dex

Use **NVIDIA Nemotron-3-Super-120B-A12B** completely **FREE** via NVIDIA's API trial tier.

## Model Capabilities

- **120B parameters** (12B active) - Hybrid Mamba-Transformer MoE architecture
- **1M token context** - Process massive documents
- **Agentic reasoning** - Excellent for tool use, planning, and coding
- **Multi-language** - English, French, German, Italian, Japanese, Spanish, Chinese

## Quick Setup (2 minutes)

### Step 1: Get Free API Key

1. Go to https://build.nvidia.com/
2. Sign up for free account
3. Navigate to Nemotron-3-Super model
4. Click "Get API Key"
5. Copy your API key

### Step 2: Configure Ultra-Dex

```bash
# Create .env.local file (if not exists)
cp .env.example .env.local

# Add your NVIDIA API key
echo "NVIDIA_API_KEY=your-actual-api-key-here" >> .env.local
```

### Step 3: Run

```bash
# Using npm script
npm run nemotron "Explain quantum entanglement"

# Or directly
node nemotron-cli.js "Write a Python function to reverse a string"

# Stream responses in real-time
npm run nemotron -- --stream "Create a React component for a todo list"

# Disable reasoning for faster simple answers
npm run nemotron -- --no-thinking "What is the capital of France?"
```

## Usage Examples

### Basic Chat

```bash
npm run nemotron "Explain Docker containers in simple terms"
```

### Code Generation

```bash
npm run nemotron "Create an Express.js API endpoint with authentication"
```

### Streaming (real-time output)

```bash
npm run nemotron -- --stream "Write a complete Node.js REST API with CRUD operations"
```

### Programmatic Usage

```javascript
import { createNemotronClient, chatWithNemotron } from './src/services/ai-providers/nemotron.js';

// Create client
const client = createNemotronClient(process.env.NVIDIA_API_KEY);

// Chat
const response = await chatWithNemotron({
  client,
  messages: [{ role: 'user', content: 'Hello, how are you?' }],
  enableThinking: true, // Enable reasoning traces
  maxTokens: 4096,
});

console.log(response);
```

### With Reasoning Control

```javascript
// Enable reasoning (default) - better for complex tasks
await chatWithNemotron({
  client,
  messages: [{ role: 'user', content: 'Solve this math problem...' }],
  enableThinking: true,
});

// Disable reasoning - faster for simple queries
await chatWithNemotron({
  client,
  messages: [{ role: 'user', content: 'What is 2+2?' }],
  enableThinking: false,
});

// Low-effort reasoning - middle ground
await chatWithNemotron({
  client,
  messages: [{ role: 'user', content: 'Explain photosynthesis' }],
  enableThinking: true,
  lowEffort: true,
});
```

## CLI Options

| Option          | Alias | Description                     |
| --------------- | ----- | ------------------------------- |
| `--stream`      | `-s`  | Stream response in real-time    |
| `--no-thinking` | -     | Disable reasoning mode (faster) |
| `--help`        | `-h`  | Show help message               |

## API Limits (Free Tier)

- **Rate limits**: Varies by NVIDIA's current free tier policy
- **Max context**: 1M tokens
- **Max output**: 32K tokens
- **Commercial use**: Allowed under NVIDIA Nemotron Open Model License

## Troubleshooting

### "NVIDIA_API_KEY not found"

Make sure you have `.env.local` file with your API key:

```bash
NVIDIA_API_KEY=nvapi-xxxxx...
```

### Rate limit errors

The free tier has usage limits. Wait a few minutes and retry, or consider:

- Using `--no-thinking` for simpler queries (uses fewer tokens)
- Using `lowEffort: true` in programmatic usage

### Model not found

Ensure you're using the correct model ID: `nvidia/nemotron-3-super-120b-a12b`

## Advanced: Self-Hosting (Optional)

If you have 8× H100-80GB GPUs, you can self-host:

```bash
# Using vLLM
vllm serve nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16 \
  --tensor-parallel-size 8 \
  --reasoning_parser super_v3
```

Then update the client baseURL:

```javascript
const client = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'EMPTY',
});
```

## Resources

- [NVIDIA API Catalog](https://build.nvidia.com/)
- [Model Card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16)
- [Technical Report](https://arxiv.org/abs/2512.20856)
- [NeMo Framework](https://github.com/NVIDIA/NeMo)

## License

NVIDIA Nemotron Open Model License (commercial use permitted)
