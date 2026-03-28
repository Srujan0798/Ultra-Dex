# Kilo Code Platform: Deep Research & Tactical Use Guide

**Document Status:** 2026 Platform Review & Operating Procedures  
**Topic:** Kilo Code Advanced Orchestration  
**Objective:** Maximize agentic coding efficiency, cost-effectiveness, and code accuracy by pairing specific Agent Modes with the correct Next-Gen AI Models.

---

## 1. Platform Overview

Kilo Code represents the 2026 paradigm of "vibe-coding" and agent-based engineering. Rather than treating an AI as a simple autocomplete engine (like GitHub Copilot), Kilo acts as an autonomous engineering swarm. The platform's true power lies in **Mode-Model Synergy**—the ability to configure specific agent behavioral patterns (Modes) and assign them to purpose-built LLMs (Models).

Using the wrong model for a mode results in wasted tokens, slow execution, and hallucinated codebase modifications. This document establishes the strict Standard Operating Procedure (SOP) for utilizing Kilo Code within the Ultra-Dex project.

---

## 2. Kilo Code Operational Modes

The platform enforces agent constraints through five distinct operating modes:

1. **Orchestrator Mode:** 
   * **Role:** The Manager. 
   * **Behavior:** Coordinates complex tasks by delegating to specialized sub-agents in parallel. It breaks down prompts into step-by-step execution graphs.
2. **Plan Mode:**
   * **Role:** The Architect.
   * **Behavior:** Strictly read-only reasoning. It uses tools to read the codebase and outputs architecture designs, but **disallows all edit tools**. This prevents destructive actions during the planning phase.
3. **Debug Mode:**
   * **Role:** The Diagnostics Specialist.
   * **Behavior:** Follows a strict, systematic debugging methodology: Read Logs → Reproduce → Formulate Hypothesis → Test → Fix.
4. **Code Mode:**
   * **Role:** The Executor.
   * **Behavior:** The default frontline agent. It possesses full read/write permissions and is optimized for quickly outputting working code files based on plans.
5. **Ask Mode:**
   * **Role:** The Librarian/Teacher.
   * **Behavior:** Strictly answers questions and explains codebase mechanisms without making or suggesting immediate file changes.

---

## 3. High-Performance Roster (The 2026 Models)

Based on deep integration benchmarks, here is the functional reality of the models available in the Kilo Gateway:

* **MiniMax M2.5:** 
  * *Profile:* The Heavyweight Champion. (80.2% SWE-bench). 
  * *Strengths:* Absolute peak reasoning, equaling GPT-5.2 and Claude Opus 4.6, but heavily optimized for software engineering planning.
* **CoreThink:** 
  * *Profile:* The Optimizer. 
  * *Strengths:* Implements "General Symbolics" reasoning. It forces underlying reasoning steps to be verified logically before emitting answers. Unmatched for tricky logic bugs.
* **xAI Grok Code Fast 1 Optimized:** 
  * *Profile:* The Speed Demon. 
  * *Strengths:* Generates 92+ tokens/sec with 256K context. Highly cached. Ideal for lightning-fast edits.
* **StepFun Step 3.5 Flash:** 
  * *Profile:* The Bulk Executor.
  * *Strengths:* Uses 3-way Multi-Token Prediction (MTP-3) to write code at 350 tok/sec. 
* **Xiaomi MiMo-V2-Pro:** 1 Trillion+ parameter generalist. Extreme nuance in system design.
* **Xiaomi MiMo-V2-Omni:** Features unified vision/language layers. The absolute best model for converting Figma/Images into pixel-perfect UI code.
* **NVIDIA Nemotron 3 Super:** Features a 1-Million token context window. Excellent at reviewing entire codebases at once.
* **Arcee AI Trinity Large Preview:** 400B sparse MoE. Extremely efficient with zero-shot creative coding.
* **Kilo Auto / Free Models Router:** Dynamic routers that switch models based on prompt complexity (useful for lazy querying, but bad for deterministic workflows).

---

## 4. Tactical Playbook: Optimal Mode-Model Combinations

To achieve maximum velocity and accuracy, rigidly adhere to these pair mappings based on the task at hand:

### Scenario A: Complex System Architecture & Feature Design
* **Mode:** `Plan`
* **Model:** `MiniMax M2.5` (or `Xiaomi MiMo-V2-Pro`)
* **Why:** You need the highest tier of "Architect Mindset" reasoning. Because `Plan` mode disables edits, the model can spend its entire token budget analyzing the codebase deeply without accidentally mangling files.

### Scenario B: Massive Multi-File Refactoring (e.g., CJS to ESM)
* **Mode:** `Orchestrator`
* **Model:** `MiniMax M2.5`
* **Why:** The Orchestrator manages parallel sub-agents. It requires a highly intelligent model to divide work effectively. MiniMax has the context awareness to delegate file-by-file migrations correctly.

### Scenario C: Rapid Feature Implementation & Boilerplate Generation
* **Mode:** `Code`
* **Model:** `xAI Grok Code Fast 1` (or `StepFun 3.5 Flash`)
* **Why:** Once a plan is established, you want raw speed. Grok Code Fast 1 outputs code nearly instantaneously. Its 256K context allows it to read the Plan and implement the files in seconds. Do not waste expensive "Pro" models on typing out boilerplate.

### Scenario D: Hunting Stubborn, Undocumented Bugs
* **Mode:** `Debug`
* **Model:** `CoreThink`
* **Why:** Debugging requires hypothesis testing. CoreThink's "General Symbolics" layer prevents the AI from wildly guessing; it forces the agent to read logs, map stack traces, and systematically verify the root cause.

### Scenario E: Whole-Repository Code Reviews
* **Mode:** `Ask`
* **Model:** `NVIDIA Nemotron 3 Super`
* **Why:** If you need to assess the entire backend for security vulnerabilities, Nemotron's 1-Million context limit can ingest the entire mono-repo in one go and highlight issues without hallucinating.

### Scenario F: Building Frontend from UI Screenshots
* **Mode:** `Code`
* **Model:** `Xiaomi MiMo-V2-Omni`
* **Why:** Omni's native multimedia processing means it actually "sees" the screenshot accurately rather than reading a text-vector approximation. It will output perfectly aligned Tailwind/CSS.

---

## 5. Standard Operating Procedure (SOP) Workflow

When tackling a new objective using Kilo Code, execute the following sequence:

1. **PHASE 1: (Plan + MiniMax M2.5)**
   * Ask the agent to analyze the problem and output a `IMPLEMENTATION.md` file. Review this file manually.
2. **PHASE 2: (Orchestrator) - *Optional***
   * If the `IMPLEMENTATION.md` involves more than 5 files, switch to Orchestrator and provide the doc so it can assign sub-tasks.
3. **PHASE 3: (Code + Grok Fast 1)**
   * Point the Code agent at the `IMPLEMENTATION.md` and tell it to execute Step 1, then Step 2, etc. Enjoy instant token generation.
4. **PHASE 4: (Debug + CoreThink)**
   * Run your tests. If they fail, switch immediately to Debug mode with CoreThink. Paste the terminal error output.

By strictly utilizing this **Plan (Heavy) → Code (Fast) → Debug (Precise)** pipeline, you eliminate the common AI coding traps of infinite loops, code regressions, and expensive token waste.
