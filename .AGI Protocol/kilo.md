# Kilo Code Platform: Deep Research & Tactical Use Guide

**Document Status:** 2026 Platform Review & Operating Procedures  
**Source:** Kilo Gateway  
**Tool:** Kilo Code Advanced Orchestration  
**Objective:** Maximize agentic coding efficiency, cost-effectiveness, and code accuracy by pairing specific Agent Modes with the correct Next-Gen AI Models.

---

## 1. Platform Overview

Kilo Code represents the 2026 paradigm of "vibe-coding" and agent-based engineering. Rather than treating an AI as a simple autocomplete engine (like GitHub Copilot), Kilo acts as an autonomous engineering swarm. The platform's true power lies in **Mode-Model Synergy**—the ability to configure specific agent behavioral patterns (Modes) and assign them to purpose-built LLMs (Models).

Using the wrong model for a mode results in wasted tokens, slow execution, and hallucinated codebase modifications. This document establishes the strict Standard Operating Procedure (SOP) for utilizing Kilo Code within the Ultra-Dex project.

---

## 2. Kilo Code Operational Modes

The platform enforces agent constraints through five distinct operating modes:

| Mode | Role | Behavior Restrictions |
|---|---|---|
| **Orchestrator** | The Manager | Coordinates complex tasks by delegating to specialized sub-agents in parallel based on DAG graphs. |
| **Plan** | The Architect | Strictly read-only reasoning. Reads codebase and outputs designs. **Disallows all edit tools**. |
| **Debug** | Diagnostics | Follows strict methodology: Read Logs → Reproduce → Formulate Hypothesis → Test → Fix. |
| **Code** | The Executor | Default frontline agent. Full read/write permissions. Fast output based on plans. |
| **Ask** | The Librarian | Strictly answers questions and explains codebase. Cannot make modifications. |

---

## 3. High-Performance Roster (The 2026 Models)

| Model | Profile | Strengths & Use Case |
|---|---|---|
| **MiniMax M2.5** | Heavyweight Champion | Peak reasoning (80.2% SWE-bench), equaling GPT-5.2 and Claude Opus 4.6. |
| **CoreThink** | The Optimizer | "General Symbolics" reasoning. Forces logic verification before answering. Unmatched for bugs. |
| **xAI Grok Code Fast 1** | Speed Demon | 92+ tokens/sec with 256K context. Highly cached. Instantaneous frontline edits. |
| **StepFun 3.5 Flash** | Bulk Executor | Uses 3-way Multi-Token Prediction (MTP-3) to write code at 350 tok/sec. |
| **Xiaomi MiMo-V2-Pro** | 1T Generalist | Extreme nuance in system design and documentation parsing. |
| **Xiaomi MiMo-V2-Omni** | UI Multi-modal | Unified vision/language layers. Converts images/Figma into pixel-perfect UI. |
| **Nemotron 3 Super** | Repo Reader | 1-Million token context window. Excellent for scanning the entire monorepo at once. |
| **Arcee AI Trinity** | Creative MoE | 400B sparse MoE. Extremely efficient with zero-shot creative coding. |
| **Kilo Auto Router** | Dynamic | Switches models based on prompt complexity (AVOID for deterministic CI workflows). |

---

## 4. Tactical Playbook: Optimal Mode-Model Combinations

### Scenario A: Complex Architecture & Design
* **Mode:** `Plan`
* **Model:** `MiniMax M2.5`
* **Why:** The "Architect Mindset". The model uses its token budget strictly analyzing the codebase without accidentally mangling files.

### Scenario B: Massive Multi-File Refactoring
* **Mode:** `Orchestrator`
* **Model:** `MiniMax M2.5`
* **Why:** Manages parallel sub-agents and divides massive component tasks (CJS to ESM) safely.

### Scenario C: Rapid Feature Implementation
* **Mode:** `Code`
* **Model:** `xAI Grok Code Fast 1` (or `StepFun 3.5 Flash`)
* **Why:** Raw speed following the Plan. Do not waste expensive "Pro" models on printing boilerplate.

### Scenario D: Hunting Stubborn Bugs
* **Mode:** `Debug`
* **Model:** `CoreThink`
* **Why:** Forces agents to verify logs and map stack traces instead of wildly guessing.

### Scenario E: Repo Security Scanning
* **Mode:** `Ask`
* **Model:** `NVIDIA Nemotron 3 Super`
* **Why:** Ingests the entire mono-repo (1M context) in one go to flag architectural flaws.

### Scenario F: UI from Screenshot
* **Mode:** `Code`
* **Model:** `Xiaomi MiMo-V2-Omni`
* **Why:** Native vision decoding generates perfect Tailwind CSS.

---

## 5. Standard Operating Procedure (SOP) Workflow

When tackling a new objective using Kilo Code, execute the following sequence:

1. **PHASE 1: (Plan + MiniMax M2.5)**
   Ask the agent to analyze the problem and output a `IMPLEMENTATION.md` file. Review this manually.
2. **PHASE 2: (Orchestrator - Optional)**
   If `IMPLEMENTATION.md` changes >5 files, switch to Orchestrator and provide the doc to map sub-tasks.
3. **PHASE 3: (Code + Grok Fast 1)**
   Point the Code agent at the `IMPLEMENTATION.md` and tell it to execute tasks sequentially.
4. **PHASE 4: (Debug + CoreThink)**
   Run your tests. If they fail, switch immediately to Debug mode with CoreThink and paste logs.

---

## 6. Ultra-Dex Swarm Role & Dispatch

* **Role:** High-Performance Implementation Builder
* **Best For:** Executing massive generation and logic processing where token volume speed is paramount.
* **Windows:** 1 IDE tab (Uses Kilo's UI).

### Dispatch Templates

```bash
# Workflow Initiation (In Kilo UI)
[Mode: Plan] [Model: MiniMax M2.5]
"Read the github issue 442 and output IMPLEMENTATION.md with architecture changes needed for the auth service."

[Mode: Code] [Model: Grok Code Fast 1]
"Read IMPLEMENTATION.md and modify auth-service.ts based on step 1."
```
