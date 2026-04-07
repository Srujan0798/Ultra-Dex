# Ultra-Dex v3.0.0

> AI orchestration meta-layer — route tasks across providers, coordinate agent swarms, maintain persistent memory.

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/Srujan0798/Ultra-Dex)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](tsconfig.json)

Ultra-Dex is the **connective tissue between AI models, memory, and tools**. It coordinates multiple AI providers, manages agent swarms with governance, and provides persistent memory across conversations.

## ✨ Features

- **Multi-Provider Routing** — 17+ AI providers with cost/latency/quality optimization and automatic failover
- **Agent Swarms** — Capability-based agent selection, self-healing, distributed mesh scaling
- **Persistent Memory** — Tiered storage (instant → session → persistent) with semantic search
- **Governance & Audit** — Policy enforcement, audit trails, sandboxed execution
- **Distributed Mesh** — Redis/Kafka message bus for horizontal scaling across regions
- **MCP Ecosystem** — Model Context Protocol server with plugin marketplace

## 🚀 Quick Start

```bash
# Install
npm install -g ultra-dex

# Or use npx
npx ultra-dex init "Build a SaaS backend"
```

### Configure Providers

```bash
# Set your API keys
export OPENAI_API_KEY=sk-your-key
export ANTHROPIC_API_KEY=sk-ant-your-key

# Or use the config wizard
npx ultra-dex config --wizard
```

### Run Workflows

```bash
# Execute a task
npx ultra-dex run --task "Implement user auth"

# Check status
npx ultra-dex status

# Launch dashboard
npx ultra-dex dashboard
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Ultra-Dex v3.0.0                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Semantic   │  │   Agent      │  │  Predictive  │      │
│  │   Router     │  │   Sandbox    │  │   Memory     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Mesh Bus   │  │    Self-     │  │     MCP      │      │
│  │ (Redis/Kafka)│  │   Healing    │  │   Registry   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  OpenAI │ Anthropic │ Google │ Groq │ Mistral │ 15+ more   │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Installation

### Requirements
- Node.js 22+
- npm 10+
- 512MB RAM minimum (1GB recommended)

### Docker

```bash
docker build -f Dockerfile.prod -t ultra-dex:v3.0.0 .
docker-compose -f docker-compose.prod.yml up -d
```

## ⚙️ Configuration

Create `.env` file:

```bash
# AI Providers (at least one required)
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key

# Application
NODE_ENV=production
PORT=3000
BUS_TYPE=redis
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full configuration.

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests
npm run test:integration  # Integration tests
npm run test:coverage # Coverage report
```

## 📚 Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) — Production deployment
- [Operations Guide](docs/OPERATIONS.md) — Monitoring & scaling
- [Architecture](docs/ARCHITECTURE.md) — System design
- [API Reference](docs/API.md) — Programmatic usage

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT — see [LICENSE](LICENSE)

---

**Diamond State v3.0.0** — Production-ready AI orchestration
