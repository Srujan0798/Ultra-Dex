# Changelog

All notable changes to Ultra-Dex will be documented in this file.

## [3.4.2] - 2026-01-30

### Fixed

- Console logs now silent by default (only show in debug mode)
- Version sync across all files
- 13 ESLint warnings fixed (70 → 57)

### Changed

- Alignment score improved to 85%

## [3.4.1] - 2026-01-30

### Added

- **LangChain Adapter** (`cli/lib/providers/langchain.js`)
  - Chain templates: summarize, codeReview, taskBreakdown
  - RAG support with vector stores
  - Memory sync with Ultra-Dex state
- **OpenAI Assistants Sync** (`cli/lib/providers/openai-assistants.js`)
  - Thread and assistant management
  - Code interpreter support
  - Create Ultra-Dex agents as OpenAI Assistants
- **Agent Marketplace** (`ultra-dex agents`)
  - `agents list --marketplace` - Browse community agents
  - `agents install <name>` - Install marketplace agents
  - `agents create <name>` - Create custom agents
  - `agents publish <name>` - Publish to marketplace (coming soon)
  - Community agents: @SecurityAuditor, @Accessibility, @APIDesigner, @MLEngineer
- **Streaming AI** - `--stream` flag for run command

## [3.3.0] - 2026-01-30

### Added

- **sync --brain** - Autonomous CONTEXT.md updates from codebase analysis
- **Docker sandbox** (`exec` command) - Safe code execution
- **Semantic search** (`search` command) - Vector embeddings for code search
- **GitHub integration** (`github` command) - Issues sync, auto-PR
- **Cloud collaboration** (`cloud` command) - Team features
- **Monitoring system** - Health checks, metrics, debug info
- **26 Cursor Rules** - Exceeded target of 25
- **VS Code Extension** - VSIX packaging

### Fixed

- MCP server version mismatch
- All 82 tests passing (100%)
- LOG_LEVEL=silent for test output

## [3.2.0] - 2026-01-29

### Added

- MCP (Model Context Protocol) integration
- WebSocket real-time streaming
- Code Property Graph analysis
- Ollama local LLM support
- Semantic Router (hybrid cloud/local)

## [3.1.0] - 2026-01-28

### Added

- Agent SDK integration
- Anthropic Agents support
- Browser automation (Playwright)
- Interactive CLI mode
- Error recovery system

## [3.0.0] - 2026-01-27

### Added

- Complete rewrite with modular architecture
- 17 AI agents across 7 tiers
- Swarm mode for parallel execution
- Dashboard with real-time updates
- Multi-provider support (Claude, OpenAI, Gemini)

---

## Providers

| Provider          | Status | File                             |
| ----------------- | ------ | -------------------------------- |
| Claude            | ✅     | `providers/claude.js`            |
| OpenAI            | ✅     | `providers/openai.js`            |
| Gemini            | ✅     | `providers/gemini.js`            |
| Ollama            | ✅     | `providers/ollama.js`            |
| LangChain         | ✅ NEW | `providers/langchain.js`         |
| OpenAI Assistants | ✅ NEW | `providers/openai-assistants.js` |
| Agent SDK         | ✅     | `providers/agent-sdk.js`         |
| Router            | ✅     | `providers/router.js`            |

## Test Coverage

```
82/82 tests passing (100%)
```

## Links

- [npm](https://www.npmjs.com/package/ultra-dex)
- [GitHub](https://github.com/Srujan0798/Ultra-Dex)
- [Documentation](https://github.com/Srujan0798/Ultra-Dex/tree/main/docs)
