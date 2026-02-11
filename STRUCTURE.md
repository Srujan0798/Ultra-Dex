# Ultra-Dex - AI Orchestration Meta-Layer

> The next-generation AI orchestration platform for building intelligent applications. 
> Optimized for GenAI 2.0 and beyond.

## 🏗️ Monorepo Structure

```text
/
├── apps/
│   ├── cli/            # Core CLI interface (@ultra-dex/cli)
│   ├── dashboard/      # Web-based management dashboard (@ultra-dex/dashboard)
│   ├── cloud/          # Cloud-native API & SaaS layer (@ultra-dex/cloud)
│   ├── desktop/        # Desktop application (@ultra-dex/desktop)
│   ├── mobile/         # Mobile application (@ultra-dex/mobile)
│   ├── web/            # Public web interface (@ultra-dex/web)
│   └── docs-site/      # Documentation portal (@ultra-dex/docs)
├── packages/
│   ├── core/           # Shared core business logic (@ultra-dex/core)
│   ├── sdk/            # Public SDK for building extensions (@ultra-dex/sdk)
│   ├── agent-protocol/ # Standardized agent communication (@ultra-dex/agent-protocol)
│   ├── cursor-rules/   # Optimized rules for AI-assisted dev (@ultra-dex/cursor-rules)
│   ├── plugins/        # Official & community plugins (@ultra-dex/plugins)
│   └── extensions/     # IDE extensions (VS Code, etc.)
├── docs/               # System documentation & archive
├── scripts/            # Infrastructure & maintenance scripts
├── config/             # Deployment & environment configurations
├── assets/             # Shared static assets
└── examples/           # Reference implementations & demos
```

## 🚀 Commands

```bash
# Install all dependencies (Monorepo)
npm install

# Start CLI in development mode
npm run dev

# Start Dashboard
npm run dashboard:dev

# Run full test suite
npm test

# Build all packages
npm run build
```

## 🤖 Meta-Layer Capabilities

Ultra-Dex acts as a **Meta-Layer** over existing AI ecosystems:

- **Unified Intelligence**: Standardized interface for OpenAI, Anthropic, Google, and Open Source models.
- **Persistent Memory**: Multi-tiered memory (Hot/Warm/Cold) using SQLite, ChromaDB, and Neo4j.
- **Autonomous Agents**: Self-healing, goal-oriented agent swarms with Protocol 21 verification.
- **SaaS Acceleration**: Instant scaffolding for modern SaaS stacks (Next.js 15, React 19, Tailwind 4).

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.
