# MCP Context Bus Specification

> **Status:** Draft Specification (v1.0)
> **Source:** Orchestration/Copilot.md (Emerging Integration #1)

## 1. Overview
The Context Bus is the communication layer that allows silos (Cursor, Claude Code, GitHub Copilot) to share a single "Source of Truth" for the project.

## 2. Shared Protocol
Ultra-Dex acts as the **Central MCP Server**.

### 2.1 Standardized Resources
- `ultra://project/state`: Returns the machine-readable `state.json`.
- `ultra://project/context`: Returns `CONTEXT.md` (Decisions/Patterns).
- `ultra://memory/relevant?q=...`: Semantic search into persistent memory.

### 2.2 Standardized Tools
- `remember(text, tags)`: Allows any tool to save a new project fact.
- `query_graph(query)`: Allows any tool to understand codebase structure.
- `validate_output(code)`: Allows any tool to run the Quality Gates before suggesting a change.

## 3. Tool Adapters

| Tool | Integration Method | Role |
|------|--------------------|------|
| **Claude Desktop** | Configured as MCP Server | Planner / Reviewer |
| **Cursor IDE** | `.cursorrules` + MCP Server | Implementation |
| **CLI** | Direct Native Access | Orchestration / CI |
| **GitHub Actions** | Ultra-Dex Container | Quality Gate Enforcer |

## 4. State Sync Flow
1. **Cursor** makes a change to a file.
2. **Ultra-Dex Watch** detects the change and updates the CPG (Graph).
3. **Claude Code** asks "What changed?" and Ultra-Dex provides the diff and graph impact via the MCP Bus.
4. **All tools** now have the same updated context.
