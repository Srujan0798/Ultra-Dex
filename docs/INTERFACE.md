# Ultra-Dex Interactive Interface

Ultra-Dex provides a powerful, interactive terminal-based interface designed for modern AI orchestration and SaaS development. This document explains the primary entry points and the underlying NLP routing system.

## 1. The Omni-Box Entry Point

The **Omni-Box** is the central command hub of Ultra-Dex. It provides a unified interactive TUI (Terminal User Interface) for managing your projects and AI agents.

### Accessing the Omni-Box
You can launch the interactive dashboard using either of the following commands:

```bash
ultra-dex dashboard
# or
ultra-dex omni
```

### Key Features
-   **🚀 Project Initialization**: Quickly scaffold new projects using pre-defined templates (Next.js, Express, Flask, etc.).
-   **🤖 Agent Orchestration**: Directly invoke specialized agents like `@Planner`, `@CTO`, `@Backend`, and `@Reviewer`.
-   **📊 System Status**: Get a real-time overview of your system health, MCP server connectivity, and memory state.
-   **⚙️ Configuration**: Manage AI providers (Claude, OpenAI, Gemini, Ollama), temperature settings, and UI themes directly from the interface.
-   **🔍 Workspace Management**: Search and switch between different projects in your workspace.

---

## 2. NLP Intent Router

Ultra-Dex features an advanced **NLP Intent Router** that allows you to interact with the CLI using natural language. Instead of remembering complex flags, you can simply type what you want to achieve.

### How it Works
The router uses a combination of:
-   **Semantic Similarity**: Maps synonyms (e.g., "make", "build", "create" all map to `init` or `generate`).
-   **Fuzzy Matching**: Handles typos and near-matches for command names.
-   **Keyword Scoring**: Assigns weights to specific terms to determine the most likely user intent.

### Example Natural Language Commands
-   "Create a new Next.js project called 'ultra-app'"
-   "How is the system health?"
-   "Run the reviewer agent on this file"
-   "Start a build swarm for the auth module"
-   "Fix the system issues" (triggers System Doctor)

---

## 3. Interactive Dashboard Usage

The interactive mode (`ultra-dex dashboard`) combines a menu-driven interface with a natural language command line.

### Interaction Modes
1.  **Menu Selection**: Use arrow keys to navigate the primary action list.
2.  **Natural Language Input**: Type a request directly at the prompt. The NLP router will automatically detect your intent and execute the corresponding command.
3.  **Context Awareness**: The dashboard displays real-time information about your current project stack, active git branch, and pending changes.

### System Doctor
Accessible via the dashboard or `ultra-dex doctor`, this feature runs a diagnostic suite to identify and repair issues within your Ultra-Dex environment or project structure.

### Token Budget Monitoring
The interactive interface includes a built-in token budget monitor to help you track AI resource usage across your development sessions.
