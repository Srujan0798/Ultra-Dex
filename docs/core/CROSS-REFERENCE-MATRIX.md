# 🔗 Ultra-Dex Documentation Cross-Reference Matrix

> **Complete mapping of related documentation**  
> **Version:** 6.0.0  
> **Last Updated:** 2026-02-10

This document provides a comprehensive cross-reference matrix to help you navigate between related Ultra-Dex documentation.

---

## 📊 Cross-Reference by Topic

### 🚀 Getting Started

| Document                                              | Related To          | See Also                                                                                                     |
| ----------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| [Getting Started](./guides/basics/GETTING_STARTED.md) | Installation, setup | [Quick Start](./api/reference/01-QUICK-START.md), [User Guide](./guides/basics/USER-GUIDE.md)                |
| [Quick Start](./api/reference/01-QUICK-START.md)      | First 5 minutes     | [Getting Started](./guides/basics/GETTING_STARTED.md), [CLI Reference](./api/reference/CLI-REFERENCE.md)     |
| [User Guide](./guides/basics/USER-GUIDE.md)           | Comprehensive usage | [Getting Started](./guides/basics/GETTING_STARTED.md), [Troubleshooting](./api/reference/TROUBLESHOOTING.md) |

### 🤖 AI & Agents

| Document                                                    | Related To            | See Also                                                                                           |
| ----------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| [AgPrompts Index](./AgPrompts/INDEX.md)                     | All agent prompts     | [AgPrompts VERSIONS](./AgPrompts/VERSIONS.md), [Custom Agents](./guides/ai/CUSTOM-AGENTS-GUIDE.md) |
| [Custom Agents](./guides/ai/CUSTOM-AGENTS-GUIDE.md)         | Creating agents       | [AgPrompts](./AgPrompts/INDEX.md), [Agent Orchestration](./guides/ai/PROJECT-ORCHESTRATION.md)     |
| [Agent Orchestration](./guides/ai/PROJECT-ORCHESTRATION.md) | Multi-agent workflows | [Custom Agents](./guides/ai/CUSTOM-AGENTS-GUIDE.md), [Architecture](./architecture/)               |
| [AI Model Selection](./guides/ai/AI-MODEL-SELECTION.md)     | Choosing AI models    | [Custom Agents](./guides/ai/CUSTOM-AGENTS-GUIDE.md), [API Reference](./api/)                       |

### 🏗️ Architecture & Design

| Document                                              | Related To      | See Also                                                                                                   |
| ----------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------- |
| [Architecture](./architecture/)                       | System design   | [MCP Integration](./api/reference/MCP-INTEGRATION.md), [Implementation Plan](../../IMPLEMENTATION-PLAN.md) |
| [Implementation Plan](../../IMPLEMENTATION-PLAN.md)   | Technical specs | [Architecture](./architecture/), [ROADMAP](../../ROADMAP.md)                                               |
| [MCP Integration](./api/reference/MCP-INTEGRATION.md) | MCP protocol    | [Architecture](./architecture/), [API Reference](./api/)                                                   |

### 🔌 API & CLI

| Document                                          | Related To        | See Also                                                                                                 |
| ------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| [CLI Reference](./api/reference/CLI-REFERENCE.md) | Command reference | [API Reference](./api/reference/API-REFERENCE.md), [Quick Start](./api/reference/01-QUICK-START.md)      |
| [API Reference](./api/reference/API-REFERENCE.md) | API documentation | [CLI Reference](./api/reference/CLI-REFERENCE.md), [MCP Integration](./api/reference/MCP-INTEGRATION.md) |
| [Plugins](./api/reference/PLUGINS.md)             | Plugin system     | [Plugin Dev](./guides/dev/PLUGIN-DEV.md), [Architecture](./architecture/)                                |

### 🚢 Deployment & Operations

| Document                                                               | Related To            | See Also                                                                                                               |
| ---------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [Production Guide](./guides/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md) | Production deployment | [CI/CD Guide](./guides/CICD-GUIDE.md), [Troubleshooting](./api/reference/TROUBLESHOOTING.md)                           |
| [CI/CD Guide](./guides/CICD-GUIDE.md)                                  | Automated deployment  | [Production Guide](./guides/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md), [Testing Guide](./guides/dev/TESTING_GUIDE.md) |
| [Troubleshooting](./api/reference/TROUBLESHOOTING.md)                  | Problem solving       | [FAQ](./api/reference/FAQ.md), [User Guide](./guides/basics/USER-GUIDE.md)                                             |

### 📚 Reference

