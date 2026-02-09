# Ultra-Dex Project Context

## Project Overview
Ultra-Dex is an AI Orchestration Meta-Layer designed to manage and enhance AI tools like Cursor, Devin, and Claude Code. It provides structure, memory, and architectural context to prevent "session amnesia".

## Current Version: v5.0.0

## Key Architecture
- **CLI**: Node.js based, 135+ commands including MCTS planner, voice coding, computer use agent
- **MCP Server**: Unified kernel handling Model Context Protocol and WebSockets
- **Agents**: 17 specialized agents (CTO, Planner, Backend, Ghost, Siren, etc.)
- **Dashboard**: React + Three.js visualization (7 pages including Hologram)
- **State**: Git-versioned JSON state and markdown documentation

## v5.0 Moonshots (COMPLETE)
- ✅ Siren: Voice Coding CLI (OpenAI Whisper)
- ✅ Ghost: Computer Use Agent (GPT-4o Vision, robotjs)
- ✅ Hologram: 3D Code Visualization (React Three Fiber)
- ✅ Nexus: WASM Plugin System
- ✅ Fortress: Quantum-Safe Crypto (AES-256-GCM)
- ✅ UltraLSP: Language Server Protocol

## v5.1 Cognitive Core (IN PROGRESS)
- ✅ Neuro-Symbolic Planner (MCTS Engine)
- ⬜ Decentralized Agent Swarm (P2P Protocol)
- ⬜ Predictive Debugging (Background LLM)

## Quality Framework
- 21-Step Verification (`ultra-dex verify`)
- Protocol 21 (`cli/lib/quality/protocol-21.js`)
- Automated Gates: 15+ verification checks

## Key Files
- `ROADMAP.md`: Single source of truth
- `docs/reference/07-Rule-Book-21.md`: 21-Step Verification Framework
- `cli/lib/commands/verify.js`: Verification command
