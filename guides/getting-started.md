# Getting Started with Ultra-Dex

Welcome to Ultra-Dex, the AI Orchestration Meta-Layer for SaaS Development. This guide will help you get started quickly with your first Ultra-Dex project.

## Prerequisites

Before you begin, ensure you have:

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- A code editor (VS Code, Cursor, etc.)

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Srujan0798/Ultra-Dex.git
   cd Ultra-Dex
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Copy the example environment file and configure your API keys:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:

   ```env
   OPENAI_API_KEY=your_openai_key_here
   ANTHROPIC_API_KEY=your_anthropic_key_here
   # Add other provider keys as needed
   ```

## Your First Ultra-Dex Project

Let's create a simple AI chatbot using Ultra-Dex.

### 1. Create a new project directory

```bash
mkdir my-first-ultra-dex-app
cd my-first-ultra-dex-app
```

### 2. Initialize npm project

```bash
npm init -y
```

### 3. Install Ultra-Dex SDK

```bash
npm install @ultra-dex/sdk
```

### 4. Create your first AI agent

Create `index.js`:

```javascript
import { UltraDex } from '@ultra-dex/sdk';

async function main() {
  // Initialize Ultra-Dex with your configuration
  const ultraDex = new UltraDex({
    providers: {
      openai: { apiKey: process.env.OPENAI_API_KEY },
      anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
    },
  });

  // Create a simple chatbot agent
  const chatbot = await ultraDex.createAgent({
    name: 'SimpleChatbot',
    description: 'A friendly AI assistant',
    model: 'gpt-4',
    instructions: 'You are a helpful assistant. Be friendly and informative.',
  });

  // Start a conversation
  const response = await chatbot.chat('Hello! Can you tell me about Ultra-Dex?');
  console.log('AI Response:', response);
}

main().catch(console.error);
```

### 5. Run your application

```bash
node index.js
```

## Next Steps

- Explore the [examples directory](../examples/) for more complex use cases
- Check out the [SDK documentation](./sdk-usage-typescript.md) for advanced features
- Learn about [MCP server integration](./mcp-server-setup.md) for IDE support
- See [deployment guides](./distributed-deployment.md) for production setup

## Need Help?

- Join our [Discord community](https://discord.gg/ultra-dex)
- Check the [troubleshooting guide](./troubleshooting.md)
- Browse [GitHub issues](https://github.com/Srujan0798/Ultra-Dex/issues)</content>
  <parameter name="filePath">guides/getting-started.md