| Document                              | Related To       | See Also                                                                                           |
| ------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| [README](../README.md)                | Project overview | [ROADMAP](../../ROADMAP.md), [Getting Started](./guides/basics/GETTING_STARTED.md)                 |
| [ROADMAP](../../ROADMAP.md)           | Future plans     | [Implementation Plan](../../IMPLEMENTATION-PLAN.md), [VERSIONS](./AgPrompts/VERSIONS.md)           |
| [VERSIONS](./AgPrompts/VERSIONS.md)   | Version history  | [CHANGELOG](./AgPrompts/CHANGELOG.md), [ROADMAP](../../ROADMAP.md)                                 |
| [CHANGELOG](./AgPrompts/CHANGELOG.md) | Change history   | [VERSIONS](./AgPrompts/VERSIONS.md), [ROADMAP](../../ROADMAP.md)                                   |
| [FAQ](./api/reference/FAQ.md)         | Common questions | [Troubleshooting](./api/reference/TROUBLESHOOTING.md), [User Guide](./guides/basics/USER-GUIDE.md) |

---

## 🎯 By Use Case

### I Want To Install Ultra-Dex

1. [Getting Started](./guides/basics/GETTING_STARTED.md)
2. [System Requirements](./guides/basics/GETTING_STARTED.md#requirements)
3. [Installation Guide](./guides/basics/GETTING_STARTED.md#installation)

### I Want To Create An Agent

1. [Custom Agents Guide](./guides/ai/CUSTOM-AGENTS-GUIDE.md)
2. [AgPrompts](./AgPrompts/INDEX.md)
3. [Agent Orchestration](./guides/ai/PROJECT-ORCHESTRATION.md)

### I Want To Deploy To Production

1. [Production Guide](./guides/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md)
2. [CI/CD Guide](./guides/CICD-GUIDE.md)
3. [Security Best Practices](./guides/ops/security.md)

### I Want To Extend Ultra-Dex

1. [Plugin Development](./guides/dev/PLUGIN-DEV.md)
2. [API Reference](./api/)
3. [Architecture](./architecture/)

### I Want To Troubleshoot

1. [Troubleshooting](./api/reference/TROUBLESHOOTING.md)
2. [FAQ](./api/reference/FAQ.md)
3. [Debugging Guide](./guides/dev/debugging.md)

---

## 🔗 By File Type

### Core Documentation

- [README](../README.md) ← Start here
- [ROADMAP](../../ROADMAP.md) ← Future plans
- [IMPLEMENTATION-PLAN](../../IMPLEMENTATION-PLAN.md) ← Technical details
- [CHANGELOG](./AgPrompts/CHANGELOG.md) ← What's new
- [VERSIONS](./AgPrompts/VERSIONS.md) ← Version history

### User Guides

- [Getting Started](./guides/basics/GETTING_STARTED.md)
- [User Guide](./guides/basics/USER-GUIDE.md)
- [Quick Start](./api/reference/01-QUICK-START.md)

### Developer Docs

- [API Reference](./api/)
- [Architecture](./architecture/)
- [Plugin Development](./guides/dev/PLUGIN-DEV.md)

### AI & Agents

- [AgPrompts](./AgPrompts/INDEX.md)
- [Custom Agents](./guides/ai/CUSTOM-AGENTS-GUIDE.md)
- [Agent Orchestration](./guides/ai/PROJECT-ORCHESTRATION.md)

---

## 📈 Documentation Map

```
Ultra-Dex Documentation
│
├── 📚 Getting Started
│   ├── Getting Started
│   ├── Quick Start
│   └── User Guide
│
├── 🤖 AI & Agents
│   ├── AgPrompts
│   ├── Custom Agents
│   ├── Agent Orchestration
│   └── Model Selection
│
├── 🔌 API & Development
│   ├── CLI Reference
│   ├── API Reference
│   ├── Plugin Development
│   └── Architecture
│
├── 🚢 Deployment
│   ├── Production Guide
│   ├── CI/CD Guide
│   └── Operations
│
└── 📖 Reference
    ├── README
    ├── ROADMAP
    ├── VERSIONS
    ├── CHANGELOG
    └── FAQ
```

---

## 🔄 Bidirectional Links

Every major document should link to:

- **Parent:** Index or category overview
- **Prerequisites:** What to read first
- **Next Steps:** What to read after
- **Related:** 2-5 related documents
- **Reference:** Supporting materials

---

## 📝 Maintenance

This cross-reference matrix is automatically validated. If you add a new document:

1. Add it to the relevant table above
2. Link to 2-5 related documents
3. Update the documentation map
4. Run validation: `node docs/scripts/validate-docs.js`

---

_Last Updated: 2026-02-10_  
_Version: 6.0.0_  
_Total Documents Cross-Referenced: 40+_
