# ⚡ Ultra-Dex

> **AI orchestration meta-layer** — route tasks across 17+ providers, coordinate autonomous agent swarms, and maintain persistent memory with semantic search.

<p align="center">
  <img src="https://img.shields.io/badge/version-3.1.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg" alt="Node">
  <img src="https://img.shields.io/badge/TypeScript-100%25-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/tests-499%2F499%20passing-success" alt="Tests">
</p>

<p align="center">
  <b>Route any AI task to any provider with persistent memory.</b>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-documentation">Docs</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🚀 Quick Start

```bash
# Install globally
npm install -g @ultra-dex/cli

# Configure your providers (interactive wizard)
ultra-dex config --wizard

# Run your first task
ultra-dex run planner -t "Create a Next.js authentication system"

# Or launch a full agent swarm
ultra-dex swarm "Build a production-ready SaaS backend"
```

---

## ✨ What Makes Ultra-Dex Different

| | **Ultra-Dex** | LangGraph | CrewAI | LiteLLM |
|---|---|---|---|---|
| **Multi-provider routing** | ✅ 12+ native | Via proxy | Via proxy | ✅ 100+ |
| **Persistent memory** | ✅ 3-tier + vector | ❌ | ✅ | ❌ |
| **Governance & audit** | ✅ Built-in | ❌ | ❌ | ❌ |
| **Circuit breaker** | ✅ Per-provider | ❌ | ❌ | ❌ |
| **TypeScript native** | ✅ | ❌ Python | ❌ Python | ⚠️ Proxy |
| **Enterprise features** | ✅ RBAC, SSO, SOC2 | Partial | ❌ | ❌ |

**The pitch:** *Ultra-Dex is the only TypeScript-native orchestration layer that combines intelligent multi-provider routing with persistent memory and enterprise governance.*

---

## 🎯 Features

### 🔄 Multi-Provider Semantic Routing
Automatically route tasks to the best model based on cost, latency, and capability. Built-in circuit breakers ensure reliability.

```bash
# Uses best available provider automatically
ultra-dex run "Refactor this function"

# Or specify explicitly
ultra-dex run --provider anthropic "Complex reasoning task"
```

### 🤖 Autonomous Agent Swarms
Capability-based agent selection with self-healing loops and bounded execution.

```bash
# 8 specialized agents work together
ultra-dex swarm "Build authentication system"
# → Planner → Architect → Database → Backend → Frontend → Security → QA
```

### 🧠 Tiered Persistent Memory
Intelligent memory management (L1 Cache → L2 Redis → L3 Postgres) with vector semantic search.

```javascript
// Memory automatically enhances prompts with relevant context
const result = await ultraDex.run({
  task: "Update the API",
  memory: true  // Retrieves similar past tasks
});
```

### 🏢 Enterprise Governance
Full audit trails, RBAC, data retention policies, and compliance features.

```bash
# Every action logged with full traceability
ultra-dex logs --agent planner --since "24h"
```

---

## 📦 Installation

### Prerequisites
- Node.js ≥ 20.0.0
- npm ≥ 8.0.0

### Global Install (Recommended)
```bash
npm install -g @ultra-dex/cli
```

### Local Project
```bash
npx ultra-dex init my-project
cd my-project
npm install
```

### Docker (Production)
```bash
docker pull ultra-dex/cli:latest
docker run -it --env-file .env ultra-dex/cli run "Hello world"
```

---

## 🛠️ Configuration

Create a `.env` file:

```bash
# Required: At least one AI provider
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Production storage
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost/ultra_dex

# Optional: Features
NODE_ENV=production
LOG_LEVEL=info
```

Run the configuration wizard:
```bash
ultra-dex config --wizard
```

---

## 📖 Usage Examples

### Single Task
```bash
ultra-dex run planner -t "Create a React component for user profiles"
```

### Multi-Agent Swarm
```bash
ultra-dex swarm "Build a complete e-commerce API" \
  --provider openai \
  --max-steps 20
```

### With Specific Agent
```bash
ultra-dex run security -t "Audit this codebase for SQL injection risks"
```

### Check System Health
```bash
ultra-dex doctor
```

---

## 🤖 Supported Providers

| Provider | Models | Status |
|----------|--------|--------|
| **OpenAI** | GPT-4o, o1, GPT-4 | ✅ |
| **Anthropic** | Claude 3.5 Sonnet, Opus | ✅ |
| **Google** | Gemini 1.5 Pro, Flash | ✅ |
| **DeepSeek** | DeepSeek-V3, R1 | ✅ |
| **Mistral** | Mistral Large, Mixtral | ✅ |
| **Groq** | Llama 3.1 70B, Mixtral | ✅ |
| **Local** | Ollama, Llama.cpp | ✅ |

Plus: Cohere, Together, Yi, NVIDIA, and more.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│         CLI  │  Dashboard  │  API  │  VS Code Ext          │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 Orchestration Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Router    │ │    Swarm    │ │       Memory        │   │
│  │  (12+ AI)   │ │  (8 Agents) │ │  (3-tier + Vector)  │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Governance  │ │    MCP      │ │    Audit Trail      │   │
│  │  (RBAC)     │ │  (Plugins)  │ │   (SQLite/Postgres) │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [Quick Start](docs/guides/basics/QUICKSTART.md) | Get running in 5 minutes |
| [Architecture](docs/ARCHITECTURE.md) | System design overview |
| [Deployment](docs/DEPLOYMENT.md) | Docker, K8s, production |
| [API Reference](docs/API.md) | REST & WebSocket APIs |
| [Contributing](CONTRIBUTING.md) | Development guide |

Full docs at [docs/INDEX.md](docs/INDEX.md)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific suite
npm run test:unit
npm run test:integration

# With coverage
npm run test:coverage
```

**Current Status:** 499/499 tests passing ✅

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup
- Code standards
- Pull request process

### Quick Start for Contributors

```bash
git clone https://github.com/Srujan0798/Ultra-Dex.git
cd Ultra-Dex
npm install
npm test
```

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅ (Current)
- [x] 100% test coverage
- [x] Redis + Postgres adapters
- [x] npm publish
- [ ] GitHub public release

### Phase 2: Intelligence (Coming)
- [ ] Cost-optimized routing (multi-armed bandit)
- [ ] Agent marketplace
- [ ] LiteLLM adapter (100+ providers)
- [ ] Usage analytics

### Phase 3: Distribution (Planned)
- [ ] VS Code extension
- [ ] GitHub App
- [ ] Slack integration

See full [v2.0 Roadmap](docs/strategic/v2.0-strategic-plan.md)

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<p align="center">
  Built with 💎 by the Ultra-Dex team
</p>

<p align="center">
  <a href="https://github.com/Srujan0798/Ultra-Dex">⭐ Star us on GitHub</a>
</p>
