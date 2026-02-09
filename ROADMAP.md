# 🗺️ Ultra-Dex Roadmap: The Master Plan

> **SINGLE SOURCE OF TRUTH** for all Agents and Developers.
> **Last Updated:** Feb 9, 2026
> **Current Version:** v4.3.0 (Ecosystem Phase)

---

## 🎯 Strategic Goals
1.  **v4.x (The Ecosystem):** Build the "Outer Loop" (Docs, IDE Ext, Desktop App) around the core CLI.
2.  **v5.0 (The Moonshots):** Break the screen with Voice, Vision, and Spatial interfaces.

---

## 🏗️ Phase 1: Core Foundation (v4.0 - v4.3)

| Version | Focus Area | Key Features | Status | Prompt Source |
| :--- | :--- | :--- | :--- | :--- |
| **v4.0.0** | **The Engine** | CLI, Protocol 21, Governance | ✅ **SHIPPED** | `docs/AgPrompts/V4_IMPLEMENTATION.md` |
| **v4.1.0** | **Templates** | 5 SaaS Starters, 14 Integrations | ✅ **SHIPPED** | `docs/AgPrompts/PROMPT_01_TEMPLATES.md` |
| **v4.2.0** | **DevOps** | Docker/K8s Generators, Dashboard | ✅ **SHIPPED** | `docs/AgPrompts/PROMPT_06_DEVOPS.md` |
| **v4.3.0** | **Ecosystem** | VS Code Ext, Desktop App, Docs | ✅ **SCAFFOLDED** | `docs/AgPrompts/PROMPT_08_ECOSYSTEM.md` |

---

## 🔮 Phase 2: The Moonshots (v5.0+)

**WARNING:** These features are experimental. Agents must follow the strict specifications in `PROMPT_09`.

| Project | Description | Tech Stack | Status | Authoritative Prompt |
| :--- | :--- | :--- | :--- | :--- |
| **Siren** | **Voice Coding CLI** | OpenAI Whisper (Local), Porcupine | 🟡 PLANNED | [`PROMPT_09_V5_MOONSHOTS.md`](docs/AgPrompts/PROMPT_09_V5_MOONSHOTS.md) |
| **Ghost** | **Computer Use Agent** | Claude 3.5 Sonnet (Beta), Puppeteer | 🔴 PLANNED | [`PROMPT_09_V5_MOONSHOTS.md`](docs/AgPrompts/PROMPT_09_V5_MOONSHOTS.md) |
| **Hologram** | **3D Code Viz** | Three.js, React Three Fiber | 🟣 PLANNED | [`PROMPT_09_V5_MOONSHOTS.md`](docs/AgPrompts/PROMPT_09_V5_MOONSHOTS.md) |
| **Nexus** | **WASM Plugin System** | Wasmtime, Rust/Go SDK | 🔵 PLANNED | [`PROMPT_09_V5_MOONSHOTS.md`](docs/AgPrompts/PROMPT_09_V5_MOONSHOTS.md) |

---

## 🛡️ Governance & Rules

All agents must adhere to these constraints when implementing the roadmap:

1.  **Protocol 21:** Every task must pass the 21-step verification checklist.
2.  **Scaffold First:** Never write implementation code without a scaffold plan.
3.  **Test Driven:** Write tests before implementation (TDD).
4.  **No Hallucinations:** Verify APIs and library versions before use.

---

## 📂 Directory Map

- `cli/` - The Core Engine (Node.js)
- `dashboard/` - The Visual Interface (React)
- `extensions/vscode/` - The Editor Layer
- `apps/desktop/` - The Native Wrapper (Electron)
- `docs/AgPrompts/` - **The Brain (Agent Instructions)**
