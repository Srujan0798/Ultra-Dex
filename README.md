# Ultra-Dex v3.1.0

> AI orchestration meta-layer — route tasks across 17+ providers, coordinate autonomous agent swarms, and maintain persistent memory with semantic search.

[![Version](https://img.shields.io/badge/version-3.1.0-blue.svg)](https://github.com/Srujan0798/Ultra-Dex)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](tsconfig.json)

Ultra-Dex is the **connective tissue between AI models, memory, and tools**. It coordinates multiple AI providers, manages agent swarms with enterprise governance, and provides persistent memory across distributed nodes.

## ✨ Features

- **Multi-Provider Semantic Routing** — Automatically route tasks to the best model (OpenAI, Anthropic, DeepSeek, etc.) based on cost, latency, and capability requirements.
- **Autonomous Agent Swarms** — Capability-based agent selection with self-healing loops, distributed mesh scaling, and sandboxed execution environments.
- **Tiered Persistent Memory** — Intelligent memory management (Instant → Session → Persistent) with vector-based semantic search and graph-based relationship mapping.
- **Enterprise Governance & Audit** — Comprehensive policy enforcement, full audit trails for all AI interactions, and multi-tenant security isolation.
- **Distributed Mesh Infrastructure** — Horizontal scaling across regions using Redis or Kafka message buses, ensuring high availability for global agent deployments.
- **MCP & Plugin Ecosystem** — Full support for the Model Context Protocol (MCP) with a plugin marketplace for extending agent capabilities with third-party tools.

## 🏗️ Architecture

```mermaid
graph TD
    subgraph ClientLayer["Client Layer"]
        CLI[CLI Tool]
        Dash[Web Dashboard]
        API[REST/WebSocket API]
    end

    subgraph OrchestrationLayer["Orchestration Meta-Layer"]
        Router[Semantic Router]
        Swarm[Agent Swarm Manager]
        Memory[Persistent Memory Tier]
        Gov[Governance & Policy]
    end

    subgraph InfrastructureLayer["Infrastructure"]
        Mesh[Distributed Mesh Bus - Redis/Kafka]
        Sandbox[Docker/WASM Sandbox]
        MCP[MCP Server Registry]
    end

    subgraph AIProviders["AI Providers"]
        ProviderHub[Provider Hub]
        OpenAI[OpenAI]
        Anthropic[Anthropic]
        Google[Google Gemini]
        DeepSeek[DeepSeek R1/V3]
        Mistral[Mistral/Mixtral]
        Local[Local Models - Ollama/Llama.cpp]
        Other[12+ More Providers]
        ProviderHub --> OpenAI
        ProviderHub --> Anthropic
        ProviderHub --> Google
        ProviderHub --> DeepSeek
        ProviderHub --> Mistral
        ProviderHub --> Local
        ProviderHub --> Other
    end

    CLI --> Router
    Dash --> API
    API --> Router
    Router --> Swarm
    Swarm --> Sandbox
    Swarm --> MCP
    Swarm --> Memory
    Router --> Mesh
    Swarm --> ProviderHub
    Memory --> Mesh
```

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g @ultra-dex/cli

# Or initialize a project locally
npx ultra-dex init my-agent-project
```

### Configure Providers

Ultra-Dex supports 17+ AI providers. Set your API keys in a `.env` file or via the CLI:

```bash
# Interactive configuration wizard
ultra-dex config --wizard
```

### Run Your First Task

```bash
# Execute a single task with the best available model
ultra-dex run "Analyze this codebase for security vulnerabilities"

# Start an autonomous swarm for complex engineering tasks
ultra-dex swarm "Build a production-ready authentication system"
```

## 🤖 Supported Providers

Ultra-Dex provides a unified interface for the following AI providers:

| Provider           | Status        | Models Supported                       |
| :----------------- | :------------ | :------------------------------------- |
| **OpenAI**         | ✅ Production | GPT-4o, GPT-4 Turbo, o1-preview        |
| **Anthropic**      | ✅ Production | Claude 3.5 Sonnet, 3 Opus, 3 Haiku     |
| **DeepSeek**       | ✅ Production | DeepSeek-V3, DeepSeek-R1               |
| **Google**         | ✅ Production | Gemini 1.5 Pro, Flash                  |
| **Mistral**        | ✅ Production | Mistral Large, Mixtral 8x22B           |
| **Groq**           | ✅ Production | Llama 3 70B, Mixtral 8x7B (Ultra-fast) |
| **Local / Ollama** | ✅ Production | Llama 3.1, Phi-3, Qwen 2               |
| **Others**         | ✅ Active     | Cohere, Together, Yi, Zhipu, Kimi      |

## 💻 CLI Reference

| Command              | Description                                       |
| :------------------- | :------------------------------------------------ |
| `ultra-dex init`     | Initialize a new workspace and configuration.     |
| `ultra-dex run`      | Execute a task using the semantic router.         |
| `ultra-dex swarm`    | Launch an autonomous agent swarm.                 |
| `ultra-dex config`   | Manage API keys and system settings.              |
| `ultra-dex doctor`   | Diagnose system health and provider connectivity. |
| `ultra-dex serve`    | Launch the API server and management dashboard.   |
| `ultra-dex generate` | Generate code, assets, or documentation.          |
| `ultra-dex quality`  | Run quality gates and project-wide linting.       |

Run `ultra-dex --help` for a full list of commands and options.

## ⚙️ Configuration

Create a `.env` file in your project root:

```bash
# --- AI Providers ---
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
GOOGLE_API_KEY=...

# --- Infrastructure ---
PORT=3000
NODE_ENV=production
BUS_TYPE=redis # 'redis' or 'kafka'
REDIS_URL=redis://localhost:6379

# --- Features ---
ENABLE_SANDBOX=true
LOG_LEVEL=info
```

For advanced configuration including K8s deployment and mesh scaling, see the [Configuration Guide](docs/DEPLOYMENT.md).

## 📚 Documentation

### Active Documentation (`docs/`)

| Document | Description |
|----------|-------------|
| [**Quick Start**](docs/guides/basics/QUICKSTART.md) | Get up and running in 5 minutes |
| [**Architecture**](docs/ARCHITECTURE.md) | System design and meta-layer overview |
| [**Deployment**](docs/DEPLOYMENT.md) | Production setup, Docker, and Kubernetes |
| [**API Reference**](docs/API.md) | REST and WebSocket API documentation |
| [**Operations**](docs/OPERATIONS.md) | Monitoring, scaling, and maintenance |
| [**V2.0 Roadmap**](docs/V2.0-ROADMAP.md) | Future development plans |

See [`docs/INDEX.md`](docs/INDEX.md) for the complete documentation index.

### Historical Documentation

Historical planning documents, completion reports, and archived content are available in the [`archive/`](archive/) directory.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for our development workflow and code standards.

## 📄 License

MIT — see [LICENSE](LICENSE)

---

**Ultra-Dex v3.1.0** — The Diamond State of AI Orchestration.
